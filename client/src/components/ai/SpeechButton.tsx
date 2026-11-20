import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SpeechButtonProps {
  isSpeaking: boolean;
  onSpeak: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({
  isSpeaking,
  onSpeak,
  onStop,
  disabled = false,
}) => {
  const { t } = useLanguage();

  if (disabled) return null;

  return (
    <button
      type="button"
      onClick={isSpeaking ? onStop : onSpeak}
      title={isSpeaking ? t('ai.stopSpeaking') : t('ai.speak')}
      aria-label={isSpeaking ? t('ai.stopSpeaking') : t('ai.speak')}
      className={`p-1.5 rounded-md text-xs flex items-center space-x-1 transition-colors cursor-pointer ${
        isSpeaking
          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
      }`}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium hidden sm:inline">{t('ai.stopSpeaking')}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium hidden sm:inline">{t('ai.speak')}</span>
        </>
      )}
    </button>
  );
};
