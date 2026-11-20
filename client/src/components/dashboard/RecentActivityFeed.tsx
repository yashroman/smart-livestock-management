import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityFeedItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  Layers,
  Milk,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Clock,
} from 'lucide-react';

interface RecentActivityFeedProps {
  activities: ActivityFeedItem[];
  isLoading?: boolean;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  isLoading,
}) => {
  const navigate = useNavigate();
  const { t, formatDate } = useLanguage();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-xs text-slate-400">
        {t('common.loading')}
      </div>
    );
  }

  const getActivityIcon = (type: string, title: string) => {
    if (type === 'livestock') {
      return <Layers className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (type === 'milk') {
      return <Milk className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (type === 'health') {
      return <HeartPulse className="w-3.5 h-3.5 text-red-600" />;
    }
    if (type === 'finance') {
      return title.includes('+') ? (
        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5 text-red-600" />
      );
    }
    return <Clock className="w-3.5 h-3.5 text-slate-600" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{t('dashboard.recentActivity')}</h3>
          <p className="text-[11px] text-slate-500">{t('dashboard.kpiSubtitle')}</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400">
          {t('dashboard.noActivity')}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {activities.map((act) => (
            <div
              key={act.id}
              onClick={() => navigate(act.link)}
              className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="flex items-start space-x-2.5 min-w-0">
                <div className="p-1.5 rounded-md bg-slate-100 mt-0.5 flex-shrink-0">
                  {getActivityIcon(act.type, act.title)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {act.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 pl-2">
                <span className="text-[10px] text-slate-400">
                  {formatDate(act.date, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
