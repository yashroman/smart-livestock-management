import React, { useState, useEffect, useCallback } from 'react';
import { HealthRecord, Livestock } from '../types';
import {
  getHealthRecordsApi,
  createHealthRecordApi,
  updateHealthRecordApi,
  deleteHealthRecordApi,
} from '../api/health.api';
import { getLivestockListApi } from '../api/livestock.api';
import { useLanguage } from '../context/LanguageContext';
import { HealthRecordModal } from '../components/health/HealthRecordModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import {
  HeartPulse,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Edit2,
  Trash2,
  Calendar,
  UserCheck,
} from 'lucide-react';

export const HealthPage: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [animals, setAnimals] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [animalFilter, setAnimalFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<HealthRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load animals dropdown
  useEffect(() => {
    getLivestockListApi()
      .then((res) => {
        if (res.success) setAnimals(res.data);
      })
      .catch(() => null);
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHealthRecordsApi({
        search: search.trim() || undefined,
        livestockId: animalFilter !== 'all' ? animalFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success) {
        setRecords(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('errors.somethingWentWrong', 'Error fetching health records'));
    } finally {
      setLoading(false);
    }
  }, [search, animalFilter, startDate, endDate, t]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: HealthRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: Partial<HealthRecord>) => {
    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await updateHealthRecordApi(editingRecord._id, formData);
      } else {
        await createHealthRecordApi(formData);
      }
      setIsModalOpen(false);
      setEditingRecord(null);
      await fetchRecords();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await deleteHealthRecordApi(deletingRecord._id);
      setDeletingRecord(null);
      await fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.message || t('errors.failedToDelete', 'Error deleting health record'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-50 text-red-700 rounded-lg border border-red-100">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t('health.title', 'Health & Treatment Records')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('health.subtitle', 'Track clinical symptoms, diagnoses, medical treatments, and veterinary follow-ups')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="farm-btn-secondary text-xs cursor-pointer"
            title={t('common.refresh', 'Refresh')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="farm-btn-primary text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>{t('health.addRecord', 'Log Health Record')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('common.search', 'Search symptoms, illness, vet...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
            />
          </div>

          {/* Animal Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={animalFilter}
              onChange={(e) => setAnimalFilter(e.target.value)}
              aria-label="Filter by Animal"
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
            >
              <option value="all">{t('common.all', 'All Animals')}</option>
              {animals.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.animalId})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title={t('reports.dateFrom', 'Start Date')}
              aria-label={t('reports.dateFrom', 'Start Date')}
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
            />
          </div>

          {/* Date Range End */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title={t('reports.dateTo', 'End Date')}
              aria-label={t('reports.dateTo', 'End Date')}
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
            />
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

      {/* Health Records Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-farm-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">{t('common.loading', 'Loading health logs...')}</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t('health.noHealthRecords', 'No Health Records Found')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {search || animalFilter !== 'all' || startDate || endDate
              ? t('health.noHealthRecords', 'No health entries match your current search/filter.')
              : t('health.noHealthRecords', 'All herd animals are currently healthy with no treatment logs.')}
          </p>
          <button onClick={handleOpenAdd} className="farm-btn-primary text-xs cursor-pointer">
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{t('health.addRecord', 'Log First Health Record')}</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('common.date', 'Date')}</th>
                  <th className="py-3 px-4">{t('livestock.animalName', 'Animal')}</th>
                  <th className="py-3 px-4">{t('health.condition', 'Condition / Illness')}</th>
                  <th className="py-3 px-4">{t('health.symptoms', 'Symptoms')}</th>
                  <th className="py-3 px-4">{t('health.medicine', 'Medicine & Dosage')}</th>
                  <th className="py-3 px-4">{t('health.veterinarian', 'Veterinarian')}</th>
                  <th className="py-3 px-4">{t('health.followUpDate', 'Follow-up')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => {
                  const animal = typeof r.livestockId === 'object' && r.livestockId !== null
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
                          <span className="text-slate-400">Unknown Animal</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {r.healthCondition}
                        {r.temperature && (
                          <span className="block text-[11px] text-slate-500 font-normal">
                            Temp: {r.temperature}°F
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={r.symptoms}>
                        {r.symptoms}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{r.medicine}</span>
                        <span className="block text-[11px] text-slate-500">{r.dosage}</span>
                        <span className="text-[10px] text-slate-400">{r.treatment}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.veterinarian}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.followUpDate ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-medium">
                            {formatDate(r.followUpDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1 text-slate-500 hover:text-farm-700 hover:bg-farm-50 rounded"
                            title={t('common.edit', 'Edit Record')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingRecord(r)}
                            className="p-1 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title={t('common.delete', 'Delete Record')}
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

      {/* Add / Edit Health Modal */}
      <HealthRecordModal
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingRecord}
        title={t('common.delete', 'Delete Health Record')}
        message={t('common.confirmDelete', 'Are you sure you want to permanently delete this health and clinical record?')}
        itemName={deletingRecord ? `${deletingRecord.healthCondition} (${formatDate(deletingRecord.date)})` : undefined}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingRecord(null)}
      />
    </div>
  );
};
