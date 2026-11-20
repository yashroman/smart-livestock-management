import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext';
import { PieChart as PieIcon } from 'lucide-react';

interface DistributionItem {
  name: string;
  value: number;
}

interface DistributionPieChartProps {
  data: DistributionItem[];
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
}

const COLORS = [
  '#10b981', // emerald
  '#0284c7', // sky
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#14b8a6', // teal
  '#ec4899', // pink
  '#64748b', // slate
];

export const DistributionPieChart: React.FC<DistributionPieChartProps> = ({
  data,
  valuePrefix = '',
  valueSuffix = '',
  height = 240,
}) => {
  const { t, formatNumber } = useLanguage();

  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400"
      >
        <PieIcon className="w-7 h-7 mb-1.5 text-slate-300" />
        <span>{t('common.noData')}</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            formatter={(val: any) => [`${valuePrefix}${formatNumber(Number(val))}${valueSuffix}`, '']}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '11px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            outerRadius={75}
            innerRadius={45}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
