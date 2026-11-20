import React, { useState, useEffect, useCallback } from 'react';
import { FinanceRecord, SingleTypeSummary } from '../types';
import {
  getIncomeRecords,
  getIncomeSummary,
  createIncome,
  updateIncome,
  deleteIncome,
} from '../api/finance.api';
import { TransactionModal } from '../components/finance/TransactionModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import {
  TrendingUp,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  DollarSign,
  Tag,
  CreditCard,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const INCOME_CATEGORIES = [
  'All Categories',
  'Milk Sales',
  'Livestock Sale',
  'Manure Sale',
  'Breeding Service',
  'Government Subsidy',
  'Other',
];

export const IncomePage: React.FC = () => {
  const { t, formatDate, formatCurrency, formatNumber } = useLanguage();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<SingleTypeSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [dateRange, setDateRange] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await getIncomeSummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  // Fetch Income Records
  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'All Categories') params.category = selectedCategory;

      if (dateRange !== 'all' && dateRange !== 'custom') {
        params.range = dateRange;
      } else if (dateRange === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await getIncomeRecords(params);
      if (res.success) {
        setRecords(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 503) {
        setError('Database service currently offline. Income integration pending.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load income records');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, dateRange, startDate, endDate]);

  useEffect(() => {
    fetchRecords();
    fetchSummary();
  }, [fetchRecords, fetchSummary]);

  const handleCreateOrUpdate = async (formData: Partial<FinanceRecord>) => {
    setIsSubmitting(true);
    try {
      if (editingRecord) {
        const res = await updateIncome(editingRecord._id, formData);
        if (res.success) {
          setRecords((prev) =>
            prev.map((r) => (r._id === editingRecord._id ? res.data : r))
          );
        }
      } else {
        const res = await createIncome(formData);
        if (res.success) {
          setRecords((prev) => [res.data, ...prev]);
        }
      }
      setIsModalOpen(false);
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
      const res = await deleteIncome(deleteId);
      if (res.success) {
        setRecords((prev) => prev.filter((r) => r._id !== deleteId));
        setDeleteId(null);
        fetchSummary();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting income record');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered total sum
  const filteredTotal = records.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <span>{t('income.title', 'Farm Income')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('income.subtitle', 'Track farm revenue generated from milk sales, livestock trading, manure, and subsidies.')}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('income.addIncome', 'Add Income')}</span>
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
        {/* Today's Income */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('dashboard.income', "Today's Income")}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700">
            {formatCurrency(summary ? summary.today : 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{t('common.today', 'Revenue recorded today')}</p>
        </div>

        {/* This Week's Income */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('common.thisWeek', 'This Week')}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(summary ? summary.thisWeek : 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{t('analytics.weeklyTrends', 'Past 7 days revenue')}</p>
        </div>

        {/* This Month's Income */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('common.thisMonth', 'This Month')}</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(summary ? summary.thisMonth : 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{t('reports.monthlyTitle', 'Past 30 days total')}</p>
        </div>

        {/* Total Range / Filtered Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('finance.income', 'Filtered Total')}</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(filteredTotal)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{formatNumber(records.length)} {t('common.all', 'transactions displayed')}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t('common.search', 'Search')} ${t('finance.reference', 'description')}, ${t('finance.paymentMethod', 'payment')}...`}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label={t('finance.category', 'Category')}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="All Categories">{t('common.all', 'All Categories')}</option>
              {INCOME_CATEGORIES.filter(cat => cat !== 'All Categories').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
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

      {/* Income Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            {t('income.title', 'Income Records')} ({formatNumber(records.length)})
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
            <span>{t('common.loading', 'Loading income transactions...')}</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">{t('income.noRecords', 'No income records found.')}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t('income.subtitle', 'Record sales of milk, cattle, manure, or government subsidies to monitor cash flow.')}
            </p>
            <button
              onClick={() => {
                setEditingRecord(null);
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('income.addIncome', 'Record First Income')}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">{t('common.date', 'Date')}</th>
                  <th className="px-4 py-3">{t('finance.category', 'Category')}</th>
                  <th className="px-4 py-3">{t('finance.reference', 'Description')}</th>
                  <th className="px-4 py-3">{t('finance.amount', 'Amount')}</th>
                  <th className="px-4 py-3">{t('finance.paymentMethod', 'Payment')}</th>
                  <th className="px-4 py-3">{t('finance.reference', 'Ref / Notes')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Date */}
                    <td className="px-4 py-3 font-medium whitespace-nowrap text-slate-900">
                      {formatDate(r.date)}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {r.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                      {r.description}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-emerald-700 text-sm">
                      +{formatCurrency(r.amount)}
                    </td>

                    {/* Payment Method */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-slate-600">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.paymentMethod || 'Cash'}</span>
                      </div>
                    </td>

                    {/* Ref / Notes */}
                    <td className="px-4 py-3 max-w-xs truncate text-slate-500">
                      {r.reference ? (
                        <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded mr-1">
                          {r.reference}
                        </span>
                      ) : null}
                      {r.notes || (r.reference ? '' : '—')}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingRecord(r);
                            setIsModalOpen(true);
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Income Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        type="income"
        initialData={editingRecord}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteId)}
        title={`${t('common.delete', 'Delete')} ${t('income.title', 'Income Record')}`}
        message={t('common.confirmDelete', 'Are you sure you want to remove this income entry? This will update your total revenue and net income.')}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
