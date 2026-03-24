const axios  = require('axios');
const jwt    = require('jsonwebtoken');
const SocialAccount = require('../models/SocialAccount');
const cfg    = require('../config/oauthConfig');

const { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI } = cfg.linkedin;
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
    response_type: 'code',
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    state,
    scope: 'openid profile email w_member_social',
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
};

exports.callback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/social-media?error=linkedin_denied`);

  let stateData;
  try { stateData = jwt.verify(state, process.env.JWT_SECRET); }
  catch { return res.redirect(`${FRONTEND_URL}/social-media?error=invalid_state`); }

  const { tenantId, userId } = stateData;

  try {
    const tokenRes = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, expires_in, refresh_token } = tokenRes.data;

    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const p = profileRes.data;

    await SocialAccount.findOneAndUpdate(
      { tenant: tenantId, platform: 'linkedin' },
      {
        accountName:    p.name    || '',
        accountHandle:  p.email   || p.sub || '',
        accountUrl:     `https://www.linkedin.com/in/${p.sub}`,
        profileImage:   p.picture || '',
        isConnected:    true,
        status:         'connected',
        accessToken:    access_token,
        refreshToken:   refresh_token || '',
        tokenExpiry:    new Date(Date.now() + (expires_in || 3600) * 1000),
        platformUserId: p.sub,
        lastSyncAt:     new Date(),
        createdBy:      userId,
      },
      { upsert: true, new: true }
    );

    res.redirect(`${FRONTEND_URL}/social-media?connected=linkedin`);
  } catch (err) {
    console.error('LinkedIn OAuth error:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/social-media?error=linkedin_failed`);
  }
};
