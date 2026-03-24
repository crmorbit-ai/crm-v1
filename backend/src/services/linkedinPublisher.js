const axios = require('axios');

/**
 * Publish a text post to LinkedIn using the newer REST Posts API (2024).
 * Falls back to UGC Posts API if REST fails.
 */
exports.publishPost = async (account, content) => {
  if (!account?.accessToken || !account?.platformUserId) {
    throw new Error('LinkedIn account not properly connected (missing token or user ID)');
  }

  if (account.tokenExpiry && new Date() > new Date(account.tokenExpiry)) {
    throw new Error('LinkedIn access token has expired — please reconnect your account');
  }

  const headers = {
    Authorization:               `Bearer ${account.accessToken}`,
    'Content-Type':              'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version':          '202401',
  };

  // ── Try newer REST Posts API first ────────────────────────────
  try {
    const body = {
      author:         `urn:li:person:${account.platformUserId}`,
      commentary:     content,
      visibility:     'PUBLIC',
      distribution: {
        feedDistribution:             'MAIN_FEED',
        targetEntities:               [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState:              'PUBLISHED',
      isReshareDisabledByAuthor:   false,
    };

    const res = await axios.post('https://api.linkedin.com/rest/posts', body, { headers });
    console.log('✅ LinkedIn post published via REST API:', res.headers?.['x-restli-id'] || res.status);
    return { id: res.headers?.['x-restli-id'], api: 'rest' };
  } catch (restErr) {
    console.warn('⚠️ LinkedIn REST API failed, trying UGC Posts API:', restErr.response?.data || restErr.message);

    // ── Fallback: UGC Posts API ──────────────────────────────────
    const ugcBody = {
      author:         `urn:li:person:${account.platformUserId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary:    { text: content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const ugcRes = await axios.post('https://api.linkedin.com/v2/ugcPosts', ugcBody, {
      headers: {
        Authorization:               `Bearer ${account.accessToken}`,
        'Content-Type':              'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    console.log('✅ LinkedIn post published via UGC API:', ugcRes.data?.id);
    return { id: ugcRes.data?.id, api: 'ugc' };
  }
};
