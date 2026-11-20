import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { AIConversation } from '../models/AIConversation';
import {
  geminiProvider,
  detectIntents,
  deriveConversationTitle,
  buildFarmContext,
  buildSystemPrompt,
  AIMessageInput,
} from '../services/ai';

// Basic in-memory rate limiting map: userId -> lastRequestTimestamp
const userLastRequest = new Map<string, number>();

/**
 * POST /api/ai/chat
 * Generates an AI Farm Assistant reply grounded on farm context
 */
export const chatHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const farmId = req.user?.farmId;

    if (!userId || !farmId) {
      res.status(401).json({ success: false, message: 'Unauthorized session' });
      return;
    }

    const { message, conversationId, language = 'en' } = req.body;

    // 1. Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Please provide a non-empty question or message.' });
      return;
    }

    if (message.length > 4000) {
      res.status(400).json({
        success: false,
        message: 'Message exceeds the maximum length of 4000 characters.',
      });
      return;
    }

    const validLang = ['en', 'hi', 'mr'].includes(language) ? language : 'en';

    // 2. Simple Rate-Limit (1 request per second per user)
    const now = Date.now();
    const lastTime = userLastRequest.get(userId) || 0;
    if (now - lastTime < 1000) {
      res.status(429).json({
        success: false,
        message: 'Please wait a moment before sending another message.',
      });
      return;
    }
    userLastRequest.set(userId, now);

    // 3. Conversation Resolution
    let conversation: any = null;
    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        farmId,
        userId,
      });
    }

    if (!conversation) {
      conversation = new AIConversation({
        userId,
        farmId,
        title: 'New Farm Chat',
        language: validLang,
        messages: [],
      });
    }

    // 4. Intent Detection
    const intents = detectIntents(message);

    // If first message in conversation, derive title
    if (conversation.messages.length === 0) {
      conversation.title = deriveConversationTitle(message, intents, validLang);
      conversation.language = validLang;
    }

    // 5. Farm Data Context Retrieval
    const { farmContext, hasRecords } = await buildFarmContext(farmId, userId, intents);

    // Check if database was offline
    if (farmContext.status === 'DATABASE_OFFLINE') {
      const offlineReplies: Record<string, string> = {
        en: 'Farm data is currently unavailable. Please try again when the database connection is restored.',
        hi: 'फार्म डेटा वर्तमान में अनुपलब्ध है। कृपया डेटाबेस कनेक्शन बहाल होने पर पुनः प्रयास करें।',
        mr: 'शेतातील डेटा सध्या उपलब्ध नाही. कृपया डेटाबेस कनेक्शन पुनर्संचयित झाल्यावर पुन्हा प्रयत्न करा.',
      };

      res.status(200).json({
        success: true,
        conversationId: conversation._id,
        reply: offlineReplies[validLang],
        language: validLang,
        isGrounded: false,
        intent: intents[0],
      });
      return;
    }

    // 6. Build Grounded System Instructions
    const systemPrompt = buildSystemPrompt(farmContext, validLang as any);

    // 7. Assemble Recent History (Window of recent 8 messages to stay within token limits)
    const recentMessages: AIMessageInput[] = conversation.messages
      .slice(-8)
      .map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

    recentMessages.push({
      role: 'user',
      content: message.trim(),
    });

    // 8. Generate AI Response via Provider
    let replyText = '';
    let isGrounded = hasRecords && intents[0] !== 'general';

    try {
      const aiResponse = await geminiProvider.generateResponse(
        systemPrompt,
        recentMessages,
        validLang
      );
      replyText = aiResponse.reply;
    } catch (aiErr: any) {
        console.error('[AI Farm Assistant] Gemini error:', aiErr);
      if (aiErr.message === 'AI_NOT_CONFIGURED') {
        const notConfiguredReplies: Record<string, string> = {
          en: 'AI Farm Assistant is not configured yet. Please set the AI_API_KEY environment variable in server/.env.',
          hi: 'एआई फार्म सहायक अभी कॉन्फ़िगर नहीं है। कृपया server/.env में AI_API_KEY सेट करें।',
          mr: 'एआय शेतकरी सहाय्यक अद्याप कॉन्फिगर केलेले नाही. कृपया server/.env मध्ये AI_API_KEY सेट करा.',
        };

        replyText = notConfiguredReplies[validLang] || notConfiguredReplies.en;
        isGrounded = false;
      } else if (aiErr.message.includes('AI_TIMEOUT')) {
        const timeoutReplies: Record<string, string> = {
          en: 'The AI service timed out while processing your farm request. Please try again shortly.',
          hi: 'आपके अनुरोध को संसाधित करते समय एआई सेवा का समय समाप्त हो गया। कृपया कुछ देर बाद पुन: प्रयास करें।',
          mr: 'तुमच्या विनंतीवर प्रक्रिया करताना एआय सेवेची वेळ संपली. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.',
        };
        replyText = timeoutReplies[validLang] || timeoutReplies.en;
      } else {
        const errorReplies: Record<string, string> = {
          en: 'The AI assistant is temporarily unavailable. Please try again later.',
          hi: 'एआई सहायक अस्थायी रूप से अनुपलब्ध है। कृपया बाद में प्रयास करें।',
          mr: 'एआय सहाय्यक तात्पुरता अनुपलब्ध आहे. कृपया नंतर पुन्हा प्रयत्न करा.',
        };
        replyText = errorReplies[validLang] || errorReplies.en;
      }
    }

    // 9. Persist Messages into Conversation
    conversation.messages.push({
      role: 'user',
      content: message.trim(),
      language: validLang,
      intent: intents[0],
      isGrounded: false,
      timestamp: new Date(),
    });

    conversation.messages.push({
      role: 'assistant',
      content: replyText,
      language: validLang,
      intent: intents[0],
      isGrounded,
      timestamp: new Date(),
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(200).json({
      success: true,
      conversationId: conversation._id,
      reply: replyText,
      language: validLang,
      isGrounded,
      intent: intents[0],
      sources: hasRecords ? Object.keys(farmContext).filter((k) => k !== 'farmInfo') : [],
    });
  } catch (error: any) {
    console.error('AI chatHandler error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI chat request.',
    });
  }
};

