const SocialAccount       = require('../models/SocialAccount');
const SocialPost          = require('../models/SocialPost');
const cloudinary          = require('../config/cloudinary');
const linkedinPublisher   = require('../services/linkedinPublisher');
const twitterPublisher    = require('../services/twitterPublisher');
const facebookPublisher   = require('../services/facebookPublisher');
const instagramPublisher  = require('../services/instagramPublisher');
const youtubePublisher    = require('../services/youtubePublisher');
const { successResponse, errorResponse } = require('../utils/response');

const PUBLISHERS = {
  linkedin:  linkedinPublisher,
  twitter:   twitterPublisher,
  facebook:  facebookPublisher,
  instagram: instagramPublisher,
  youtube:   youtubePublisher,
};

// ── ACCOUNTS ─────────────────────────────────────────────────────

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await SocialAccount.find({ tenant: req.user.tenant })
      .populate('createdBy', 'name email').sort({ platform: 1 });
    return successResponse(res, 200, 'Fetched', accounts);
  } catch (err) { return errorResponse(res, 500, err.message); }
};

exports.saveAccount = async (req, res) => {
  try {
    const { platform, accountName, accountHandle, accountUrl, followers, following, totalPosts } = req.body;
    if (!platform) return errorResponse(res, 400, 'Platform is required');

    const account = await SocialAccount.findOneAndUpdate(
      { tenant: req.user.tenant, platform },
      {
        accountName, accountHandle, accountUrl,
        followers: followers || 0,
        following: following || 0,
        totalPosts: totalPosts || 0,
        isConnected: !!(accountHandle || accountUrl),
        status: (accountHandle || accountUrl) ? 'connected' : 'disconnected',
        lastSyncAt: new Date(),
        createdBy: req.user._id,
      },
      { upsert: true, new: true }
    );
    return successResponse(res, 200, 'Account saved', account);
  } catch (err) { return errorResponse(res, 500, err.message); }
};

exports.disconnectAccount = async (req, res) => {
  try {
    await SocialAccount.findOneAndUpdate(
      { tenant: req.user.tenant, platform: req.params.platform },
      { isConnected: false, status: 'disconnected', accountHandle: '', accountUrl: '', accountName: '' }
    );
    return successResponse(res, 200, 'Disconnected');
  } catch (err) { return errorResponse(res, 500, err.message); }
};

// ── POSTS ─────────────────────────────────────────────────────────

exports.getPosts = async (req, res) => {
  try {
    const { status, platform, page = 1, limit = 20 } = req.query;
    const query = { tenant: req.user.tenant };
    if (status)   query.status = status;
    if (platform) query.platforms = platform;

    const [posts, total] = await Promise.all([
      SocialPost.find(query).populate('createdBy', 'name email')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit),
      SocialPost.countDocuments(query)
    ]);
    return successResponse(res, 200, 'Fetched', { posts, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) { return errorResponse(res, 500, err.message); }
};

exports.createPost = async (req, res) => {
  try {
    const { content, platforms, scheduledAt, tags, media } = req.body;
    if (!content?.trim()) return errorResponse(res, 400, 'Content is required');
    if (!platforms?.length) return errorResponse(res, 400, 'Select at least one platform');

    const isPublishing = !scheduledAt;
    const status = scheduledAt ? 'scheduled' : 'published';

    const post = await SocialPost.create({
      tenant: req.user.tenant,
      content, platforms, tags: tags || [], media: media || [],
      scheduledAt: scheduledAt || null,
      publishedAt: isPublishing ? new Date() : null,
      status,
      createdBy: req.user._id,
    });

    // Actually publish to each connected platform right now
    if (isPublishing) {
      const publishErrors = [];

      for (const platform of platforms) {
        const publisher = PUBLISHERS[platform];
        if (!publisher) { console.log(`⚠️  No publisher for: ${platform}`); continue; }

        try {
          const account = await SocialAccount.findOne({ tenant: req.user.tenant, platform, isConnected: true });
          console.log(`🔍 [${platform}] account found:`, !!account, '| hasToken:', !!account?.accessToken, '| userId:', account?.platformUserId);

          if (!account) {
            console.warn(`⚠️  [${platform}] No connected account found`);
            continue;
          }
          if (!account.accessToken) {
            publishErrors.push(`${platform}: Account connected but no access token — please reconnect`);
            continue;
          }

          await publisher.publishPost(account, content);
          console.log(`✅ [${platform}] Published successfully`);
        } catch (pubErr) {
          const detail = pubErr.response?.data ? JSON.stringify(pubErr.response.data) : pubErr.message;
          publishErrors.push(`${platform}: ${detail}`);
          console.error(`❌ Publish error [${platform}]:`, detail);
        }
      }

      if (publishErrors.length) {
        await SocialPost.findByIdAndUpdate(post._id, { status: 'failed' });
        return successResponse(res, 201, `Post saved but publish failed on: ${publishErrors.join(' | ')}`, post);
      }
    }

    return successResponse(res, 201, 'Post created', post);
  } catch (err) { return errorResponse(res, 500, err.message); }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await SocialPost.findOne({ _id: req.params.id, tenant: req.user.tenant });
    if (!post) return errorResponse(res, 404, 'Post not found');
    if (post.status === 'published') return errorResponse(res, 400, 'Cannot edit a published post');

    const fields = ['content','platforms','scheduledAt','tags','media','status'];
    fields.forEach(f => { if (req.body[f] !== undefined) post[f] = req.body[f]; });
    await post.save();
    return successResponse(res, 200, 'Updated', post);
  } catch (err) { return errorResponse(res, 500, err.message); }
};

exports.deletePost = async (req, res) => {
  try {
    await SocialPost.findOneAndDelete({ _id: req.params.id, tenant: req.user.tenant });
    return successResponse(res, 200, 'Deleted');
  } catch (err) { return errorResponse(res, 500, err.message); }
};

exports.getStats = async (req, res) => {
  try {
    const [total, scheduled, published, draft] = await Promise.all([
      SocialPost.countDocuments({ tenant: req.user.tenant }),
      SocialPost.countDocuments({ tenant: req.user.tenant, status: 'scheduled' }),
      SocialPost.countDocuments({ tenant: req.user.tenant, status: 'published' }),
      SocialPost.countDocuments({ tenant: req.user.tenant, status: 'draft' }),
    ]);
    const accounts = await SocialAccount.find({ tenant: req.user.tenant, isConnected: true });
    return successResponse(res, 200, 'Stats', { total, scheduled, published, draft, connectedAccounts: accounts.length });
  } catch (err) { return errorResponse(res, 500, err.message); }
};

// ── MEDIA UPLOAD ──────────────────────────────────────────────
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'No file uploaded');

    const { buffer, mimetype, originalname } = req.file;
    const isVideo = mimetype.startsWith('video/');
    const b64     = Buffer.from(buffer).toString('base64');
    const dataURI = `data:${mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder:        `social-posts/${req.user.tenant}`,
      resource_type: isVideo ? 'video' : 'image',
      public_id:     `${Date.now()}-${originalname.replace(/\s/g, '_')}`,
    });

    return successResponse(res, 200, 'Uploaded', {
      url:          result.secure_url,
      type:         isVideo ? 'video' : 'image',
      width:        result.width,
      height:       result.height,
      duration:     result.duration || null,
      thumbnailUrl: isVideo
        ? result.secure_url.replace('/upload/', '/upload/so_0,f_jpg/') // video thumbnail
        : result.secure_url,
    });
  } catch (err) { return errorResponse(res, 500, err.message); }
};
