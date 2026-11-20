import React, { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { VoiceInputButton } from './VoiceInputButton';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (text: string) => void;
  isLoading: boolean;
  isListening: boolean;
  isSpeechSupported: boolean;
  onStartVoice: () => void;
  onStopVoice: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  isListening,
  isSpeechSupported,
  onStartVoice,
  onStopVoice,
}) => {
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSend(value.trim());
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end space-x-2 bg-white p-2.5 border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl shadow-sm transition-all">
        {/* Voice Input Button */}
        <VoiceInputButton
          isSupported={isSpeechSupported}
          isListening={isListening}
          onStart={onStartVoice}
          onStop={onStopVoice}
          disabled={isLoading}
        />

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('ai.inputPlaceholder')}
          disabled={isLoading}
          className="flex-1 max-h-32 py-2 px-1 text-xs sm:text-sm bg-transparent border-0 focus:outline-none resize-none placeholder-slate-400 text-slate-900"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          title={t('ai.send')}
          aria-label={t('ai.send')}
          className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-xs cursor-pointer flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
};
