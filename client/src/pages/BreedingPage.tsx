import React, { useState, useEffect, useCallback } from 'react';
import { BreedingRecord, Livestock, PregnancyStatus } from '../types';
import {
  getBreedingRecordsApi,
  createBreedingRecordApi,
  updateBreedingRecordApi,
  deleteBreedingRecordApi,
} from '../api/breeding.api';
import { getLivestockListApi } from '../api/livestock.api';
import { BreedingModal } from '../components/breeding/BreedingModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import {
  GitBranch,
  Plus,
  Filter,
  RefreshCw,
  AlertCircle,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  Baby,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const BreedingPage: React.FC = () => {
  const { t, formatDate, formatNumber } = useLanguage();
  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [animals, setAnimals] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState({
    total: 0,
    pregnantCount: 0,
    upcomingDeliveriesCount: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [animalFilter, setAnimalFilter] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<BreedingRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getLivestockListApi()
      .then((res) => {
        if (res.success) setAnimals(res.data);
      })
      .catch(() => null);
  }, []);

  const fetchBreeding = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBreedingRecordsApi({
        pregnancyStatus: statusFilter !== 'all' ? statusFilter : undefined,
        livestockId: animalFilter !== 'all' ? animalFilter : undefined,
      });
      if (res.success) {
        setRecords(res.data);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('errors.generic', 'Error loading breeding records'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, animalFilter, t]);

  useEffect(() => {
    fetchBreeding();
  }, [fetchBreeding]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: BreedingRecord) => {
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: Partial<BreedingRecord>) => {
    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await updateBreedingRecordApi(editingRecord._id, formData);
      } else {
        await createBreedingRecordApi(formData);
      }
      setIsModalOpen(false);
      setEditingRecord(null);
      await fetchBreeding();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await deleteBreedingRecordApi(deletingRecord._id);
      setDeletingRecord(null);
      await fetchBreeding();
    } catch (err: any) {
      alert(err.response?.data?.message || t('errors.generic', 'Error deleting breeding record'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: PregnancyStatus) => {
    switch (status) {
      case 'Confirmed Pregnant':
      case 'Pregnant':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Not Pregnant':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Pending Check':
      case 'Not Confirmed':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getStatusLabel = (status: PregnancyStatus) => {
    switch (status) {
      case 'Confirmed Pregnant':
        return t('breeding.confirmedPregnant', 'Confirmed Pregnant');
      case 'Pregnant':
        return t('livestock.pregnant', 'Pregnant');
      case 'Delivered':
        return t('breeding.calved', 'Delivered');
      case 'Not Pregnant':
        return t('breeding.notPregnant', 'Not Pregnant');
      case 'Pending Check':
      case 'Not Confirmed':
      default:
        return t('breeding.suspectedPregnant', 'Pending Check');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t('breeding.title', 'Breeding & Pregnancy Management')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('breeding.subtitle', 'Insemination logs, gestation timelines, expected calving dates, and reproductive cycles')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchBreeding}
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
            <span>{t('breeding.addRecord', 'Record Breeding (AI)')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">{t('breeding.title', 'Total Breedings')}</span>
            <div className="p-2 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{formatNumber(summary.total)}</span>
            <span className="text-xs text-slate-500 ml-1">{t('breeding.breedingMethod', 'inseminations')}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">{t('common.all', 'Lifetime recorded AI events')}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-purple-800 font-medium">{t('livestock.pregnant', 'Pregnant Dams')}</span>
            <div className="p-2 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
              <Baby className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-purple-800">{formatNumber(summary.pregnantCount)}</span>
            <span className="text-xs text-purple-600 ml-1">{t('breeding.confirmedPregnant', 'dams confirmed')}</span>
          </div>
          <span className="text-[10px] text-purple-600 mt-1 block">{t('breeding.gestationDays', 'Active gestation monitoring')}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-amber-800 font-medium">{t('breeding.calvingApproaching', 'Deliveries Due Soon')}</span>
            <div className="p-2 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-700">
              {formatNumber(summary.upcomingDeliveriesCount)}
            </span>
            <span className="text-xs text-amber-600 ml-1">{t('vaccination.dueWithinDays', 'within 30 days')}</span>
          </div>
          <span className="text-[10px] text-amber-600 mt-1 block">{t('breeding.expectedDelivery', 'Prepare calving pen & fodder')}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label={t('breeding.pregnancyStatus', 'Filter by Pregnancy Status')}
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white font-medium"
            >
              <option value="all">{t('common.all', 'All Pregnancy Statuses')}</option>
              <option value="Confirmed Pregnant">{t('breeding.confirmedPregnant', 'Confirmed Pregnant')}</option>
              <option value="Pending Check">{t('breeding.suspectedPregnant', 'Pending Check')}</option>
              <option value="Delivered">{t('breeding.calved', 'Delivered')}</option>
              <option value="Not Pregnant">{t('breeding.notPregnant', 'Not Pregnant (Failed/Repeat)')}</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={animalFilter}
              onChange={(e) => setAnimalFilter(e.target.value)}
              aria-label={t('breeding.animal', 'Filter by Female Animal')}
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white font-medium"
            >
              <option value="all">{t('common.all', 'All Dams (Female Animals)')}</option>
              {animals
                .filter((a) => a.gender === 'Female')
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.animalId} - {a.breed})
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

      {/* Breeding Records Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-farm-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">{t('common.loading', 'Loading breeding & pregnancy logs...')}</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <GitBranch className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t('breeding.noBreedingRecords', 'No Breeding Records Found')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {statusFilter !== 'all' || animalFilter !== 'all'
              ? t('common.noData', 'No breeding records match the specified filters.')
              : t('breeding.noBreedingRecords', 'No artificial insemination or natural services have been recorded yet.')}
          </p>
          <button onClick={handleOpenAdd} className="farm-btn-primary text-xs cursor-pointer">
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{t('breeding.addRecord', 'Record First Breeding Event')}</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('breeding.breedingDate', 'Breeding Date')}</th>
                  <th className="py-3 px-4">{t('breeding.animal', 'Dam (Female)')}</th>
                  <th className="py-3 px-4">{t('breeding.breedingMethod', 'Method')}</th>
                  <th className="py-3 px-4">{t('breeding.bullId', 'Sire / Bull Straw')}</th>
                  <th className="py-3 px-4">{t('breeding.pregnancyStatus', 'Status')}</th>
                  <th className="py-3 px-4">{t('breeding.expectedDelivery', 'Expected Delivery')}</th>
                  <th className="py-3 px-4">{t('breeding.actualDelivery', 'Actual Delivery')}</th>
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
                        {formatDate(r.breedingDate)}
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
                          <span className="text-slate-400">{t('common.unknown', 'Unknown Dam')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{r.method}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {r.partner}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`farm-badge border text-[11px] ${getStatusBadge(r.pregnancyStatus)}`}>
                          {getStatusLabel(r.pregnancyStatus)}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-900">
                        {r.expectedDeliveryDate ? (
                          <span>{formatDate(r.expectedDeliveryDate)}</span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.actualDeliveryDate ? (
                          <span className="text-emerald-700 font-semibold">
                            {formatDate(r.actualDeliveryDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400">{t('common.pending', 'Pending')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1 text-slate-500 hover:text-farm-700 hover:bg-farm-50 rounded"
                            title={t('common.edit', 'Edit Breeding Record')}
                            aria-label={t('common.edit', 'Edit Breeding Record')}
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

      {/* Modal */}
      <BreedingModal
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
        title={`${t('common.delete', 'Delete')} ${t('breeding.title', 'Breeding Record')}`}
        message={t('common.confirmDelete', 'Are you sure you want to delete this breeding event? If pregnancy was confirmed, make sure to update animal status if necessary.')}
        itemName={deletingRecord ? `${formatDate(deletingRecord.breedingDate)} (${deletingRecord.partner})` : undefined}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingRecord(null)}
      />
    </div>
  );
};
