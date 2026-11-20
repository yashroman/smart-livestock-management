import React from 'react';
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { FinanceAnalyticsTimelinePoint } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { DollarSign, AlertCircle } from 'lucide-react';

interface FinancialTrendsChartProps {
  data: FinanceAnalyticsTimelinePoint[];
  isLoading?: boolean;
  error?: string | null;
}

export const FinancialTrendsChart: React.FC<FinancialTrendsChartProps> = ({
  data,
  isLoading,
  error,
}) => {
  const { t, formatDate, formatCurrency } = useLanguage();

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
        <DollarSign className="w-8 h-8 mb-2 text-slate-300" />
        <p className="font-semibold text-slate-600">{t('finance.noTransactions')}</p>
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

  const incomeLabel = t('dashboard.income');
  const expenseLabel = t('dashboard.expense');
  const netLabel = t('dashboard.netProfit');

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip
            formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
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
          <Bar dataKey="income" name={incomeLabel} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="expense" name={expenseLabel} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Line
            type="monotone"
            dataKey="net"
            name={netLabel}
            stroke="#0284c7"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
