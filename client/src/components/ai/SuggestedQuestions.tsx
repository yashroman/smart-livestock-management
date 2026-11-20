import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { HelpCircle } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (questionText: string) => void;
  disabled?: boolean;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelect,
  disabled = false,
}) => {
  const { t } = useLanguage();

  const questions = [
    t('ai.questionVaccination'),
    t('ai.questionMilk'),
    t('ai.questionReminders'),
    t('ai.questionPregnant'),
    t('ai.questionExpenses'),
    t('ai.questionTopMilk'),
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600">
        <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span>{t('ai.suggestedQuestions')}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(q)}
            className="px-3 py-1.5 text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-full transition-all text-left shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
