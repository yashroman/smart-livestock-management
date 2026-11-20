import React, { useState, useEffect, useCallback } from 'react';
import { Reminder, Livestock, ReminderCounts, ReminderPriority } from '../types';
import {
  getReminders,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
} from '../api/reminder.api';
import { getLivestock } from '../api/livestock.api';
import { ReminderModal } from '../components/reminders/ReminderModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { useLanguage } from '../context/LanguageContext';
import {
  BellRing,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
} from 'lucide-react';

const REMINDER_TYPES = [
  'All Types',
  'Vaccination',
  'Health Check',
  'Breeding',
  'Pregnancy',
  'Feeding',
  'Milk Recording',
  'Veterinary Visit',
  'Other',
];

const PRIORITIES = ['All Priorities', 'Low', 'Medium', 'High', 'Urgent'];

export const RemindersPage: React.FC = () => {
  const { t, formatDate, formatNumber } = useLanguage();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [animals, setAnimals] = useState<Livestock[]>([]);
  const [counts, setCounts] = useState<ReminderCounts>({
    pending: 0,
    completed: 0,
    overdue: 0,
    today: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'completed'>(
    'all'
  );

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [selectedPriority, setSelectedPriority] = useState<string>('All Priorities');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch Animals for link/dropdown
  const fetchAnimals = async () => {
    try {
      const res = await getLivestock();
      if (res.success) {
        setAnimals(res.data);
      }
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  // Fetch Reminders
  const fetchReminderList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {};
      if (activeTab !== 'all') {
        params.tab = activeTab;
      }
      if (search.trim()) params.search = search.trim();
      if (selectedType !== 'All Types') params.type = selectedType;
      if (selectedPriority !== 'All Priorities') params.priority = selectedPriority;

      const res = await getReminders(params);
      if (res.success) {
        setReminders(res.data);
        if (res.counts) {
          setCounts(res.counts);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 503) {
        setError('Database service currently offline. Reminders integration pending.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load reminders');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search, selectedType, selectedPriority]);

  useEffect(() => {
    fetchReminderList();
  }, [fetchReminderList]);

  const handleCreateOrUpdate = async (formData: Partial<Reminder>) => {
    setIsSubmitting(true);
    try {
      if (editingReminder) {
        const res = await updateReminder(editingReminder._id, formData);
        if (res.success) {
          setReminders((prev) =>
            prev.map((r) => (r._id === editingReminder._id ? res.data : r))
          );
        }
      } else {
        const res = await createReminder(formData);
        if (res.success) {
          setReminders((prev) => [res.data, ...prev]);
        }
      }
      setIsModalOpen(false);
      setEditingReminder(null);
      fetchReminderList();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const res = await completeReminder(id);
      if (res.success) {
        setReminders((prev) =>
          prev.map((r) =>
            r._id === id
              ? { ...r, status: res.data.status }
              : r
          )
        );
        fetchReminderList();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating reminder status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteReminder(deleteId);
      if (res.success) {
        setReminders((prev) => prev.filter((r) => r._id !== deleteId));
        setDeleteId(null);
        fetchReminderList();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting reminder');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityBadge = (priority: ReminderPriority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-800 border border-red-200">
            {t('reminders.urgent', 'Urgent')}
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
            {t('reminders.high', 'High')}
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
            {t('reminders.medium', 'Medium')}
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            {t('reminders.low', 'Low')}
          </span>
        );
    }
  };

  const isDueOverdue = (dueDateStr: string, status: string) => {
    if (status === 'Completed') return false;
    const now = new Date();
    const d = new Date(dueDateStr);
    return d < now;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <BellRing className="w-6 h-6 text-amber-600" />
            <span>{t('reminders.title', 'Reminders & Farm Tasks')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('reminders.subtitle', 'Stay on top of upcoming vaccines, calving dates, vet checkups, and daily chores with automated alerts.')}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReminder(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('reminders.addReminder', 'Set Reminder')}</span>
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
            onClick={() => fetchReminderList()}
            className="text-amber-700 hover:text-amber-900 font-semibold text-xs flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> {t('common.retry', 'Retry')}
          </button>
        </div>
      )}

      {/* Tab Navigation with Counters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t('common.all', 'All Reminders')}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {formatNumber(counts.pending + counts.completed)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span>{t('reminders.overdue', 'Overdue')}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'overdue' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'
          }`}>
            {formatNumber(counts.overdue)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('today')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'today'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>{t('reminders.dueToday', 'Due Today')}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'today' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
          }`}>
            {formatNumber(counts.today)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          <span>{t('reminders.upcoming', 'Upcoming')}</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('reminders.completed', 'Completed')}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'completed' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {formatNumber(counts.completed)}
          </span>
        </button>
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
              placeholder={`${t('common.search', 'Search')} ${t('reminders.taskTitle', 'reminder title')}, ${t('common.description', 'instructions')}...`}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label={t('reminders.type', 'Reminder Type')}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="All Types">{t('common.all', 'All Types')}</option>
              {REMINDER_TYPES.filter(type => type !== 'All Types').map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              aria-label={t('reminders.priority', 'Priority Level')}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="All Priorities">{t('common.all', 'All Priorities')}</option>
              {PRIORITIES.filter(p => p !== 'All Priorities').map((p) => (
                <option key={p} value={p}>
                  {p === 'Low'
                    ? t('reminders.low', 'Low')
                    : p === 'Medium'
                    ? t('reminders.medium', 'Medium')
                    : p === 'High'
                    ? t('reminders.high', 'High')
                    : t('reminders.urgent', 'Urgent')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reminders List / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            {activeTab === 'all'
              ? t('common.all', 'All')
              : activeTab === 'overdue'
              ? t('reminders.overdue', 'Overdue')
              : activeTab === 'today'
              ? t('reminders.dueToday', 'Due Today')
              : activeTab === 'upcoming'
              ? t('reminders.upcoming', 'Upcoming')
              : t('reminders.completed', 'Completed')}{' '}
            {t('reminders.title', 'Reminders')} ({formatNumber(reminders.length)})
          </span>
          <button
            onClick={() => fetchReminderList()}
            title={t('common.refresh', 'Refresh')}
            aria-label={t('common.refresh', 'Refresh')}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <span>{t('common.loading', 'Loading reminders and chores...')}</span>
          </div>
        ) : reminders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BellRing className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">{t('reminders.noReminders', 'No reminders found.')}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t('reminders.subtitle', 'Automated reminders will appear here when vaccines, calving dates, or checkups are due soon.')}
            </p>
            <button
              onClick={() => {
                setEditingReminder(null);
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('reminders.addReminder', 'Schedule New Task')}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reminders.map((r) => {
              const animalObj = typeof r.relatedLivestockId === 'object' ? r.relatedLivestockId : null;
              const overdue = isDueOverdue(r.dueDate, r.status);
              const isCompleted = r.status === 'Completed';

              return (
                <div
                  key={r._id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                    isCompleted
                      ? 'bg-slate-50/60 opacity-75'
                      : overdue
                      ? 'bg-red-50/30 hover:bg-red-50/50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Left: Checkbox + Title + Metadata */}
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(r._id)}
                      title={isCompleted ? t('reminders.markPending', 'Mark as Pending') : t('reminders.markCompleted', 'Mark as Completed')}
                      aria-label={isCompleted ? t('reminders.markPending', 'Mark as Pending') : t('reminders.markCompleted', 'Mark as Completed')}
                      className={`mt-0.5 p-1 rounded-md transition-colors cursor-pointer ${
                        isCompleted
                          ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-50'
                          : 'text-slate-300 hover:text-emerald-600 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${isCompleted ? 'fill-emerald-100' : ''}`}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isCompleted
                              ? 'line-through text-slate-500'
                              : 'text-slate-900'
                          }`}
                        >
                          {r.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {r.type}
                        </span>
                        {getPriorityBadge(r.priority)}
                        {overdue && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                            {t('reminders.overdue', 'OVERDUE')}
                          </span>
                        )}
                      </div>

                      {r.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {r.description}
                        </p>
                      )}

                      {/* Animal reference tag */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                        {animalObj && (
                          <span className="inline-flex items-center text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {t('reminders.linkedAnimal', 'Linked')}: {animalObj.animalId} ({animalObj.name})
                          </span>
                        )}

                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {t('reminders.dueDate', 'Due')}:{' '}
                            {formatDate(r.dueDate)}
                          </span>
                        </span>

                        {r.dueTime && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{r.dueTime}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-center pl-8 sm:pl-0">
                    <button
                      onClick={() => {
                        setEditingReminder(r);
                        setIsModalOpen(true);
                      }}
                      title={t('common.edit', 'Edit Reminder')}
                      aria-label={t('common.edit', 'Edit Reminder')}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(r._id)}
                      title={t('common.delete', 'Delete Reminder')}
                      aria-label={t('common.delete', 'Delete Reminder')}
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isModalOpen}
        initialData={editingReminder}
        animals={animals}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReminder(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteId)}
        title={`${t('common.delete', 'Delete')} ${t('reminders.title', 'Reminder')}`}
        message={t('common.confirmDelete', 'Are you sure you want to remove this reminder? This task will be removed from your active schedule.')}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
