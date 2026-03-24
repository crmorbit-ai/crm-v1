const axios = require('axios');
const jwt   = require('jsonwebtoken');
const SocialAccount = require('../models/SocialAccount');
const cfg   = require('../config/oauthConfig');

const { appId: APP_ID, appSecret: APP_SECRET, redirectUri: REDIRECT_URI } = cfg.facebook;
const { FRONTEND_URL } = cfg;
const FB_API = 'https://graph.facebook.com/v18.0';

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
    client_id:     APP_ID,
    redirect_uri:  REDIRECT_URI,
    scope:         'pages_manage_posts,pages_read_engagement,pages_show_list,public_profile',
    state,
    response_type: 'code',
  });

  res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`);
};

exports.callback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/social-media?error=facebook_denied`);

  let stateData;
  try { stateData = jwt.verify(state, process.env.JWT_SECRET); }
  catch { return res.redirect(`${FRONTEND_URL}/social-media?error=invalid_state`); }

  const { tenantId, userId } = stateData;

  try {
    const shortRes = await axios.get(`${FB_API}/oauth/access_token`, {
      params: { client_id: APP_ID, client_secret: APP_SECRET, redirect_uri: REDIRECT_URI, code },
    });

    const longRes = await axios.get(`${FB_API}/oauth/access_token`, {
      params: {
        grant_type:        'fb_exchange_token',
        client_id:         APP_ID,
        client_secret:     APP_SECRET,
        fb_exchange_token: shortRes.data.access_token,
      },
    });
    const longToken = longRes.data.access_token;
    const expiresIn = longRes.data.expires_in;

    const profileRes = await axios.get(`${FB_API}/me`, {
      params: { access_token: longToken, fields: 'id,name,picture' },
    });
    const profile = profileRes.data;

    const pagesRes = await axios.get(`${FB_API}/me/accounts`, {
      params: { access_token: longToken },
    });
    const page = pagesRes.data.data?.[0];

    const finalToken = page?.access_token || longToken;
    const pageId     = page?.id           || profile.id;
    const pageName   = page?.name         || profile.name;

    await SocialAccount.findOneAndUpdate(
      { tenant: tenantId, platform: 'facebook' },
      {
        accountName:    pageName,
        accountHandle:  pageId,
        accountUrl:     `https://www.facebook.com/${pageId}`,
        profileImage:   profile.picture?.data?.url || '',
        isConnected:    true,
        status:         'connected',
        accessToken:    finalToken,
        refreshToken:   '',
        tokenExpiry:    expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
        platformUserId: pageId,
        lastSyncAt:     new Date(),
        createdBy:      userId,
      },
      { upsert: true, new: true }
    );

    res.redirect(`${FRONTEND_URL}/social-media?connected=facebook`);
  } catch (err) {
    console.error('Facebook OAuth error:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/social-media?error=facebook_failed`);
  }
};
