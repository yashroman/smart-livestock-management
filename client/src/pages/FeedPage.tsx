import React, { useState, useEffect, useCallback } from 'react';
import { FeedRecord, Livestock, FeedSummary } from '../types';
import {
  getFeedRecords,
  getFeedSummary,
  createFeedRecord,
  updateFeedRecord,
  deleteFeedRecord,
} from '../api/feed.api';
import { getLivestock } from '../api/livestock.api';
import { FeedRecordModal } from '../components/feed/FeedRecordModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import {
  Wheat,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  Layers,
  Scale,
  IndianRupee,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FEED_TYPES = [
  'All Types',
  'Green Fodder',
  'Dry Fodder',
  'Hay',
  'Silage',
  'Concentrate',
  'Mineral Mixture',
  'Other',
];

export const FeedPage: React.FC = () => {
  const { t, formatDate, formatCurrency, formatNumber } = useLanguage();
  const [records, setRecords] = useState<FeedRecord[]>([]);
  const [animals, setAnimals] = useState<Livestock[]>([]);
  const [summary, setSummary] = useState<FeedSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedFeedType, setSelectedFeedType] = useState<string>('All Types');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<FeedRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await getFeedSummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch {
      // Background summary failure, handled gracefully
    }
  }, []);

  // Fetch Feed Records
  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (selectedFeedType !== 'All Types') params.feedType = selectedFeedType;
      if (selectedAnimalId) params.livestockId = selectedAnimalId;

      if (dateRange !== 'all' && dateRange !== 'custom') {
        params.range = dateRange;
      } else if (dateRange === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await getFeedRecords(params);
      if (res.success) {
        setRecords(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 503) {
        setError('Database service currently offline. Feed integration pending.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load feed records');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedFeedType, selectedAnimalId, dateRange, startDate, endDate]);

  // Fetch Animals for dropdown
  const fetchAnimals = async () => {
    try {
      const res = await getLivestock();
      if (res.success) {
        setAnimals(res.data);
      }
    } catch {
      // Keep empty if DB offline
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchSummary();
  }, [fetchRecords, fetchSummary]);

  const handleCreateOrUpdate = async (formData: Partial<FeedRecord>) => {
    setIsSubmitting(true);
    try {
      if (editingRecord) {
        const res = await updateFeedRecord(editingRecord._id, formData);
        if (res.success) {
          setRecords((prev) =>
            prev.map((r) => (r._id === editingRecord._id ? res.data : r))
          );
        }
      } else {
        const res = await createFeedRecord(formData);
        if (res.success) {
          setRecords((prev) => [res.data, ...prev]);
        }
      }
      setIsRecordModalOpen(false);
      setEditingRecord(null);
      fetchSummary();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteFeedRecord(deleteId);
      if (res.success) {
        setRecords((prev) => prev.filter((r) => r._id !== deleteId));
        setDeleteId(null);
        fetchSummary();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting feed record');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Wheat className="w-6 h-6 text-emerald-700" />
            <span>{t('feed.title', 'Feed Management')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('feed.subtitle', 'Track daily feed allocation, fodder types, and nutritional expenses across individual animals or herd groups.')}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setIsRecordModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('feed.addRecord', 'Record Feed')}</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={() => {
              fetchRecords();
              fetchSummary();
            }}
            className="text-amber-700 hover:text-amber-900 font-semibold text-xs flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> {t('common.retry', 'Retry')}
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Feed Quantity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('feed.quantity', "Today's Quantity")}</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {summary ? `${formatNumber(summary.todayQuantity)} kg` : '0 kg'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary?.todayEntries ? `${formatNumber(summary.todayEntries)} ${t('common.all', 'allocations logged')}` : t('common.noData', 'No logs yet today')}
          </p>
        </div>

        {/* Today's Feed Cost */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('feed.cost', "Today's Cost")}</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(summary ? summary.todayCost : 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{t('feed.subtitle', 'Daily ration expenditure')}</p>
        </div>

        {/* This Week's Cost */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('analytics.weeklyTrends', "This Week's Cost")}</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(summary ? summary.weekCost : 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary ? `${formatNumber(summary.weekQuantity)} kg ${t('common.all', 'total')}` : t('common.thisWeek', 'Last 7 days')}
          </p>
        </div>

        {/* This Month's Cost */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('analytics.monthlyProduction', "This Month's Cost")}</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(summary ? summary.monthCost : 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{t('reports.monthlyTitle', 'Last 30 days total')}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t('common.search', 'Search')} ${t('feed.feedType', 'feed')}, ${t('feed.herdGroup', 'group')}, ${t('common.notes', 'notes')}...`}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Feed Type Filter */}
          <div>
            <select
              value={selectedFeedType}
              onChange={(e) => setSelectedFeedType(e.target.value)}
              aria-label={t('feed.feedType', 'Feed Type')}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="All Types">{t('common.all', 'All Types')}</option>
              {FEED_TYPES.filter(type => type !== 'All Types').map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Animal Filter */}
          <div>
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              aria-label={t('feed.allHerd', 'All Animals & Groups')}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">{t('feed.allHerd', 'All Animals & Groups')}</option>
              {animals.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.animalId} - {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Preset */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label={t('common.date', 'Date Range')}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">{t('common.all', 'All Dates')}</option>
              <option value="today">{t('common.today', 'Today')}</option>
              <option value="week">{t('common.thisWeek', 'Past 7 Days')}</option>
              <option value="month">{t('common.thisMonth', 'Past 30 Days')}</option>
              <option value="custom">{t('common.customRange', 'Custom Date Range')}</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">{t('common.startDate', 'From')}:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title={t('common.startDate', 'From')}
              aria-label={t('common.startDate', 'From')}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-slate-500 font-medium">{t('common.endDate', 'To')}:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title={t('common.endDate', 'To')}
              aria-label={t('common.endDate', 'To')}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Feed Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            {t('feed.title', 'Feed Records')} ({formatNumber(records.length)})
          </span>
          <button
            onClick={() => {
              fetchRecords();
              fetchSummary();
            }}
            title={t('common.refresh', 'Refresh')}
            aria-label={t('common.refresh', 'Refresh')}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <span>{t('common.loading', 'Loading feed records...')}</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Wheat className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">{t('feed.noFeedRecords', 'No feed records found.')}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t('feed.subtitle', 'Start recording fodder, silage, and mineral allocations to track your herd intake and costs.')}
            </p>
            <button
              onClick={() => {
                setEditingRecord(null);
                setIsRecordModalOpen(true);
              }}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('feed.addRecord', 'Record First Allocation')}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">{t('common.date', 'Date')}</th>
                  <th className="px-4 py-3">{t('feed.target', 'Destination')}</th>
                  <th className="px-4 py-3">{t('feed.feedType', 'Feed Type')}</th>
                  <th className="px-4 py-3">{t('feed.quantity', 'Quantity')}</th>
                  <th className="px-4 py-3">{t('feed.cost', 'Est. Cost')}</th>
                  <th className="px-4 py-3">{t('common.notes', 'Notes')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r) => {
                  const animalObj = typeof r.livestockId === 'object' ? r.livestockId : null;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3 font-medium whitespace-nowrap text-slate-900">
                        {formatDate(r.date)}
                      </td>

                      {/* Destination: Animal or Group */}
                      <td className="px-4 py-3">
                        {animalObj ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-slate-900">
                              {animalObj.animalId}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({animalObj.name} • {animalObj.species})
                            </span>
                          </div>
                        ) : r.group ? (
                          <div className="flex items-center space-x-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex text-[11px] font-medium">
                            <Layers className="w-3 h-3 mr-1" />
                            <span>{r.group}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">{t('feed.allHerd', 'Whole Herd')}</span>
                        )}
                      </td>

                      {/* Feed Type */}
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          {r.feedType}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatNumber(r.quantity)} {r.unit}
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3 text-slate-900">
                        {r.cost ? formatCurrency(r.cost) : '—'}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3 max-w-xs truncate text-slate-500" title={r.notes}>
                        {r.notes || '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingRecord(r);
                              setIsRecordModalOpen(true);
                            }}
                            title={t('common.edit', 'Edit')}
                            aria-label={t('common.edit', 'Edit')}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(r._id)}
                            title={t('common.delete', 'Delete')}
                            aria-label={t('common.delete', 'Delete')}
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-slate-100 rounded-md transition-colors"
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
        )}
      </div>

      {/* Feed Record Modal */}
      <FeedRecordModal
        isOpen={isRecordModalOpen}
        initialData={editingRecord}
        animals={animals}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteId)}
        title={`${t('common.delete', 'Delete')} ${t('feed.title', 'Feed Record')}`}
        message={t('common.confirmDelete', 'Are you sure you want to remove this feed record? This action cannot be undone.')}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
