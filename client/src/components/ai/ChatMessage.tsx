import React from 'react';
import { AIMessageItem } from '../../api/ai.api';
import { useLanguage } from '../../context/LanguageContext';
import { SpeechButton } from './SpeechButton';
import { Bot, User, Database, Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: AIMessageItem;
  isSpeaking: boolean;
  onSpeak: (text: string) => void;
  onStopSpeak: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isSpeaking,
  onSpeak,
  onStopSpeak,
}) => {
  const { t, formatDate } = useLanguage();
  const isAssistant = message.role === 'assistant';

  // Format message lines safely into paragraphs and bullet lists
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Bullet item
          if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.replace(/^[•\-*]\s*/, '');
            return (
              <div key={idx} className="flex items-start space-x-2 pl-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: parseInlineStyles(itemText) }} />
              </div>
            );
          }

          // Numbered item (e.g. "1. ")
          if (/^\d+\.\s/.test(trimmed)) {
            const itemText = trimmed.replace(/^\d+\.\s*/, '');
            const numPrefix = trimmed.match(/^\d+\./)?.[0] || '1.';
            return (
              <div key={idx} className="flex items-start space-x-2 pl-1.5">
                <span className="text-emerald-700 font-semibold">{numPrefix}</span>
                <span dangerouslySetInnerHTML={{ __html: parseInlineStyles(itemText) }} />
              </div>
            );
          }

          // Regular paragraph
          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: parseInlineStyles(trimmed) }}
            />
          );
        })}
      </div>
    );
  };

  // Safe inline markdown parser (converts **bold** and `code` safely escaping HTML)
  const parseInlineStyles = (str: string): string => {
    const escaped = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return escaped
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>');
  };

  return (
    <div
      className={`flex items-start space-x-3 my-3 ${
        isAssistant ? 'justify-start' : 'justify-end flex-row-reverse space-x-reverse'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isAssistant
            ? 'bg-emerald-700 text-white shadow-xs'
            : 'bg-farm-900 text-emerald-300'
        }`}
      >
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Message Card Container */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-xs border ${
          isAssistant
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-emerald-700 text-white border-emerald-600 rounded-tr-none'
        }`}
      >
        {/* Assistant Header Citation Badge */}
        {isAssistant && (
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              {message.isGrounded ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Database className="w-3 h-3 text-emerald-600" />
                  <span>{t('ai.groundedBadge')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{t('ai.generalBadge')}</span>
                </span>
              )}
            </div>

            <SpeechButton
              isSpeaking={isSpeaking}
              onSpeak={() => onSpeak(message.content)}
              onStop={onStopSpeak}
            />
          </div>
        )}

        {/* Content Body */}
        {renderFormattedContent(message.content)}

        {/* Timestamp */}
        <div
          className={`mt-2 text-[10px] text-right ${
            isAssistant ? 'text-slate-400' : 'text-emerald-200'
          }`}
        >
          {formatDate(message.timestamp, {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};
