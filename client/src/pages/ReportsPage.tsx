import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LivestockAnalytics,
  MilkAnalytics,
  HealthAnalytics,
  VaccinationAnalytics,
  BreedingAnalytics,
  FeedAnalytics,
  FinanceAnalytics,
} from '../types';
import {
  getLivestockAnalyticsApi,
  getMilkAnalyticsApi,
  getHealthAnalyticsApi,
  getVaccinationAnalyticsApi,
  getBreedingAnalyticsApi,
  getFeedAnalyticsApi,
  getFinanceAnalyticsApi,
  downloadModuleCsvApi,
} from '../api/analytics.api';
import { DateRangeFilter } from '../components/analytics/DateRangeFilter';
import { MilkProductionChart } from '../components/analytics/MilkProductionChart';
import { FinancialTrendsChart } from '../components/analytics/FinancialTrendsChart';
import { DistributionPieChart } from '../components/analytics/DistributionPieChart';
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  AlertCircle,
  Milk,
  HeartPulse,
  Syringe,
  GitBranch,
  Wheat,
  TrendingUp,
  Layers,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { t, formatCurrency, formatNumber } = useLanguage();

  // Active Report Section Tab
  const [activeTab, setActiveTab] = useState<
    'livestock' | 'milk' | 'health' | 'vaccination' | 'breeding' | 'feed' | 'finance'
  >('milk');

  // Date Filter state
  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string; preset: string }>({
    preset: '30d',
  });

  // State for all analytics modules
  const [livestockData, setLivestockData] = useState<LivestockAnalytics | null>(null);
  const [milkData, setMilkData] = useState<MilkAnalytics | null>(null);
  const [healthData, setHealthData] = useState<HealthAnalytics | null>(null);
  const [vaccineData, setVaccineData] = useState<VaccinationAnalytics | null>(null);
  const [breedingData, setBreedingData] = useState<BreedingAnalytics | null>(null);
  const [feedData, setFeedData] = useState<FeedAnalytics | null>(null);
  const [financeData, setFinanceData] = useState<FinanceAnalytics | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { from: dateFilter.from, to: dateFilter.to };

      const [lRes, mRes, hRes, vRes, bRes, fRes, finRes] = await Promise.all([
        getLivestockAnalyticsApi().catch(() => null),
        getMilkAnalyticsApi(params).catch(() => null),
        getHealthAnalyticsApi().catch(() => null),
        getVaccinationAnalyticsApi().catch(() => null),
        getBreedingAnalyticsApi().catch(() => null),
        getFeedAnalyticsApi(params).catch(() => null),
        getFinanceAnalyticsApi(params).catch(() => null),
      ]);

      if (lRes?.success) setLivestockData(lRes.data);
      if (mRes?.success) setMilkData(mRes.data);
      if (hRes?.success) setHealthData(hRes.data);
      if (vRes?.success) setVaccineData(vRes.data);
      if (bRes?.success) setBreedingData(bRes.data);
      if (fRes?.success) setFeedData(fRes.data);
      if (finRes?.success) setFinanceData(finRes.data);

      if (!lRes && !mRes && !finRes) {
        setError(t('errors.serverUnavailable'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }, [dateFilter, t]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCsv = async (moduleName: string) => {
    try {
      setIsExporting(true);
      await downloadModuleCsvApi(moduleName, {
        from: dateFilter.from,
        to: dateFilter.to,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || t('errors.somethingWentWrong'));
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-emerald-700" />
            <span>{t('reports.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('reports.subtitle')} — {user?.farmName}
          </p>
        </div>

        {/* Global Export & Print Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExportCsv(activeTab === 'vaccination' ? 'vaccinations' : activeTab)}
            disabled={isExporting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? t('common.loading') : t('reports.downloadCsv')}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('reports.printReport')}</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        defaultPreset={dateFilter.preset}
        onFilterChange={(newFilter) => setDateFilter(newFilter)}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
          </div>
          <button
            onClick={fetchReports}
            className="text-amber-700 hover:text-amber-900 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> {t('common.refresh')}
          </button>
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3">
        {[
          { id: 'milk', label: t('reports.tabMilk'), icon: Milk },
          { id: 'finance', label: t('reports.tabFinance'), icon: TrendingUp },
          { id: 'livestock', label: t('reports.tabLivestock'), icon: Layers },
          { id: 'health', label: t('reports.tabHealth'), icon: HeartPulse },
          { id: 'vaccination', label: t('reports.tabVaccination'), icon: Syringe },
          { id: 'breeding', label: t('reports.tabBreeding'), icon: GitBranch },
          { id: 'feed', label: t('reports.tabFeed'), icon: Wheat },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT BY TAB */}

      {/* 1. MILK PRODUCTION REPORT */}
      {activeTab === 'milk' && (
        <div className="space-y-6">
          {/* Milk KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('common.total')}</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {milkData?.periodTotal ? `${formatNumber(milkData.periodTotal)} L` : '0 L'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('milk.subtitle')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.dailyTotal')}</span>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {milkData?.dailyAverage ? `${formatNumber(milkData.dailyAverage)} L` : '0 L'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('dashboard.kpiSubtitle')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.todayMilk')}</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {milkData?.todayTotal ? `${formatNumber(milkData.todayTotal)} L` : '0 L'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('milk.morningQuantity')} + {t('milk.eveningQuantity')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('milk.topAnimals')}</span>
              <p className="text-base font-bold text-slate-900 mt-1 truncate">
                {milkData?.highestProducer ? milkData.highestProducer.animalId : '—'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {milkData?.highestProducer
                  ? `${milkData.highestProducer.name} (${formatNumber(milkData.highestProducer.quantity)} L)`
                  : t('common.noData')}
              </p>
            </div>
          </div>

          {/* Chart: Daily Yield Curve */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('dashboard.milkProductionTrends')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('milk.subtitle')}</p>
            <MilkProductionChart data={milkData?.timeline || []} isLoading={loading} error={null} />
          </div>

          {/* Table: Animal-wise breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{t('milk.topAnimals')}</h3>
              <button
                onClick={() => handleExportCsv('milk')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>{t('common.exportCsv')}</span>
              </button>
            </div>
            {milkData?.byAnimal && milkData.byAnimal.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">{t('livestock.animalId')}</th>
                      <th className="px-4 py-2.5">{t('livestock.animalName')}</th>
                      <th className="px-4 py-2.5">{t('livestock.species')}</th>
                      <th className="px-4 py-2.5">{t('milk.totalQuantity')}</th>
                      <th className="px-4 py-2.5">{t('common.date')}</th>
                      <th className="px-4 py-2.5">{t('dashboard.dailyTotal')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {milkData.byAnimal.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{a.animalId}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{a.name}</td>
                        <td className="px-4 py-2.5">{a.species}</td>
                        <td className="px-4 py-2.5 font-bold text-blue-700">{formatNumber(a.totalQuantity)} L</td>
                        <td className="px-4 py-2.5">{formatNumber(a.count)} {t('common.days')}</td>
                        <td className="px-4 py-2.5">
                          {formatNumber(Number((a.totalQuantity / (a.count || 1)).toFixed(2)))} L
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                {t('milk.noMilkRecords')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. FINANCIAL REPORT */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.totalIncome')}</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {formatCurrency(financeData?.totalIncome || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('income.subtitle')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.totalExpenses')}</span>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {formatCurrency(financeData?.totalExpenses || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('expenses.subtitle')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.netIncome')}</span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  (financeData?.netIncome || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {formatCurrency(Math.abs(financeData?.netIncome || 0))}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {(financeData?.netIncome || 0) >= 0 ? t('dashboard.netProfit') : t('dashboard.netLoss')}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('feed.title')}</span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {formatCurrency(financeData?.feedCost || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('feed.subtitle')}</p>
            </div>
          </div>

          {/* Cash Flow Timeline Chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('dashboard.financialOverview')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('finance.financeSubtitle')}</p>
            <FinancialTrendsChart data={financeData?.timeline || []} isLoading={loading} error={null} />
          </div>

          {/* Donut Distribution Breakdown (Income & Expense) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">{t('reports.expenseBreakdown')}</h3>
              <p className="text-xs text-slate-500 mb-3">{t('expenses.subtitle')}</p>
              <DistributionPieChart
                data={(financeData?.expenseCategories || []).map((c) => ({
                  name: c.category,
                  value: c.amount,
                }))}
                valuePrefix="₹"
              />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">{t('reports.incomeBreakdown')}</h3>
              <p className="text-xs text-slate-500 mb-3">{t('income.subtitle')}</p>
              <DistributionPieChart
                data={(financeData?.incomeCategories || []).map((c) => ({
                  name: c.category,
                  value: c.amount,
                }))}
                valuePrefix="₹"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. LIVESTOCK REPORT */}
      {activeTab === 'livestock' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.totalLivestock')}</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(livestockData?.total || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('livestock.subtitle')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.healthyAnimals')}</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{formatNumber(livestockData?.healthy || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('livestock.healthy')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.attentionAnimals')}</span>
              <p className="text-2xl font-bold text-red-700 mt-1">{formatNumber(livestockData?.needsAttention || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('livestock.needsAttention')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.pregnantAnimals')}</span>
              <p className="text-2xl font-bold text-purple-700 mt-1">{formatNumber(livestockData?.pregnant || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('livestock.pregnant')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">{t('reports.speciesDistribution')}</h3>
              <p className="text-xs text-slate-500 mb-3">{t('livestock.species')}</p>
              <DistributionPieChart
                data={(livestockData?.bySpecies || []).map((s) => ({
                  name: s.species,
                  value: s.count,
                }))}
                valueSuffix=""
              />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">{t('reports.statusDistribution')}</h3>
              <p className="text-xs text-slate-500 mb-3">{t('livestock.status')}</p>
              <DistributionPieChart
                data={(livestockData?.byStatus || []).map((st) => ({
                  name: st.status,
                  value: st.count,
                }))}
                valueSuffix=""
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. HEALTH REPORT */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('health.title')}</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(healthData?.totalRecords || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('health.subtitle')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('health.followUpDate')}</span>
              <p className="text-2xl font-bold text-blue-700 mt-1">{formatNumber(healthData?.followupsDue || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('reminders.upcoming')}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('health.conditionsRanking')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('health.condition')}</p>
            <DistributionPieChart
              data={(healthData?.conditions || []).map((c) => ({
                name: c.condition,
                value: c.count,
              }))}
              valueSuffix=""
            />
          </div>
        </div>
      )}

      {/* 5. VACCINATION REPORT */}
      {activeTab === 'vaccination' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('vaccination.title')}</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(vaccineData?.total || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('vaccination.subtitle')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('vaccination.completed')}</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{formatNumber(vaccineData?.completed || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('vaccination.completed')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('vaccination.dueSoon')}</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">{formatNumber(vaccineData?.dueSoon || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('vaccination.dueWithinDays')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('vaccination.overdue')}</span>
              <p className="text-2xl font-bold text-red-700 mt-1">{formatNumber(vaccineData?.overdue || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('vaccination.overdue')}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('vaccination.upcomingSchedule')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('vaccination.vaccine')}</p>
            <DistributionPieChart
              data={(vaccineData?.byVaccineType || []).map((vt) => ({
                name: vt.type,
                value: vt.count,
              }))}
              valueSuffix=""
            />
          </div>
        </div>
      )}

      {/* 6. BREEDING REPORT */}
      {activeTab === 'breeding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('breeding.title')}</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(breedingData?.totalRecords || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('breeding.subtitle')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('dashboard.pregnantAnimals')}</span>
              <p className="text-2xl font-bold text-purple-700 mt-1">{formatNumber(breedingData?.pregnantCount || 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('breeding.confirmedPregnant')}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('breeding.pregnancyStatus')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('breeding.subtitle')}</p>
            <DistributionPieChart
              data={(breedingData?.statusBreakdown || []).map((s) => ({
                name: s.status,
                value: s.count,
              }))}
              valueSuffix=""
            />
          </div>
        </div>
      )}

      {/* 7. FEED REPORT */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('feed.title')}</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {feedData?.totalQuantity ? `${formatNumber(feedData.totalQuantity)} kg` : '0 kg'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('feed.subtitle')}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('feed.cost')}</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {formatCurrency(feedData?.totalCost || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('expenses.title')}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('reports.feedTypeDistribution')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('feed.feedType')}</p>
            <DistributionPieChart
              data={(feedData?.byType || []).map((t) => ({
                name: t.feedType,
                value: t.quantity,
              }))}
              valueSuffix=" kg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
