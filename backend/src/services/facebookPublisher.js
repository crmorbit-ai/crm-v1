const axios = require('axios');

/**
 * Post to a Facebook Page feed (with optional media) using Graph API.
 * platformUserId = Page ID (set during OAuth).
 */
exports.publishPost = async (account, content, media = []) => {
  if (!account?.accessToken || !account?.platformUserId) {
    throw new Error('Facebook not properly connected (missing token or Page ID)');
  }

  const payload = {
    message: content,
    access_token: account.accessToken,
  };

  // Add media if present
  if (media && media.length > 0) {
    const firstMedia = media[0];

    if (firstMedia.type === 'video') {
      // Video post - use /videos endpoint
      payload.file_url = firstMedia.url;
      payload.description = content;
      delete payload.message;

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${account.platformUserId}/videos`,
        payload
      );
      return response.data;
    } else {
      // Image post - use /photos endpoint
      payload.url = firstMedia.url;

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${account.platformUserId}/photos`,
        payload
      );
      return response.data;
    }
  }

  // Text-only post
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${account.platformUserId}/feed`,
    payload
  );
  return response.data; // { id: 'page_id_post_id' }
};
