import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { MilkAnalyticsTimelinePoint } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Milk, AlertCircle } from 'lucide-react';

interface MilkProductionChartProps {
  data: MilkAnalyticsTimelinePoint[];
  isLoading?: boolean;
  error?: string | null;
}

export const MilkProductionChart: React.FC<MilkProductionChartProps> = ({
  data,
  isLoading,
  error,
}) => {
  const { t, formatDate } = useLanguage();

  if (isLoading) {
    return (
      <div className="h-64 sm:h-72 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400">
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 sm:h-72 flex flex-col items-center justify-center bg-amber-50 rounded-xl border border-amber-200 p-4 text-xs text-amber-800">
        <AlertCircle className="w-6 h-6 mb-1 text-amber-600" />
        <p className="font-semibold">{t('errors.somethingWentWrong')}</p>
        <p className="text-[11px] text-amber-700 mt-0.5">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 sm:h-72 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-400">
        <Milk className="w-8 h-8 mb-2 text-slate-300" />
        <p className="font-semibold text-slate-600">{t('milk.noMilkRecords')}</p>
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    formattedDate: formatDate(d.date, {
      month: 'short',
      day: 'numeric',
    }),
  }));

  const morningLabel = t('dashboard.morningYield');
  const eveningLabel = t('dashboard.eveningYield');
  const totalLabel = t('dashboard.dailyTotal');

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="morningColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="eveningColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val} L`}
          />
          <Tooltip
            formatter={(value: any, name: any) => [`${value} L`, name]}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '11px',
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
          />
          <Area
            type="monotone"
            dataKey="morningQuantity"
            name={morningLabel}
            stroke="#0284c7"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#morningColor)"
          />
          <Area
            type="monotone"
            dataKey="eveningQuantity"
            name={eveningLabel}
            stroke="#0d9488"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#eveningColor)"
          />
          <Area
            type="monotone"
            dataKey="totalQuantity"
            name={totalLabel}
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#totalColor)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
