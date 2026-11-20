import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  currentlySpeakingId: string | null;
  speak: (text: string, langCode?: string, messageId?: string) => void;
  stop: () => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const updateVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    }
  }, []);

  const speak = useCallback(
    (text: string, langCode: string = 'en', messageId?: string) => {
      if (!isSupported || !text.trim()) return;

      stop();

      // Clean markdown tags like ** and * from spoken text
      const cleanText = text
        .replace(/[*#_`~>]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);

      const localeMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
      };

      const targetLocale = localeMap[langCode] || 'en-IN';
      utterance.lang = targetLocale;

      // Find best matching voice if available
      const availableVoices = voicesRef.current;
      const matchedVoice =
        availableVoices.find((v) => v.lang === targetLocale || v.lang.startsWith(langCode)) ||
        availableVoices.find((v) => v.lang.includes('IN')) ||
        null;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.rate = 0.95; // Slightly slower for clear rural comprehension
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (messageId) setCurrentlySpeakingId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentlySpeakingId(null);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentlySpeakingId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, stop]
  );

  return {
    isSupported,
    isSpeaking,
    currentlySpeakingId,
    speak,
    stop,
  };
}