/**
 * GET /api/ai/conversations
 * Returns user's conversation threads for the active farm
 */
export const getConversationsHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const farmId = req.user?.farmId;

    if (!userId || !farmId) {
      res.status(401).json({ success: false, message: 'Unauthorized session' });
      return;
    }

    const conversations = await AIConversation.find({ farmId, userId })
      .select('title language messages createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = conversations.map((c) => ({
      _id: c._id,
      title: c.title,
      language: c.language,
      messageCount: c.messages?.length || 0,
      lastMessage: c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].content : '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
    });
  }
};

/**
 * GET /api/ai/conversations/:id
 * Returns a specific conversation thread with full messages
 */
export const getConversationByIdHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const farmId = req.user?.farmId;
    const { id } = req.params;

    if (!userId || !farmId) {
      res.status(401).json({ success: false, message: 'Unauthorized session' });
      return;
    }

    const conversation = await AIConversation.findOne({
      _id: id,
      farmId,
      userId,
    }).lean();

    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation details',
    });
  }
};

/**
 * POST /api/ai/conversations
 * Initializes an empty new conversation
 */
export const createConversationHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const farmId = req.user?.farmId;

    if (!userId || !farmId) {
      res.status(401).json({ success: false, message: 'Unauthorized session' });
      return;
    }

    const { title, language = 'en' } = req.body;

    const newConvo = await AIConversation.create({
      userId,
      farmId,
      title: title?.trim() || 'New Farm Chat',
      language: ['en', 'hi', 'mr'].includes(language) ? language : 'en',
      messages: [],
    });

    res.status(201).json({
      success: true,
      data: newConvo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
    });
  }
};

/**
 * DELETE /api/ai/conversations/:id
 * Deletes a conversation thread strictly scoped to the tenant
 */
export const deleteConversationHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const farmId = req.user?.farmId;
    const { id } = req.params;

    if (!userId || !farmId) {
      res.status(401).json({ success: false, message: 'Unauthorized session' });
      return;
    }

    const deleted = await AIConversation.findOneAndDelete({
      _id: id,
      farmId,
      userId,
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
    });
  }
};
