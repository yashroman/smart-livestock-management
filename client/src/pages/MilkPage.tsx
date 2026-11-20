import React, { useState, useEffect, useCallback } from 'react';
import { MilkRecord, Livestock } from '../types';
import {
  getMilkRecordsApi,
  getMilkSummaryApi,
  createMilkRecordApi,
  updateMilkRecordApi,
  deleteMilkRecordApi,
  MilkSummaryData,
} from '../api/milk.api';
import { getLivestockListApi } from '../api/livestock.api';
import { MilkRecordModal } from '../components/milk/MilkRecordModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import {
  Milk,
  Plus,
  Filter,
  RefreshCw,
  AlertCircle,
  Edit2,
  Trash2,
  TrendingUp,
  Droplet,
  Award,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const MilkPage: React.FC = () => {
  const { t, formatDate, formatNumber } = useLanguage();
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [animals, setAnimals] = useState<Livestock[]>([]);
  const [summary, setSummary] = useState<MilkSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [overallTotal, setOverallTotal] = useState<number>(0);

  // Filters
  const [rangeFilter, setRangeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [animalFilter, setAnimalFilter] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MilkRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<MilkRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getLivestockListApi()
      .then((res) => {
        if (res.success) setAnimals(res.data);
      })
      .catch(() => null);
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getMilkSummaryApi();
      if (res.success) {
        setSummary(res.data);
      }
    } catch {
      // Ignored if offline
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMilkRecordsApi({
        range: rangeFilter === 'all' ? undefined : rangeFilter,
        livestockId: animalFilter !== 'all' ? animalFilter : undefined,
      });
      if (res.success) {
        setRecords(res.data);
        setOverallTotal(res.overallTotal);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error loading milk records');
    } finally {
      setLoading(false);
    }
  }, [rangeFilter, animalFilter]);

  useEffect(() => {
    fetchRecords();
    fetchSummary();
  }, [fetchRecords, fetchSummary]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: MilkRecord) => {
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: Partial<MilkRecord>) => {
    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await updateMilkRecordApi(editingRecord._id, formData);
      } else {
        await createMilkRecordApi(formData);
      }
      setIsModalOpen(false);
      setEditingRecord(null);
      await Promise.all([fetchRecords(), fetchSummary()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await deleteMilkRecordApi(deletingRecord._id);
      setDeletingRecord(null);
      await Promise.all([fetchRecords(), fetchSummary()]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting milk record');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <Milk className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t('milk.title', 'Milk Production Tracking')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('milk.subtitle', 'Log morning and evening milk yields with automated daily total computation')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              fetchRecords();
              fetchSummary();
            }}
            disabled={loading}
            title={t('common.refresh', 'Refresh')}
            aria-label={t('common.refresh', 'Refresh')}
            className="farm-btn-secondary text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="farm-btn-primary text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>{t('milk.recordMilk', 'Record Milk Yield')}</span>
          </button>
        </div>
      </div>

      {/* Production Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">{t('dashboard.dailyTotal', "Today's Milk Yield")}</span>
            <div className="p-2 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-blue-900">
              {formatNumber(summary ? summary.todayTotal : 0)}
            </span>
            <span className="text-xs text-slate-500 ml-1">L</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">{t('common.today', "Recorded on today's date")}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">{t('analytics.weeklyTrends', 'Last 7 Days Yield')}</span>
            <div className="p-2 rounded-md bg-farm-50 text-farm-700 border border-farm-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {formatNumber(summary ? summary.weekTotal : 0)}
            </span>
            <span className="text-xs text-slate-500 ml-1">L</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {t('common.total', 'Avg')}: {summary ? formatNumber(Number((summary.weekTotal / 7).toFixed(1))) : 0} L/day
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">{t('analytics.monthlyProduction', 'Monthly Production')}</span>
            <div className="p-2 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {formatNumber(summary ? summary.monthTotal : 0)}
            </span>
            <span className="text-xs text-slate-500 ml-1">L</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">{t('reports.monthlyTitle', 'Past 30-day cumulative volume')}</span>
        </div>
      </div>

      {/* Filter and Quick Range Buttons */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Preset Range Tabs */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs">
            <button
              onClick={() => setRangeFilter('today')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                rangeFilter === 'today'
                  ? 'bg-white text-farm-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('common.today', 'Today')}
            </button>
            <button
              onClick={() => setRangeFilter('week')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                rangeFilter === 'week'
                  ? 'bg-white text-farm-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('common.thisWeek', 'This Week (7d)')}
            </button>
            <button
              onClick={() => setRangeFilter('month')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                rangeFilter === 'month'
                  ? 'bg-white text-farm-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('common.thisMonth', 'This Month (30d)')}
            </button>
            <button
              onClick={() => setRangeFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                rangeFilter === 'all'
                  ? 'bg-white text-farm-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('common.all', 'All Records')}
            </button>
          </div>

          {/* Animal Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={animalFilter}
              onChange={(e) => setAnimalFilter(e.target.value)}
              aria-label={t('milk.animal', 'Filter by Milking Animal')}
              className="py-1.5 px-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white font-medium"
            >
              <option value="all">{t('common.all', 'All Milking Animals')}</option>
              {animals
                .filter((a) => a.gender === 'Female')
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.animalId})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Records Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-farm-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">{t('common.loading', 'Loading milk logs...')}</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Milk className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t('milk.noMilkRecords', 'No Milk Records Found')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {animalFilter !== 'all' || rangeFilter !== 'all'
              ? t('common.noData', 'No records match the specified date range and animal filter.')
              : t('milk.noMilkRecords', 'No milk production has been logged yet.')}
          </p>
          <button onClick={handleOpenAdd} className="farm-btn-primary text-xs cursor-pointer">
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{t('milk.recordMilk', 'Record First Milk Yield')}</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              {t('common.all', 'Showing')} {formatNumber(records.length)} {t('common.all', 'entries')}
            </span>
            <span className="text-blue-900 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              {t('common.total', 'Selected Period Sum')}: {formatNumber(overallTotal)} L
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('common.date', 'Date')}</th>
                  <th className="py-3 px-4">{t('livestock.title', 'Animal')}</th>
                  <th className="py-3 px-4">{t('milk.morningQuantity', 'Morning (L)')}</th>
                  <th className="py-3 px-4">{t('milk.eveningQuantity', 'Evening (L)')}</th>
                  <th className="py-3 px-4">{t('milk.totalQuantity', 'Total Yield')}</th>
                  <th className="py-3 px-4">{t('common.notes', 'Notes')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => {
                  const animal =
                    typeof r.livestockId === 'object' && r.livestockId !== null
                      ? (r.livestockId as any)
                      : null;

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-3 px-4">
                        {animal ? (
                          <div>
                            <span className="font-bold text-slate-900 block">{animal.name}</span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {animal.animalId} • {animal.species}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">{t('common.unknown', 'Unknown Animal')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">{formatNumber(r.morningQuantity)} L</td>
                      <td className="py-3 px-4 font-mono">{formatNumber(r.eveningQuantity)} L</td>
                      <td className="py-3 px-4 font-bold text-blue-700 text-sm whitespace-nowrap">
                        {formatNumber(r.totalQuantity)} L
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {r.notes || '--'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1 text-slate-500 hover:text-farm-700 hover:bg-farm-50 rounded"
                            title={t('common.edit', 'Edit Milk Record')}
                            aria-label={t('common.edit', 'Edit Milk Record')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingRecord(r)}
                            className="p-1 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title={t('common.delete', 'Delete Record')}
                            aria-label={t('common.delete', 'Delete Record')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Producing Animals Breakdown */}
      {summary && summary.animalBreakdown && summary.animalBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
            <Award className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              {t('milk.topAnimals', 'Top Milking Animals (30-Day Cumulative)')}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {summary.animalBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{item.name}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {item.animalId} • {item.species}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-blue-700 block">
                    {formatNumber(item.totalYield)} L
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {t('common.total', 'Avg')} {formatNumber(item.avgDaily)} L/rec
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <MilkRecordModal
        isOpen={isModalOpen}
        initialData={editingRecord}
        animals={animals}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deletingRecord}
        title={`${t('common.delete', 'Delete')} ${t('milk.recordMilk', 'Milk Record')}`}
        message={t('common.confirmDelete', 'Are you sure you want to delete this milk production entry?')}
        itemName={deletingRecord ? `${formatNumber(deletingRecord.totalQuantity)}L on ${formatDate(deletingRecord.date)}` : undefined}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingRecord(null)}
      />
    </div>
  );
};
