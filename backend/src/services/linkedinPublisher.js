const axios = require('axios');

/**
 * Upload media (image/video) to LinkedIn and get asset URN.
 */
async function uploadMediaToLinkedIn(account, mediaUrl, mediaType) {
  const headers = {
    Authorization: `Bearer ${account.accessToken}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
  };

  // Step 1: Register upload
  const registerPayload = {
    registerUploadRequest: {
      recipes: [mediaType === 'video' ? 'urn:li:digitalmediaRecipe:feedshare-video' : 'urn:li:digitalmediaRecipe:feedshare-image'],
      owner: `urn:li:person:${account.platformUserId}`,
      serviceRelationships: [{
        relationshipType: 'OWNER',
        identifier: 'urn:li:userGeneratedContent',
      }],
    },
  };

  const registerRes = await axios.post(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    registerPayload,
    { headers }
  );

  const uploadUrl = registerRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = registerRes.data.value.asset;

  // Step 2: Download media from URL
  const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
  const mediaBuffer = Buffer.from(mediaResponse.data);

  // Step 3: Upload to LinkedIn
  await axios.put(uploadUrl, mediaBuffer, {
    headers: {
      'Content-Type': mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
    },
  });

  return asset; // Return asset URN
}

/**
 * Publish a text post (with optional media) to LinkedIn using the newer REST Posts API (2024).
 * Falls back to UGC Posts API if REST fails.
 */
exports.publishPost = async (account, content, media = []) => {
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

    // Upload media first if present
    if (media && media.length > 0) {
      const firstMedia = media[0];

      try {
        const assetUrn = await uploadMediaToLinkedIn(account, firstMedia.url, firstMedia.type);

        body.content = {
          media: {
            title: firstMedia.type === 'video' ? 'Shared video' : 'Shared media',
            id: assetUrn,
          },
        };
      } catch (uploadErr) {
        console.error('⚠️ LinkedIn media upload failed:', uploadErr.response?.data || uploadErr.message);
        // Continue with text-only post
      }
    }

    const res = await axios.post('https://api.linkedin.com/rest/posts', body, { headers });
    console.log('✅ LinkedIn post published via REST API:', res.headers?.['x-restli-id'] || res.status);
    return { id: res.headers?.['x-restli-id'], api: 'rest' };
  } catch (restErr) {
    console.warn('⚠️ LinkedIn REST API failed, trying UGC Posts API:', restErr.response?.data || restErr.message);

    // ── Fallback: UGC Posts API ──────────────────────────────────
    const hasVideo = media && media.length > 0 && media[0].type === 'video';
    const hasImage = media && media.length > 0 && media[0].type === 'image';

    const shareContent = {
      shareCommentary:    { text: content },
      shareMediaCategory: hasVideo ? 'VIDEO' : hasImage ? 'IMAGE' : 'NONE',
    };

    // Upload media first if present (UGC API format)
    if (media && media.length > 0) {
      try {
        const uploadedMedia = [];

        for (const m of media.slice(0, 9)) {
          const assetUrn = await uploadMediaToLinkedIn(account, m.url, m.type);
          uploadedMedia.push({
            status: 'READY',
            media: assetUrn,
          });
        }

        shareContent.media = uploadedMedia;
      } catch (uploadErr) {
        console.error('⚠️ LinkedIn UGC media upload failed:', uploadErr.response?.data || uploadErr.message);
        // Continue with text-only post
        shareContent.shareMediaCategory = 'NONE';
      }
    }

    const ugcBody = {
      author:         `urn:li:person:${account.platformUserId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': shareContent,
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
