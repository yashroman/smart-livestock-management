import React, { useState, useEffect } from 'react';
import { Livestock } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { X, Layers, AlertCircle } from 'lucide-react';

interface AnimalModalProps {
  isOpen: boolean;
  initialData?: Livestock | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<Livestock>) => Promise<void>;
}

export const AnimalModal: React.FC<AnimalModalProps> = ({
  isOpen,
  initialData,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState<Partial<Livestock>>({
    animalId: '',
    name: '',
    species: 'Cow',
    breed: '',
    gender: 'Female',
    dateOfBirth: '',
    weight: 350,
    color: '',
    purchaseDate: '',
    purchasePrice: 0,
    source: 'Born on Farm',
    status: 'Healthy',
    photo: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        animalId: initialData.animalId || '',
        name: initialData.name || '',
        species: initialData.species || 'Cow',
        breed: initialData.breed || '',
        gender: initialData.gender || 'Female',
        dateOfBirth: initialData.dateOfBirth
          ? new Date(initialData.dateOfBirth).toISOString().split('T')[0]
          : '',
        weight: initialData.weight || 0,
        color: initialData.color || '',
        purchaseDate: initialData.purchaseDate
          ? new Date(initialData.purchaseDate).toISOString().split('T')[0]
          : '',
        purchasePrice: initialData.purchasePrice || 0,
        source: initialData.source || 'Born on Farm',
        status: initialData.status || 'Healthy',
        photo: initialData.photo || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        animalId: '',
        name: '',
        species: 'Cow',
        breed: '',
        gender: 'Female',
        dateOfBirth: new Date().toISOString().split('T')[0],
        weight: 300,
        color: '',
        purchaseDate: '',
        purchasePrice: 0,
        source: 'Born on Farm',
        status: 'Healthy',
        photo: '',
        notes: '',
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'weight' || name === 'purchasePrice' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.animalId?.trim() ||
      !formData.name?.trim() ||
      !formData.breed?.trim() ||
      !formData.color?.trim() ||
      !formData.dateOfBirth
    ) {
      setError(t('validation.required'));
      return;
    }

    if ((formData.weight ?? 0) < 0) {
      setError(t('validation.positiveNumber'));
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || t('errors.failedToSave'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-farm-50 text-farm-700 rounded-lg border border-farm-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {initialData ? `${t('livestock.editAnimal')}: ${initialData.name}` : t('livestock.addAnimal')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('livestock.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identity: Tag ID & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.animalId')} *
              </label>
              <input
                type="text"
                name="animalId"
                required
                value={formData.animalId}
                onChange={handleChange}
                placeholder="e.g. COW-101"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.animalName')} *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ganga / Rani"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
          </div>

          {/* Species, Breed, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.species')} *
              </label>
              <select
                name="species"
                value={formData.species}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white cursor-pointer"
              >
                <option value="Cow">{t('livestock.cattle')}</option>
                <option value="Buffalo">{t('livestock.buffalo')}</option>
                <option value="Goat">{t('livestock.goat')}</option>
                <option value="Sheep">{t('livestock.sheep')}</option>
                <option value="Other">{t('livestock.other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.breed')} *
              </label>
              <input
                type="text"
                name="breed"
                required
                value={formData.breed}
                onChange={handleChange}
                placeholder="e.g. Gir / Murrah"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.gender')} *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white cursor-pointer"
              >
                <option value="Female">{t('common.female')}</option>
                <option value="Male">{t('common.male')}</option>
              </select>
            </div>
          </div>

          {/* Date of Birth & Calculated Weight & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.dateOfBirth')} *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.weight')} *
              </label>
              <input
                type="number"
                name="weight"
                required
                min="0"
                step="0.5"
                value={formData.weight}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.color')} *
              </label>
              <input
                type="text"
                name="color"
                required
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g. Reddish Brown"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
          </div>

          {/* Health Status & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.status')} *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white font-medium cursor-pointer"
              >
                <option value="Healthy">{t('livestock.healthy')}</option>
                <option value="Needs Attention">{t('livestock.needsAttention')}</option>
                <option value="Sick">{t('livestock.sick')}</option>
                <option value="Quarantined">{t('livestock.quarantined')}</option>
                <option value="Pregnant">{t('livestock.pregnant')}</option>
                <option value="Sold">{t('livestock.sold')}</option>
                <option value="Other">{t('livestock.other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.source')}
              </label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="e.g. Born on Farm / Cattle Fair"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
          </div>

          {/* Purchase Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.purchaseDate')}
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.purchasePrice')}
              </label>
              <input
                type="number"
                name="purchasePrice"
                min="0"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="0"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
          </div>

          {/* Photo URL & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('livestock.photo')}
            </label>
            <input
              type="url"
              name="photo"
              value={formData.photo}
              onChange={handleChange}
              placeholder="https://example.com/animal-photo.jpg"
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('common.notes')}
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder={t('common.notesPlaceholder')}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="farm-btn-secondary text-xs cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="farm-btn-primary text-xs cursor-pointer"
            >
              {isSubmitting ? t('common.loading') : initialData ? t('common.update') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
