import React from 'react';
import { ConversationSummary } from '../../api/ai.api';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, MessageSquare, Trash2, Clock } from 'lucide-react';

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
  onDelete,
  isLoading = false,
}) => {
  const { t, formatDate } = useLanguage();

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      {/* New Conversation Button */}
      <div className="p-3 border-b border-slate-200">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('ai.newConversation')}</span>
        </button>
      </div>

      {/* History Header */}
      <div className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
        <span>{t('ai.conversationHistory')}</span>
        <span className="text-slate-400">({conversations.length})</span>
      </div>

      {/* Conversation Thread List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {isLoading && conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            {t('common.loading')}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>{t('ai.noConversations')}</p>
          </div>
        ) : (
          conversations.map((convo) => {
            const isActive = convo._id === activeConversationId;

            return (
              <div
                key={convo._id}
                onClick={() => onSelect(convo._id)}
                className={`group flex items-start justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-white border-emerald-300 shadow-xs text-slate-900 font-semibold'
                    : 'border-transparent text-slate-700 hover:bg-white/80 hover:border-slate-200'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs truncate font-medium">{convo.title || 'Farm Chat'}</p>
                  {convo.lastMessage && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {convo.lastMessage}
                    </p>
                  )}
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDate(convo.updatedAt, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Delete Thread Button */}
                <button
                  type="button"
                  onClick={(e) => onDelete(convo._id, e)}
                  title={t('ai.deleteConversation')}
                  aria-label={t('ai.deleteConversation')}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
