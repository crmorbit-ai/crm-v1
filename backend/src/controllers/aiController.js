const aiService = require('../services/aiService');
const { successResponse, errorResponse } = require('../utils/response');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');

/**
 * @desc    AI Chat
 * @route   POST /api/ai/chat
 * @access  Private
 */
const chat = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return errorResponse(res, 400, 'Message is required');
    }

    // Add full user and tenant context for CRM data access
    const enrichedContext = {
      ...context,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userRole: req.user.userType,
      userId: req.user._id,
      tenantId: req.user.tenant // Critical: This allows AI to query CRM data
    };

    console.log('🤖 AI Chat Request from:', enrichedContext.userName, '| Tenant:', enrichedContext.tenantId);

    const response = await aiService.chat(message, enrichedContext);

    successResponse(res, 200, 'AI response generated', { response });
  } catch (error) {
    console.error('AI Chat Error:', error);
    errorResponse(res, 500, error.message || 'AI service error');
  }
};

/**
 * @desc    Generate Email Draft
 * @route   POST /api/ai/generate-email
 * @access  Private
 */
const generateEmail = async (req, res) => {
  try {
    const { to, subject, purpose, tone, entityType, entityId } = req.body;

    if (!purpose && !subject) {
      return errorResponse(res, 400, 'Subject or purpose is required');
    }

    // Get entity context if provided
    let context = {};
    if (entityType && entityId) {
      if (entityType === 'lead') {
        const lead = await Lead.findById(entityId);
        if (lead) {
          context = {
            name: `${lead.firstName} ${lead.lastName}`,
            company: lead.company,
            status: lead.status,
            source: lead.source
          };
        }
      } else if (entityType === 'contact') {
        const contact = await Contact.findById(entityId);
        if (contact) {
          context = {
            name: `${contact.firstName} ${contact.lastName}`,
            company: contact.company,
            title: contact.title
          };
        }
      }
    }

    const email = await aiService.generateEmail({
      to: to || context.name,
      subject,
      purpose,
      tone: tone || 'professional',
      context
    });

    successResponse(res, 200, 'Email draft generated', email);
  } catch (error) {
    console.error('Generate Email Error:', error);
    errorResponse(res, 500, error.message || 'Failed to generate email');
  }
};

/**
 * @desc    Summarize Lead/Contact
 * @route   POST /api/ai/summarize
 * @access  Private
 */
const summarize = async (req, res) => {
  try {
    const { entityType, entityId } = req.body;

    if (!entityType || !entityId) {
      return errorResponse(res, 400, 'Entity type and ID are required');
    }

    let entity = null;
    if (entityType === 'lead') {
      entity = await Lead.findById(entityId).lean();
    } else if (entityType === 'contact') {
      entity = await Contact.findById(entityId).lean();
    }

    if (!entity) {
      return errorResponse(res, 404, `${entityType} not found`);
    }

    // Remove sensitive fields
    delete entity.tenant;
    delete entity.__v;

    const summary = await aiService.summarizeEntity(entity, entityType);

    successResponse(res, 200, 'Summary generated', { summary });
  } catch (error) {
    console.error('Summarize Error:', error);
    errorResponse(res, 500, error.message || 'Failed to generate summary');
  }
};

/**
 * @desc    Analyze Email Sentiment
 * @route   POST /api/ai/analyze-sentiment
 * @access  Private
 */
const analyzeSentiment = async (req, res) => {
  try {
    const { emailContent } = req.body;

    if (!emailContent) {
      return errorResponse(res, 400, 'Email content is required');
    }

    const analysis = await aiService.analyzeEmailSentiment(emailContent);

    successResponse(res, 200, 'Sentiment analyzed', analysis);
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    errorResponse(res, 500, error.message || 'Failed to analyze sentiment');
  }
};

/**
 * @desc    Get Follow-up Suggestions
 * @route   POST /api/ai/follow-up-suggestions
 * @access  Private
 */
const getFollowUpSuggestions = async (req, res) => {
  try {
    const { entityType, entityId } = req.body;

    if (!entityType || !entityId) {
      return errorResponse(res, 400, 'Entity type and ID are required');
    }

    let entity = null;
    if (entityType === 'lead') {
      entity = await Lead.findById(entityId).lean();
    } else if (entityType === 'contact') {
      entity = await Contact.findById(entityId).lean();
    }

    if (!entity) {
      return errorResponse(res, 404, `${entityType} not found`);
    }

    const suggestions = await aiService.getFollowUpSuggestions(entity, []);

    successResponse(res, 200, 'Follow-up suggestions generated', { suggestions });
  } catch (error) {
    console.error('Follow-up Suggestions Error:', error);
    errorResponse(res, 500, error.message || 'Failed to generate suggestions');
  }
};

/**
 * @desc    Process Voice Note
 * @route   POST /api/ai/process-voice
 * @access  Private
 */
const processVoiceNote = async (req, res) => {
  try {
    const { transcription } = req.body;

    if (!transcription) {
      return errorResponse(res, 400, 'Transcription is required');
    }

    const processedNote = await aiService.processVoiceNote(transcription);

    successResponse(res, 200, 'Voice note processed', processedNote);
  } catch (error) {
    console.error('Process Voice Note Error:', error);
    errorResponse(res, 500, error.message || 'Failed to process voice note');
  }
};

/**
 * @desc    Smart Search
 * @route   POST /api/ai/smart-search
 * @access  Private
 */
const smartSearch = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return errorResponse(res, 400, 'Search query is required');
    }

    const searchParams = await aiService.smartSearch(query);

    successResponse(res, 200, 'Search parameters generated', searchParams);
  } catch (error) {
    console.error('Smart Search Error:', error);
    errorResponse(res, 500, error.message || 'Failed to process search');
  }
};

module.exports = {
  chat,
  generateEmail,
  summarize,
  analyzeSentiment,
  getFollowUpSuggestions,
  processVoiceNote,
  smartSearch
};
