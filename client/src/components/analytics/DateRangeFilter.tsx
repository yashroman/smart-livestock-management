import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, AlertCircle } from 'lucide-react';

export interface DateRangeState {
  preset: string;
  from?: string;
  to?: string;
}

interface DateRangeFilterProps {
  onFilterChange: (filter: { from?: string; to?: string; preset: string }) => void;
  defaultPreset?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onFilterChange,
  defaultPreset = '30d',
}) => {
  const { t } = useLanguage();
  const [preset, setPreset] = useState<string>(defaultPreset);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handlePresetChange = (newPreset: string) => {
    setPreset(newPreset);
    setError(null);

    const now = new Date();
    let computedFrom = '';
    let computedTo = '';

    if (newPreset === '7d') {
      const d = new Date(now);
      d.setDate(now.getDate() - 7);
      computedFrom = d.toISOString().split('T')[0];
      computedTo = now.toISOString().split('T')[0];
    } else if (newPreset === '30d') {
      const d = new Date(now);
      d.setDate(now.getDate() - 30);
      computedFrom = d.toISOString().split('T')[0];
      computedTo = now.toISOString().split('T')[0];
    } else if (newPreset === 'this_month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      computedFrom = d.toISOString().split('T')[0];
      computedTo = now.toISOString().split('T')[0];
    } else if (newPreset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      computedFrom = start.toISOString().split('T')[0];
      computedTo = end.toISOString().split('T')[0];
    } else if (newPreset === 'this_year') {
      const d = new Date(now.getFullYear(), 0, 1);
      computedFrom = d.toISOString().split('T')[0];
      computedTo = now.toISOString().split('T')[0];
    } else if (newPreset === 'all') {
      computedFrom = '';
      computedTo = '';
    }

    if (newPreset !== 'custom') {
      setFrom(computedFrom);
      setTo(computedTo);
      onFilterChange({ from: computedFrom || undefined, to: computedTo || undefined, preset: newPreset });
    }
  };

  const handleApplyCustom = () => {
    if (!from || !to) {
      setError(t('validation.required'));
      return;
    }

    if (from > to) {
      setError(t('reports.invalidDateRange'));
      return;
    }

    setError(null);
    onFilterChange({ from, to, preset: 'custom' });
  };

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span>{t('common.filter')}:</span>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: '7d', label: t('reports.filter7d') },
            { id: '30d', label: t('reports.filter30d') },
            { id: 'this_month', label: t('reports.filterThisMonth') },
            { id: 'last_month', label: t('reports.filterLastMonth') },
            { id: 'this_year', label: t('reports.filterThisYear') },
            { id: 'all', label: t('reports.filterAll') },
            { id: 'custom', label: t('reports.filterCustom') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePresetChange(item.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                preset === item.id
                  ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Pickers */}
      {preset === 'custom' && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">{t('reports.dateFrom')}:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">{t('reports.dateTo')}:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyCustom}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            {t('reports.apply')}
          </button>
        </div>
      )}

      {error && (
        <div className="text-[11px] text-red-600 flex items-center space-x-1 pt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
