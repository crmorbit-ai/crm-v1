const CaseStudy = require('../models/CaseStudy');

/**
 * Auto-publish scheduled case studies
 * Runs every 5 minutes
 */
const publishScheduledCaseStudies = async () => {
  try {
    const now = new Date();

    // Find all scheduled case studies whose publish date has passed
    const scheduledStudies = await CaseStudy.find({
      status: 'scheduled',
      scheduledPublishDate: { $lte: now },
      isPublished: false
    });

    if (scheduledStudies.length === 0) {
      return;
    }

    // Publish them
    const publishPromises = scheduledStudies.map(async (cs) => {
      cs.status = 'published';
      cs.isPublished = true;
      cs.publishedAt = new Date();
      await cs.save();
      console.log(`✅ Auto-published: "${cs.title}" (scheduled for ${cs.scheduledPublishDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
      return cs;
    });

    const published = await Promise.all(publishPromises);
    console.log(`🎉 Auto-published ${published.length} scheduled case studies`);

    return published;
  } catch (error) {
    console.error('❌ Error in case study auto-publish scheduler:', error);
    return [];
  }
};

module.exports = { publishScheduledCaseStudies };
