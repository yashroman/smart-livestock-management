import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AIMessageItem,
  ConversationSummary,
  getConversations,
  getConversation,
  sendAIMessage,
  deleteConversation,
} from '../api/ai.api';
import { useLanguage } from '../context/LanguageContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { ChatMessage } from '../components/ai/ChatMessage';
import { ChatInput } from '../components/ai/ChatInput';
import { SuggestedQuestions } from '../components/ai/SuggestedQuestions';
import { ConversationList } from '../components/ai/ConversationList';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import {
  Bot,
  AlertTriangle,
  History,
  ShieldAlert,
  Loader2,
  X,
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const { t, language } = useLanguage();

  // Conversations State
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');

  // Loading & UI States
  const [isLoadingConvos, setIsLoadingConvos] = useState<boolean>(true);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech Hooks
  const {
    isSupported: isSpeechSupported,
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    isSpeaking,
    currentlySpeakingId,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Load conversation threads on mount
  const fetchConversationList = useCallback(async () => {
    try {
      setIsLoadingConvos(true);
      const res = await getConversations();
      if (res.success) {
        setConversations(res.data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingConvos(false);
    }
  }, []);

  useEffect(() => {
    fetchConversationList();
  }, [fetchConversationList]);

  // Load messages when selecting a thread
  const handleSelectConversation = async (id: string) => {
    try {
      setActiveConversationId(id);
      setIsMobileHistoryOpen(false);
      setErrorMessage(null);
      stopSpeaking();

      const res = await getConversation(id);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load conversation');
    }
  };

  // Start new chat
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputText('');
    setErrorMessage(null);
    setIsMobileHistoryOpen(false);
    stopSpeaking();
  };

  // Update input when speech transcript changes
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Send message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isThinking) return;

    const userText = textToSend.trim();
    setInputText('');
    resetTranscript();
    setErrorMessage(null);
    stopSpeaking();

    // Optimistically add user message to UI
    const tempUserMsg: AIMessageItem = {
      role: 'user',
      content: userText,
      language,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsThinking(true);

    try {
      const res = await sendAIMessage({
        message: userText,
        conversationId: activeConversationId || undefined,
        language,
      });

      if (res.success) {
        const assistantMsg: AIMessageItem = {
          role: 'assistant',
          content: res.reply,
          language: res.language,
          isGrounded: res.isGrounded,
          intent: res.intent,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // If this was a new conversation, update active ID and refresh thread list
        if (!activeConversationId && res.conversationId) {
          setActiveConversationId(res.conversationId);
          fetchConversationList();
        } else {
          // Update thread preview in list
          fetchConversationList();
        }
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      setErrorMessage(serverMsg || t('ai.aiUnavailable'));

      // Add a friendly error bubble in the conversation
      const errorMsg: AIMessageItem = {
        role: 'assistant',
        content: serverMsg || t('ai.aiUnavailable'),
        language,
        isGrounded: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteConversation(deleteId);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c._id !== deleteId));
        if (activeConversationId === deleteId) {
          handleNewChat();
        }
        setDeleteId(null);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error deleting conversation');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="px-4 py-3 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-700 text-white rounded-xl shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {t('ai.title')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('ai.subtitle')}
            </p>
          </div>
        </div>

        {/* Mobile History Toggle & New Chat Button */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsMobileHistoryOpen(!isMobileHistoryOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title={t('ai.conversationHistory')}
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Area (Sidebar + Chat Area) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Left Sidebar: Conversation History */}
        <div className="hidden md:block w-72 h-full flex-shrink-0">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
            onDelete={(id, e) => {
              e.stopPropagation();
              setDeleteId(id);
            }}
            isLoading={isLoadingConvos}
          />
        </div>

        {/* Mobile History Drawer Overlay */}
        {isMobileHistoryOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex">
            <div className="w-80 max-w-[80%] h-full bg-slate-50 shadow-2xl flex flex-col">
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  {t('ai.conversationHistory')}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileHistoryOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelect={handleSelectConversation}
                  onNewChat={handleNewChat}
                  onDelete={(id, e) => {
                    e.stopPropagation();
                    setDeleteId(id);
                  }}
                  isLoading={isLoadingConvos}
                />
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileHistoryOpen(false)} />
          </div>
        )}

        {/* Right Chat Column */}
        <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
          {/* Veterinary Advisory Banner */}
          <div className="px-4 py-2 bg-amber-50/90 border-b border-amber-200/70 flex items-center space-x-2 text-[11px] text-amber-900">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-700" />
            <p className="line-clamp-1">{t('ai.veterinaryDisclaimer')}</p>
          </div>

          {/* Speech Error Banner */}
          {speechError === 'PERMISSION_DENIED' && (
            <div className="p-3 mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{t('ai.micPermissionDenied')}</span>
            </div>
          )}

          {/* General Error Banner */}
          {errorMessage && (
            <div className="p-3 mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2">
            {messages.length === 0 ? (
              // Empty State
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mb-3 shadow-xs">
                  <Bot className="w-7 h-7" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  {t('ai.emptyChatTitle')}
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 mb-6 leading-relaxed">
                  {t('ai.emptyChatSubtitle')}
                </p>

                {/* Suggested Questions Grid */}
                <div className="w-full text-left bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <SuggestedQuestions
                    onSelect={(q) => handleSendMessage(q)}
                    disabled={isThinking}
                  />
                </div>
              </div>
            ) : (
              // Message List
              <>
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={idx}
                    message={msg}
                    isSpeaking={isSpeaking && currentlySpeakingId === msg.content}
                    onSpeak={(txt) => speak(txt, language, msg.content)}
                    onStopSpeak={stopSpeaking}
                  />
                ))}

                {/* Thinking Bubble */}
                {isThinking && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 p-3 bg-white border border-slate-200 rounded-2xl w-fit shadow-xs animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>{t('ai.thinking')}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2.5">
            {/* Quick Suggestions pill bar when active conversation */}
            {messages.length > 0 && (
              <div className="overflow-x-auto pb-1 -mx-1 px-1">
                <div className="flex items-center space-x-2 whitespace-nowrap">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {t('ai.suggestedQuestions')}:
                  </span>
                  {[
                    t('ai.questionVaccination'),
                    t('ai.questionMilk'),
                    t('ai.questionPregnant'),
                    t('ai.questionExpenses'),
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isThinking}
                      onClick={() => handleSendMessage(q)}
                      className="px-2.5 py-1 text-[11px] bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200 rounded-full transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <ChatInput
              value={inputText}
              onChange={setInputText}
              onSend={handleSendMessage}
              isLoading={isThinking}
              isListening={isListening}
              isSpeechSupported={isSpeechSupported}
              onStartVoice={() => startListening(language)}
              onStopVoice={stopListening}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteId)}
        title={t('ai.deleteConversation')}
        message={t('ai.confirmDelete')}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConversation}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
