const axios = require('axios');
const jwt   = require('jsonwebtoken');
const SocialAccount = require('../models/SocialAccount');
const cfg   = require('../config/oauthConfig');

const { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI } = cfg.google;
const { FRONTEND_URL } = cfg;

exports.initiate = (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');

  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return res.status(401).send('Invalid token'); }

  const state = jwt.sign(
    { tenantId: payload.tenant, userId: payload.id, nonce: Math.random().toString(36) },
    process.env.JWT_SECRET, { expiresIn: '10m' }
  );

  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload openid profile email',
    state,
    access_type:   'offline',
    prompt:        'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

exports.callback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/social-media?error=youtube_denied`);

  let stateData;
  try { stateData = jwt.verify(state, process.env.JWT_SECRET); }
  catch { return res.redirect(`${FRONTEND_URL}/social-media?error=invalid_state`); }

  const { tenantId, userId } = stateData;

  try {
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params:  { part: 'snippet,statistics', mine: true },
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const channel = channelRes.data.items?.[0];
    const snippet = channel?.snippet    || {};
    const stats   = channel?.statistics || {};

    await SocialAccount.findOneAndUpdate(
      { tenant: tenantId, platform: 'youtube' },
      {
        accountName:    snippet.title || '',
        accountHandle:  snippet.customUrl || channel?.id || '',
        accountUrl:     `https://www.youtube.com/channel/${channel?.id}`,
        profileImage:   snippet.thumbnails?.default?.url || '',
        isConnected:    true,
        status:         'connected',
        accessToken:    access_token,
        refreshToken:   refresh_token || '',
        tokenExpiry:    new Date(Date.now() + (expires_in || 3600) * 1000),
        platformUserId: channel?.id || '',
        followers:      parseInt(stats.subscriberCount) || 0,
        totalPosts:     parseInt(stats.videoCount)      || 0,
        lastSyncAt:     new Date(),
        createdBy:      userId,
      },
      { upsert: true, new: true }
    );

    res.redirect(`${FRONTEND_URL}/social-media?connected=youtube`);
  } catch (err) {
    console.error('YouTube OAuth error:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/social-media?error=youtube_failed`);
  }
};
