import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  AnalyticsOverview,
  MilkAnalytics,
  FinanceAnalytics,
  Livestock,
} from '../types';
import {
  getAnalyticsOverviewApi,
  getMilkAnalyticsApi,
  getFinanceAnalyticsApi,
} from '../api/analytics.api';
import { getLivestockListApi } from '../api/livestock.api';
import { MilkProductionChart } from '../components/analytics/MilkProductionChart';
import { FinancialTrendsChart } from '../components/analytics/FinancialTrendsChart';
import { AttentionRequiredCard } from '../components/dashboard/AttentionRequiredCard';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import {
  ShieldCheck,
  Layers,
  HeartPulse,
  Milk,
  Plus,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wheat,
  BellRing,
  Wallet,
  Calendar,
  Syringe,
  GitBranch,
  Bot,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { language, languageNames, t, formatCurrency, formatNumber } = useLanguage();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [milkData, setMilkData] = useState<MilkAnalytics | null>(null);
  const [financeData, setFinanceData] = useState<FinanceAnalytics | null>(null);
  const [recentAnimals, setRecentAnimals] = useState<Livestock[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Timeframe toggle for milk chart
  const [milkRange, setMilkRange] = useState<'7d' | '30d'>('7d');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, milkRes, financeRes, livestockRes] = await Promise.all([
        getAnalyticsOverviewApi().catch(() => null),
        getMilkAnalyticsApi({ range: milkRange }).catch(() => null),
        getFinanceAnalyticsApi({ range: '30d' }).catch(() => null),
        getLivestockListApi().catch(() => null),
      ]);

      if (overviewRes?.success) setOverview(overviewRes.data);
      if (milkRes?.success) setMilkData(milkRes.data);
      if (financeRes?.success) setFinanceData(financeRes.data);
      if (livestockRes?.success) setRecentAnimals(livestockRes.data.slice(0, 5));

      if (!overviewRes && !milkRes && !financeRes) {
        setError('Database analytics service unavailable. Integration pending.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Database analytics unavailable. Ensure server and MongoDB are online.'
      );
    } finally {
      setLoading(false);
    }
  }, [milkRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const kpis = overview?.kpis;
  const netIncome = kpis ? kpis.netIncome : 0;

  return (
    <div className="space-y-6">
      {/* SECTION A: TOP FARM OVERVIEW & IDENTITY BANNER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-farm-800 bg-farm-50 px-2.5 py-1 rounded-md border border-farm-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Isolated Farm Tenant</span>
              </span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                {t('navigation.language')}: {languageNames[language]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t('auth.welcomeBack')}, {user?.fullName || ''}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {t('auth.farmName')}: <strong className="text-slate-800 font-semibold">{user?.farmName}</strong> •{' '}
              {t('auth.location')}: <span className="text-slate-700">{user?.location}</span> •{' '}
              {t('auth.mobile')}: <span className="text-slate-700">{user?.mobile}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="farm-btn-secondary text-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh')}</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="farm-btn-primary text-xs cursor-pointer flex items-center space-x-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('navigation.reports')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error state if database is offline */}
      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">{t('errors.serverUnavailable')}</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* SECTION B: CORE FARM OVERVIEW KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('dashboard.farmOverview')}
          </h2>
          <span className="text-[11px] text-slate-400">{t('dashboard.kpiSubtitle')}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Total Livestock */}
          <div
            onClick={() => navigate('/livestock')}
            className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:border-emerald-400 hover:shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] font-semibold">{t('dashboard.totalLivestock')}</span>
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2.5">
              <span className="text-xl font-bold text-slate-900">
                {kpis ? formatNumber(kpis.totalLivestock) : '--'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium flex items-center mt-1.5">
              <span>{t('common.view')} &rarr;</span>
            </span>
          </div>

          {/* 2. Healthy Animals */}
          <div
            onClick={() => navigate('/livestock')}
            className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:border-emerald-400 hover:shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-semibold">{t('dashboard.healthyAnimals')}</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2.5">
              <span className="text-xl font-bold text-emerald-800">
                {kpis ? formatNumber(kpis.healthyAnimals) : '--'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium flex items-center mt-1.5">
              <span>{t('livestock.healthy')}</span>
            </span>
          </div>

          {/* 3. Needs Attention */}
          <div
            onClick={() => navigate('/health')}
            className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:border-red-400 hover:shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-red-700">
              <span className="text-[11px] font-semibold">{t('dashboard.attentionAnimals')}</span>
              <HeartPulse className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="mt-2.5">
              <span className="text-xl font-bold text-red-700">
                {kpis ? formatNumber(kpis.attentionAnimals) : '--'}
              </span>
            </div>
            <span className="text-[10px] text-red-600 font-medium flex items-center mt-1.5">
              <span>{t('navigation.health')} &rarr;</span>
            </span>
          </div>

          {/* 4. Pregnant Animals */}
          <div
            onClick={() => navigate('/breeding')}
            className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:border-purple-400 hover:shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-purple-800">
              <span className="text-[11px] font-semibold">{t('dashboard.pregnantAnimals')}</span>
              <GitBranch className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="mt-2.5">
              <span className="text-xl font-bold text-purple-800">
                {kpis ? formatNumber(kpis.pregnantAnimals) : '--'}
              </span>
            </div>
            <span className="text-[10px] text-purple-700 font-medium flex items-center mt-1.5">
              <span>{t('navigation.breeding')} &rarr;</span>
            </span>
          </div>

          {/* 5. Today's Milk */}
          <div
            onClick={() => navigate('/milk')}
            className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-blue-900">
              <span className="text-[11px] font-semibold">{t('dashboard.todayMilk')}</span>
              <Milk className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-2.5">
              <span className="text-xl font-bold text-blue-900">
                {kpis ? formatNumber(kpis.todayMilk) : '--'}
              </span>
              <span className="text-[11px] text-blue-600 ml-1">L</span>
            </div>
            <span className="text-[10px] text-blue-700 font-medium flex items-center mt-1.5">
              <span>{t('navigation.milk')} &rarr;</span>
            </span>
          </div>

          {/* 6. Net Farm Income */}
          <div
            onClick={() => navigate('/income')}
            className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:border-emerald-400 hover:shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-[11px] font-semibold">{t('dashboard.netIncome')}</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2.5">
              <span
                className={`text-xl font-bold ${
                  netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {kpis ? formatCurrency(Math.abs(netIncome)) : '--'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium flex items-center mt-1.5">
              <span>{netIncome >= 0 ? t('dashboard.netProfit') : t('dashboard.netLoss')} &rarr;</span>
            </span>
          </div>
        </div>
      </div>

      {/* PHASE 7: AI FARM ASSISTANT WIDGET */}
      <div className="bg-gradient-to-r from-emerald-800 to-farm-900 rounded-xl p-4 text-white shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-700/60 rounded-xl text-emerald-200">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{t('ai.dashboardWidgetTitle')}</h3>
            <p className="text-xs text-emerald-200/90 mt-0.5">{t('ai.dashboardWidgetSubtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/ai-assistant')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          {t('ai.dashboardWidgetButton')} &rarr;
        </button>
      </div>

      {/* SECTION C: QUICK ACTIONS TOOLBAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
          {t('dashboard.quickActions')}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/ai-assistant')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{t('ai.title')}</span>
          </button>
          <button
            onClick={() => navigate('/livestock')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors border border-emerald-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('dashboard.addLivestock')}</span>
          </button>
          <button
            onClick={() => navigate('/milk')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg transition-colors border border-blue-200 cursor-pointer"
          >
            <Milk className="w-3.5 h-3.5" />
            <span>{t('dashboard.recordMilk')}</span>
          </button>
          <button
            onClick={() => navigate('/health')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold rounded-lg transition-colors border border-red-200 cursor-pointer"
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>{t('dashboard.logHealth')}</span>
          </button>
          <button
            onClick={() => navigate('/vaccination')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg transition-colors border border-amber-200 cursor-pointer"
          >
            <Syringe className="w-3.5 h-3.5" />
            <span>{t('vaccination.addVaccination')}</span>
          </button>
          <button
            onClick={() => navigate('/breeding')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-lg transition-colors border border-purple-200 cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>{t('breeding.addRecord')}</span>
          </button>
          <button
            onClick={() => navigate('/feed')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors border border-emerald-200 cursor-pointer"
          >
            <Wheat className="w-3.5 h-3.5" />
            <span>{t('dashboard.logFeed')}</span>
          </button>
          <button
            onClick={() => navigate('/income')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors border border-emerald-200 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t('dashboard.addIncome')}</span>
          </button>
          <button
            onClick={() => navigate('/expenses')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold rounded-lg transition-colors border border-red-200 cursor-pointer"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{t('dashboard.addExpense')}</span>
          </button>
          <button
            onClick={() => navigate('/reminders')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg transition-colors border border-amber-200 cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{t('dashboard.scheduleReminder')}</span>
          </button>
        </div>
      </div>

      {/* SECTION D: MILK PRODUCTION & FINANCIAL CHARTS (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milk Production Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Milk className="w-4 h-4 text-blue-600" />
                <span>{t('dashboard.milkProductionTrends')}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {t('milk.subtitle')}
              </p>
            </div>

            {/* Timeframe toggle */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setMilkRange('7d')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  milkRange === '7d'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('reports.filter7d')}
              </button>
              <button
                onClick={() => setMilkRange('30d')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  milkRange === '30d'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('reports.filter30d')}
              </button>
            </div>
          </div>

          <MilkProductionChart
            data={milkData?.timeline || []}
            isLoading={loading}
            error={null}
          />

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              {t('common.total')}: <strong className="text-slate-900">{formatNumber(milkData?.periodTotal)} L</strong>
            </span>
            <span>
              {t('milk.topAnimals')}:{' '}
              <strong className="text-blue-800">
                {milkData?.highestProducer
                  ? `${milkData.highestProducer.animalId} (${milkData.highestProducer.quantity} L)`
                  : '—'}
              </strong>
            </span>
          </div>
        </div>

        {/* Financial Trends Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>{t('dashboard.financialOverview')}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {t('finance.financeSubtitle')}
              </p>
            </div>
            <button
              onClick={() => navigate('/income')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              {t('common.viewDetails')} &rarr;
            </button>
          </div>

          <FinancialTrendsChart
            data={financeData?.timeline || []}
            isLoading={loading}
            error={null}
          />

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <span>
              {t('finance.income')}: <strong className="text-emerald-700">{formatCurrency(financeData?.totalIncome || 0)}</strong>
            </span>
            <span>
              {t('finance.expenses')}: <strong className="text-red-700">{formatCurrency(financeData?.totalExpenses || 0)}</strong>
            </span>
            <span>
              {t('feed.title')}: <strong className="text-slate-900">{formatCurrency(financeData?.feedCost || 0)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION E: ATTENTION REQUIRED & RECENT ACTIVITY (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttentionRequiredCard
          alerts={overview?.alerts || []}
          isLoading={loading}
        />
        <RecentActivityFeed
          activities={overview?.recentActivity || []}
          isLoading={loading}
        />
      </div>

      {/* SECTION F: RECENT HERD INVENTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('dashboard.recentHerd')}</h3>
            <p className="text-xs text-slate-500">{t('livestock.subtitle')}</p>
          </div>
          <button
            onClick={() => navigate('/livestock')}
            className="text-xs font-semibold text-farm-800 hover:text-farm-900 flex items-center space-x-1 cursor-pointer"
          >
            <span>{t('common.viewAll')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentAnimals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">{t('livestock.animalId')}</th>
                  <th className="py-2.5 px-4">{t('livestock.animalName')}</th>
                  <th className="py-2.5 px-4">{t('livestock.species')}</th>
                  <th className="py-2.5 px-4">{t('livestock.breed')}</th>
                  <th className="py-2.5 px-4">{t('livestock.gender')}</th>
                  <th className="py-2.5 px-4">{t('livestock.weight')}</th>
                  <th className="py-2.5 px-4">{t('livestock.status')}</th>
                  <th className="py-2.5 px-4 text-right">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAnimals.map((animal) => (
                  <tr
                    key={animal._id}
                    onClick={() => navigate(`/livestock/${animal._id}`)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {animal.animalId}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{animal.name}</td>
                    <td className="py-2.5 px-4">{animal.species}</td>
                    <td className="py-2.5 px-4">{animal.breed}</td>
                    <td className="py-2.5 px-4">{animal.gender}</td>
                    <td className="py-2.5 px-4">{formatNumber(animal.weight)} kg</td>
                    <td className="py-2.5 px-4">
                      <span className="farm-badge bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {animal.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-farm-800">
                      {t('common.viewDetails')} &rarr;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            {t('dashboard.noHerd')}
          </div>
        )}
      </div>
    </div>
  );
};
