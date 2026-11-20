import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AttentionAlert } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { AlertTriangle, AlertCircle, Info, ChevronRight, CheckCircle2 } from 'lucide-react';

interface AttentionRequiredCardProps {
  alerts: AttentionAlert[];
  isLoading?: boolean;
}

export const AttentionRequiredCard: React.FC<AttentionRequiredCardProps> = ({
  alerts,
  isLoading,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-xs text-slate-400">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('dashboard.attentionRequired')}</h3>
            <p className="text-[11px] text-slate-500">{t('dashboard.kpiSubtitle')}</p>
          </div>
        </div>
        {alerts.length > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="p-6 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-1.5 text-emerald-500" />
          <p className="text-xs font-semibold text-slate-700">{t('dashboard.noAlerts')}</p>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {alerts.map((alert, index) => {
            const isUrgent = alert.severity === 'urgent';
            const isWarning = alert.severity === 'warning';

            return (
              <div
                key={index}
                onClick={() => navigate(alert.link)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                  isUrgent
                    ? 'bg-red-50/50 border-red-200 hover:border-red-300'
                    : isWarning
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                    : 'bg-blue-50/30 border-blue-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5">
                    {isUrgent ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    ) : isWarning ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isUrgent
                          ? 'text-red-900'
                          : isWarning
                          ? 'text-amber-900'
                          : 'text-blue-900'
                      }`}
                    >
                      {alert.title}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
