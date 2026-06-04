const axios = require('axios');

/**
 * Publish an image post to Instagram Business account.
 * Instagram Graph API requires an image URL — text-only posts not supported.
 *
 * Step 1: Create media container → get creation_id
 * Step 2: Publish the container
 */
exports.publishPost = async (account, content, media = []) => {
  if (!account?.accessToken || !account?.platformUserId) {
    throw new Error('Instagram not properly connected');
  }

  // Extract media from array
  const firstMedia = media && media.length > 0 ? media[0] : null;

  if (!firstMedia) {
    throw new Error('Instagram requires media (image or video) — text-only posts are not supported by the Instagram API');
  }

  const base = `https://graph.facebook.com/v18.0/${account.platformUserId}`;
  const isVideo = firstMedia.type === 'video';

  // Step 1: Create media container
  const containerPayload = {
    caption:      content,
    access_token: account.accessToken,
  };

  if (isVideo) {
    containerPayload.video_url = firstMedia.url;
    containerPayload.media_type = 'VIDEO';
  } else {
    containerPayload.image_url = firstMedia.url;
  }

  const containerRes = await axios.post(`${base}/media`, containerPayload);
  const creationId = containerRes.data.id;

  // Step 2: Wait if video (processing time)
  if (isVideo) {
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 sec wait for video processing
  }

  // Step 3: Publish
  const publishRes = await axios.post(`${base}/media_publish`, {
    creation_id:  creationId,
    access_token: account.accessToken,
  });
  return publishRes.data;
};
