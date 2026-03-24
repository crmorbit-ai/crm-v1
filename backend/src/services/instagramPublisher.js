const axios = require('axios');

/**
 * Publish an image post to Instagram Business account.
 * Instagram Graph API requires an image URL — text-only posts not supported.
 *
 * Step 1: Create media container → get creation_id
 * Step 2: Publish the container
 */
exports.publishPost = async (account, content, imageUrl = null) => {
  if (!account?.accessToken || !account?.platformUserId) {
    throw new Error('Instagram not properly connected');
  }
  if (!imageUrl) {
    throw new Error('Instagram requires an image URL — text-only posts are not supported by the Instagram API');
  }

  const base = `https://graph.facebook.com/v18.0/${account.platformUserId}`;

  // Step 1: Create media container
  const containerRes = await axios.post(`${base}/media`, {
    image_url:    imageUrl,
    caption:      content,
    access_token: account.accessToken,
  });
  const creationId = containerRes.data.id;

  // Step 2: Publish
  const publishRes = await axios.post(`${base}/media_publish`, {
    creation_id:  creationId,
    access_token: account.accessToken,
  });
  return publishRes.data;
};
