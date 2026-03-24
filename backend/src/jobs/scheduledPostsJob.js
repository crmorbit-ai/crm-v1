const cron = require('node-cron');
const SocialPost    = require('../models/SocialPost');
const SocialAccount = require('../models/SocialAccount');

const linkedinPublisher  = require('../services/linkedinPublisher');
const twitterPublisher   = require('../services/twitterPublisher');
const facebookPublisher  = require('../services/facebookPublisher');
const instagramPublisher = require('../services/instagramPublisher');

const PUBLISHERS = {
  linkedin:  linkedinPublisher,
  twitter:   twitterPublisher,
  facebook:  facebookPublisher,
  instagram: instagramPublisher,
};

let isRunning = false;

/**
 * Find all due scheduled posts and publish them.
 */
const processScheduledPosts = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const now  = new Date();
    const posts = await SocialPost.find({
      status:      'scheduled',
      scheduledAt: { $lte: now },
    });

    if (posts.length === 0) { isRunning = false; return; }

    console.log(`⏰ [ScheduledPosts] Found ${posts.length} post(s) due for publishing`);

    for (const post of posts) {
      const errors = [];

      for (const platform of post.platforms) {
        const publisher = PUBLISHERS[platform];
        if (!publisher) continue;

        try {
          const account = await SocialAccount.findOne({
            tenant:      post.tenant,
            platform,
            isConnected: true,
          });

          if (!account?.accessToken) {
            errors.push(`${platform}: no access token — reconnect account`);
            continue;
          }

          await publisher.publishPost(account, post.content);
          console.log(`  ✅ [${platform}] Published post ${post._id}`);
        } catch (err) {
          const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
          errors.push(`${platform}: ${detail}`);
          console.error(`  ❌ [${platform}] Failed post ${post._id}:`, detail);
        }
      }

      // Update post status
      await SocialPost.findByIdAndUpdate(post._id, {
        status:      errors.length === post.platforms.length ? 'failed' : 'published',
        publishedAt: new Date(),
        ...(errors.length ? { failureReason: errors.join(' | ') } : {}),
      });
    }
  } catch (err) {
    console.error('❌ [ScheduledPosts] Job error:', err.message);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the cron — runs every minute.
 */
const startScheduledPostsJob = () => {
  cron.schedule('* * * * *', processScheduledPosts, { timezone: 'Asia/Kolkata' });
  console.log('✅ [ScheduledPosts] Cron started — checking every minute');
};

module.exports = { startScheduledPostsJob };
