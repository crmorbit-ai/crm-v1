const axios = require('axios');
const FormData = require('form-data');

/**
 * Post a tweet (with optional media) using Twitter API v2.
 */
exports.publishPost = async (account, content, media = []) => {
  if (!account?.accessToken) throw new Error('Twitter not connected');

  const payload = { text: content };

  // Upload media first if present
  if (media && media.length > 0) {
    try {
      const mediaIds = [];

      for (const m of media.slice(0, 4)) { // Twitter allows max 4 images or 1 video per tweet
        // Download media from URL
        const mediaResponse = await axios.get(m.url, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(mediaResponse.data);

        // Upload to Twitter v1.1 media endpoint (v2 doesn't have upload yet)
        const formData = new FormData();
        formData.append('media', mediaBuffer, {
          filename: m.type === 'video' ? 'video.mp4' : 'image.jpg',
          contentType: m.type === 'video' ? 'video/mp4' : 'image/jpeg',
        });

        const uploadRes = await axios.post(
          'https://upload.twitter.com/1.1/media/upload.json',
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${account.accessToken}`,
            },
          }
        );

        mediaIds.push(uploadRes.data.media_id_string);
      }

      if (mediaIds.length > 0) {
        payload.media = { media_ids: mediaIds };
      }
    } catch (uploadErr) {
      console.error('⚠️ Twitter media upload failed:', uploadErr.response?.data || uploadErr.message);
      // Continue with text-only post if media upload fails
    }
  }

  const response = await axios.post(
    'https://api.twitter.com/2/tweets',
    payload,
    { headers: { Authorization: `Bearer ${account.accessToken}`, 'Content-Type': 'application/json' } }
  );
  return response.data; // { data: { id, text } }
};
