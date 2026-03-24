const axios = require('axios');
const jwt   = require('jsonwebtoken');
const SocialAccount = require('../models/SocialAccount');
const cfg   = require('../config/oauthConfig');

const { appId: APP_ID, appSecret: APP_SECRET, redirectUri: REDIRECT_URI } = cfg.instagram;
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
    scope:         'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
    state,
    response_type: 'code',
  });

  res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`);
};

exports.callback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/social-media?error=instagram_denied`);

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

    const pagesRes = await axios.get(`${FB_API}/me/accounts`, {
      params: { access_token: longToken },
    });
    const pages = pagesRes.data.data || [];

    let igAccountId = null;
    let pageToken   = null;

    for (const page of pages) {
      const igRes = await axios.get(`${FB_API}/${page.id}`, {
        params: { fields: 'instagram_business_account', access_token: page.access_token },
      });
      if (igRes.data.instagram_business_account) {
        igAccountId = igRes.data.instagram_business_account.id;
        pageToken   = page.access_token;
        break;
      }
    }

    if (!igAccountId) {
      return res.redirect(`${FRONTEND_URL}/social-media?error=instagram_no_business`);
    }

    const igRes = await axios.get(`${FB_API}/${igAccountId}`, {
      params: { fields: 'username,name,profile_picture_url,followers_count,media_count', access_token: pageToken },
    });
    const ig = igRes.data;

    await SocialAccount.findOneAndUpdate(
      { tenant: tenantId, platform: 'instagram' },
      {
        accountName:    ig.name || ig.username,
        accountHandle:  ig.username,
        accountUrl:     `https://www.instagram.com/${ig.username}`,
        profileImage:   ig.profile_picture_url || '',
        isConnected:    true,
        status:         'connected',
        accessToken:    pageToken,
        refreshToken:   '',
        tokenExpiry:    null,
        platformUserId: igAccountId,
        followers:      ig.followers_count || 0,
        totalPosts:     ig.media_count     || 0,
        lastSyncAt:     new Date(),
        createdBy:      userId,
      },
      { upsert: true, new: true }
    );

    res.redirect(`${FRONTEND_URL}/social-media?connected=instagram`);
  } catch (err) {
    console.error('Instagram OAuth error:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/social-media?error=instagram_failed`);
  }
};
