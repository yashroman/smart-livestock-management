import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Livestock, LivestockStatus } from '../types';
import {
  getLivestockListApi,
  createLivestockApi,
  updateLivestockApi,
  deleteLivestockApi,
} from '../api/livestock.api';
import { AnimalModal } from '../components/livestock/AnimalModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import {
  Layers,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Tag,
  Calendar,
  Scale,
} from 'lucide-react';

export const LivestockListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, formatNumber } = useLanguage();

  const [animals, setAnimals] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAnimal, setEditingAnimal] = useState<Livestock | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [deletingAnimal, setDeletingAnimal] = useState<Livestock | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchLivestock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLivestockListApi({
        search: search.trim() || undefined,
        species: speciesFilter !== 'all' ? speciesFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy,
        sortOrder,
      });
      if (res.success) {
        setAnimals(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }, [search, speciesFilter, statusFilter, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchLivestock();
  }, [fetchLivestock]);

  const handleOpenAdd = () => {
    setEditingAnimal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (animal: Livestock, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAnimal(animal);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (animal: Livestock, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingAnimal(animal);
  };

  const handleModalSubmit = async (formData: Partial<Livestock>) => {
    setIsSubmitting(true);
    try {
      if (editingAnimal) {
        await updateLivestockApi(editingAnimal._id, formData);
      } else {
        await createLivestockApi(formData);
      }
      setIsModalOpen(false);
      setEditingAnimal(null);
      await fetchLivestock();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAnimal) return;
    setIsDeleting(true);
    try {
      await deleteLivestockApi(deletingAnimal._id);
      setDeletingAnimal(null);
      await fetchLivestock();
    } catch (err: any) {
      alert(err.response?.data?.message || t('errors.failedToDelete'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: LivestockStatus) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Needs Attention':
      case 'Sick':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Pregnant':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Lactating':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Quarantined':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Sold':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-farm-50 text-farm-700 rounded-lg border border-farm-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {t('livestock.title')}
              </h1>
              <p className="text-xs text-slate-500">
                {t('livestock.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchLivestock}
            disabled={loading}
            className="farm-btn-secondary text-xs cursor-pointer"
            title={t('common.refresh')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="farm-btn-primary text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>{t('livestock.addAnimal')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('livestock.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
            />
          </div>

          {/* Species Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              aria-label={t('livestock.filterBySpecies')}
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white cursor-pointer"
            >
              <option value="all">{t('common.all')}</option>
              <option value="Cow">{t('livestock.cattle')}</option>
              <option value="Buffalo">{t('livestock.buffalo')}</option>
              <option value="Goat">{t('livestock.goat')}</option>
              <option value="Sheep">{t('livestock.sheep')}</option>
              <option value="Other">{t('livestock.other')}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label={t('livestock.filterByStatus')}
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white cursor-pointer"
            >
              <option value="all">{t('common.all')}</option>
              <option value="Healthy">{t('livestock.healthy')}</option>
              <option value="Needs Attention">{t('livestock.needsAttention')}</option>
              <option value="Sick">{t('livestock.sick')}</option>
              <option value="Quarantined">{t('livestock.quarantined')}</option>
              <option value="Pregnant">{t('livestock.pregnant')}</option>
              <option value="Sold">{t('livestock.sold')}</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-1.5">
            <ArrowUpDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
              }}
              aria-label={t('common.sort')}
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white cursor-pointer"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="animalId-asc">Tag ID (Asc)</option>
              <option value="weight-desc">Weight (High-Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{t('errors.somethingWentWrong')}</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Livestock Cards / Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-farm-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">{t('common.loading')}</p>
        </div>
      ) : animals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-farm-50 text-farm-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t('livestock.noLivestockFound')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {t('livestock.noLivestockFound')}
          </p>
          <button
            onClick={handleOpenAdd}
            className="farm-btn-primary text-xs cursor-pointer inline-flex items-center"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{t('livestock.addAnimal')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {animals.map((animal) => (
            <div
              key={animal._id}
              onClick={() => navigate(`/livestock/${animal._id}`)}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-farm-300 transition-all p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Header: Tag, Name & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {animal.animalId}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        • {animal.species}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1 group-hover:text-farm-800 transition-colors">
                      {animal.name}
                    </h3>
                  </div>
                  <span
                    className={`farm-badge border text-[11px] ${getStatusBadge(
                      animal.status
                    )}`}
                  >
                    {animal.status}
                  </span>
                </div>

                {/* Characteristics Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('livestock.breed')}: <strong className="text-slate-800">{animal.breed}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400 text-xs">⚥</span>
                    <span>{t('livestock.gender')}: <strong className="text-slate-800">{animal.gender}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('livestock.age')}: <strong className="text-slate-800">{animal.calculatedAge?.text || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('livestock.weight')}: <strong className="text-slate-800">{formatNumber(animal.weight)} kg</strong></span>
                  </div>
                </div>

                {animal.notes && (
                  <p className="text-xs text-slate-500 line-clamp-2 italic mb-3">
                    &ldquo;{animal.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1 text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  {animal.source}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleOpenEdit(animal, e)}
                    className="p-1.5 text-slate-500 hover:text-farm-700 hover:bg-farm-50 rounded-md transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(animal, e)}
                    className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="inline-flex items-center space-x-1 text-farm-800 font-semibold px-2 py-1 rounded hover:bg-farm-50 transition-colors ml-1"
                  >
                    <span>{t('common.view')}</span>
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimalModal
        isOpen={isModalOpen}
        initialData={editingAnimal}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAnimal(null);
        }}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingAnimal}
        title={t('livestock.title')}
        message={t('common.confirmDelete')}
        itemName={deletingAnimal ? `${deletingAnimal.name} (${deletingAnimal.animalId})` : undefined}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingAnimal(null)}
      />
    </div>
  );
};
