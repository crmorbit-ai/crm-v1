const crypto = require('crypto');
const axios  = require('axios');
const jwt    = require('jsonwebtoken');
const SocialAccount = require('../models/SocialAccount');
const cfg    = require('../config/oauthConfig');

const { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI } = cfg.twitter;
const { FRONTEND_URL } = cfg;

const pkceStore  = new Map();
const genVerifier  = () => crypto.randomBytes(32).toString('base64url');
const genChallenge = (v) => crypto.createHash('sha256').update(v).digest('base64url');

exports.initiate = (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');

  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return res.status(401).send('Invalid token'); }

  const codeVerifier  = genVerifier();
  const codeChallenge = genChallenge(codeVerifier);

  const state = jwt.sign(
    { tenantId: payload.tenant, userId: payload.id, nonce: Math.random().toString(36) },
    process.env.JWT_SECRET, { expiresIn: '10m' }
  );

  pkceStore.set(state, codeVerifier);
  setTimeout(() => pkceStore.delete(state), 10 * 60 * 1000);

  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             CLIENT_ID,
    redirect_uri:          REDIRECT_URI,
    scope:                 'tweet.read tweet.write users.read offline.access',
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
};

exports.callback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/social-media?error=twitter_denied`);

  const codeVerifier = pkceStore.get(state);
  if (!codeVerifier) return res.redirect(`${FRONTEND_URL}/social-media?error=invalid_state`);
  pkceStore.delete(state);

  let stateData;
  try { stateData = jwt.verify(state, process.env.JWT_SECRET); }
  catch { return res.redirect(`${FRONTEND_URL}/social-media?error=invalid_state`); }

  const { tenantId, userId } = stateData;

  try {
    const tokenRes = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
      {
        auth:    { username: CLIENT_ID, password: CLIENT_SECRET },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    const userRes = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
      params:  { 'user.fields': 'name,username,profile_image_url,public_metrics' },
    });
    const u = userRes.data.data;

    await SocialAccount.findOneAndUpdate(
      { tenant: tenantId, platform: 'twitter' },
      {
        accountName:    u.name,
        accountHandle:  u.username,
        accountUrl:     `https://twitter.com/${u.username}`,
        profileImage:   u.profile_image_url || '',
        isConnected:    true,
        status:         'connected',
        accessToken:    access_token,
        refreshToken:   refresh_token || '',
        tokenExpiry:    expires_in ? new Date(Date.now() + expires_in * 1000) : null,
        platformUserId: u.id,
        followers:      u.public_metrics?.followers_count || 0,
        lastSyncAt:     new Date(),
        createdBy:      userId,
      },
      { upsert: true, new: true }
    );

    res.redirect(`${FRONTEND_URL}/social-media?connected=twitter`);
  } catch (err) {
    console.error('Twitter OAuth error:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/social-media?error=twitter_failed`);
  }
};
