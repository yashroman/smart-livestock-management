import React, { useState, useEffect, useCallback } from 'react';
import { Vaccination, Livestock, VaccinationStatus } from '../types';
import {
  getVaccinationsApi,
  createVaccinationApi,
  updateVaccinationApi,
  deleteVaccinationApi,
} from '../api/vaccination.api';
import { getLivestockListApi } from '../api/livestock.api';
import { VaccinationModal } from '../components/vaccination/VaccinationModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import {
  Syringe,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const VaccinationPage: React.FC = () => {
  const { t, formatDate, formatNumber } = useLanguage();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [animals, setAnimals] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    dueSoon: 0,
    overdue: 0,
  });

  // Filters
  const [statusTab, setStatusTab] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [animalFilter, setAnimalFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVac, setEditingVac] = useState<Vaccination | null>(null);
  const [deletingVac, setDeletingVac] = useState<Vaccination | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getLivestockListApi()
      .then((res) => {
        if (res.success) setAnimals(res.data);
      })
      .catch(() => null);
  }, []);

  const fetchVaccinations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getVaccinationsApi({
        status: statusTab !== 'all' ? statusTab : undefined,
        livestockId: animalFilter !== 'all' ? animalFilter : undefined,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success) {
        setVaccinations(res.data);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('errors.generic', 'Error loading vaccinations'));
    } finally {
      setLoading(false);
    }
  }, [statusTab, animalFilter, search, startDate, endDate, t]);

  useEffect(() => {
    fetchVaccinations();
  }, [fetchVaccinations]);

  const handleOpenAdd = () => {
    setEditingVac(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vaccination) => {
    setEditingVac(v);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: Partial<Vaccination>) => {
    setIsSubmitting(true);
    try {
      if (editingVac) {
        await updateVaccinationApi(editingVac._id, formData);
      } else {
        await createVaccinationApi(formData);
      }
      setIsModalOpen(false);
      setEditingVac(null);
      await fetchVaccinations();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingVac) return;
    setIsDeleting(true);
    try {
      await deleteVaccinationApi(deletingVac._id);
      setDeletingVac(null);
      await fetchVaccinations();
    } catch (err: any) {
      alert(err.response?.data?.message || t('errors.generic', 'Error deleting vaccination record'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: VaccinationStatus) => {
    switch (status) {
      case 'Overdue':
        return (
          <span className="farm-badge bg-red-50 text-red-700 border border-red-200 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span>{t('vaccination.overdue', 'Overdue')}</span>
          </span>
        );
      case 'Due Soon':
        return (
          <span className="farm-badge bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{t('vaccination.dueSoon', 'Due Soon')}</span>
          </span>
        );
      case 'Completed':
      default:
        return (
          <span className="farm-badge bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{t('vaccination.completed', 'Completed')}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
            <Syringe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t('vaccination.title', 'Vaccination Management')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('vaccination.subtitle', 'Automated booster scheduling, disease immunization records, and overdue tracking')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchVaccinations}
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
            <span>{t('vaccination.addVaccination', 'Schedule Vaccination')}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div
          onClick={() => setStatusTab('all')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusTab === 'all'
              ? 'bg-farm-50 border-farm-300 ring-2 ring-farm-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-slate-500 font-medium block mb-1">{t('common.all', 'Total')}</span>
          <span className="text-2xl font-bold text-slate-900">{formatNumber(summary.total)}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{t('common.all', 'All scheduled records')}</span>
        </div>

        <div
          onClick={() => setStatusTab('Completed')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusTab === 'Completed'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-emerald-700 font-medium block mb-1">{t('vaccination.completed', 'Completed')}</span>
          <span className="text-2xl font-bold text-emerald-800">{formatNumber(summary.completed)}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">{t('livestock.healthy', 'Active immunity')}</span>
        </div>

        <div
          onClick={() => setStatusTab('Due Soon')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusTab === 'Due Soon'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-amber-800 font-medium block mb-1">{t('vaccination.dueSoon', 'Due Soon')}</span>
          <span className="text-2xl font-bold text-amber-700">{formatNumber(summary.dueSoon)}</span>
          <span className="text-[10px] text-amber-600 block mt-0.5">{t('vaccination.dueWithinDays', 'Due within 7 days')}</span>
        </div>

        <div
          onClick={() => setStatusTab('Overdue')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusTab === 'Overdue'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-red-700 font-medium block mb-1">{t('vaccination.overdue', 'Overdue')}</span>
          <span className="text-2xl font-bold text-red-700">{formatNumber(summary.overdue)}</span>
          <span className="text-[10px] text-red-600 block mt-0.5">{t('livestock.needsAttention', 'Immediate attention needed')}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={`${t('common.search', 'Search')} ${t('vaccination.vaccine', 'vaccine')}, ${t('health.veterinarian', 'veterinarian')}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={animalFilter}
              onChange={(e) => setAnimalFilter(e.target.value)}
              aria-label={t('vaccination.animal', 'Filter by Animal')}
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

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title={t('common.startDate', 'Start Date')}
              aria-label={t('common.startDate', 'Start Date')}
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title={t('common.endDate', 'End Date')}
              aria-label={t('common.endDate', 'End Date')}
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

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-farm-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">{t('common.loading', 'Loading vaccination schedules...')}</p>
        </div>
      ) : vaccinations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Syringe className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t('vaccination.noVaccinations', 'No Vaccinations Found')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {statusTab !== 'all' || search || animalFilter !== 'all'
              ? t('common.noData', 'No records match your active tab or filter.')
              : t('vaccination.noVaccinations', 'No vaccinations have been scheduled yet.')}
          </p>
          <button onClick={handleOpenAdd} className="farm-btn-primary text-xs cursor-pointer">
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{t('vaccination.addVaccination', 'Schedule First Vaccine')}</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('vaccination.vaccine', 'Vaccine')}</th>
                  <th className="py-3 px-4">{t('livestock.title', 'Animal')}</th>
                  <th className="py-3 px-4">{t('vaccination.vaccinationDate', 'Administered Date')}</th>
                  <th className="py-3 px-4">{t('vaccination.nextDueDate', 'Next Due Date')}</th>
                  <th className="py-3 px-4">{t('vaccination.status', 'Status')}</th>
                  <th className="py-3 px-4">{t('vaccination.dose', 'Dose & Route')}</th>
                  <th className="py-3 px-4">{t('vaccination.veterinarian', 'Veterinarian')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vaccinations.map((v) => {
                  const animal = typeof v.livestockId === 'object' && v.livestockId !== null
                    ? (v.livestockId as any)
                    : null;

                  return (
                    <tr key={v._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {v.vaccine}
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
                          <span className="text-slate-400">{t('common.unknown', 'Unknown')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {formatDate(v.vaccinationDate)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-900">
                        {formatDate(v.nextDueDate)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(v.status)}
                      </td>
                      <td className="py-3 px-4">{v.dose}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{v.veterinarian}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1 text-slate-500 hover:text-farm-700 hover:bg-farm-50 rounded"
                            title={t('common.edit', 'Edit Vaccination')}
                            aria-label={t('common.edit', 'Edit Vaccination')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingVac(v)}
                            className="p-1 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title={t('common.delete', 'Delete Vaccination')}
                            aria-label={t('common.delete', 'Delete Vaccination')}
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
      <VaccinationModal
        isOpen={isModalOpen}
        initialData={editingVac}
        animals={animals}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVac(null);
        }}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deletingVac}
        title={`${t('common.delete', 'Delete')} ${t('vaccination.title', 'Vaccination Schedule')}`}
        message={t('common.confirmDelete', 'Are you sure you want to delete this vaccination record?')}
        itemName={deletingVac ? `${deletingVac.vaccine} (${t('vaccination.nextDueDate', 'Due')}: ${formatDate(deletingVac.nextDueDate)})` : undefined}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingVac(null)}
      />
    </div>
  );
};
