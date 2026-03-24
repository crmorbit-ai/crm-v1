const axios = require('axios');

/**
 * Post to a Facebook Page feed using Graph API.
 * platformUserId = Page ID (set during OAuth).
 */
exports.publishPost = async (account, content) => {
  if (!account?.accessToken || !account?.platformUserId) {
    throw new Error('Facebook not properly connected (missing token or Page ID)');
  }

  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${account.platformUserId}/feed`,
    { message: content, access_token: account.accessToken }
  );
  return response.data; // { id: 'page_id_post_id' }
};
