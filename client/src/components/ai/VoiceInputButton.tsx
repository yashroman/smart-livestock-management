import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceInputButtonProps {
  isSupported: boolean;
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isSupported,
  isListening,
  onStart,
  onStop,
  disabled = false,
}) => {
  const { t } = useLanguage();

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title={t('ai.micUnavailable')}
        aria-label={t('ai.micUnavailable')}
        className="p-2.5 text-slate-300 bg-slate-100 rounded-lg cursor-not-allowed"
      >
        <Mic className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      title={isListening ? t('ai.stopListening') : t('ai.voiceInput')}
      aria-label={isListening ? t('ai.stopListening') : t('ai.voiceInput')}
      className={`p-2.5 rounded-lg transition-all cursor-pointer relative ${
        isListening
          ? 'bg-red-600 text-white shadow-md animate-pulse'
          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
      } disabled:opacity-50`}
    >
      {isListening ? (
        <MicOff className="w-5 h-5 text-white" />
      ) : (
        <Mic className="w-5 h-5 text-emerald-700" />
      )}
    </button>
  );
};
