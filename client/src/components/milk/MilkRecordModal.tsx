import React, { useState, useEffect } from 'react';
import { MilkRecord, Livestock } from '../../types';
import { X, Milk, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface MilkRecordModalProps {
  isOpen: boolean;
  initialData?: MilkRecord | null;
  animals: Livestock[];
  preselectedLivestockId?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<MilkRecord>) => Promise<void>;
}

export const MilkRecordModal: React.FC<MilkRecordModalProps> = ({
  isOpen,
  initialData,
  animals,
  preselectedLivestockId,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { t, formatNumber } = useLanguage();
  const [formData, setFormData] = useState<{
    livestockId: string;
    date: string;
    morningQuantity: number;
    eveningQuantity: number;
    notes: string;
  }>({
    livestockId: '',
    date: new Date().toISOString().split('T')[0],
    morningQuantity: 6.5,
    eveningQuantity: 5.5,
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      const animalIdStr =
        typeof initialData.livestockId === 'object' && initialData.livestockId !== null
          ? (initialData.livestockId as any)._id
          : initialData.livestockId;

      setFormData({
        livestockId: animalIdStr || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        morningQuantity: initialData.morningQuantity || 0,
        eveningQuantity: initialData.eveningQuantity || 0,
        notes: initialData.notes || '',
      });
    } else {
      // Find female / lactating animals first
      const milkingFemales = animals.filter(
        (a) => a.gender === 'Female' && (a.status === 'Lactating' || a.status === 'Healthy')
      );
      const defaultAnimalId =
        preselectedLivestockId ||
        (milkingFemales.length > 0 ? milkingFemales[0]._id : animals.length > 0 ? animals[0]._id : '');

      setFormData({
        livestockId: defaultAnimalId,
        date: new Date().toISOString().split('T')[0],
        morningQuantity: 6.0,
        eveningQuantity: 5.0,
        notes: '',
      });
    }
    setError(null);
  }, [initialData, isOpen, preselectedLivestockId, animals]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'morningQuantity' || name === 'eveningQuantity' ? Number(value) : value,
    }));
  };

  const calculatedTotal = Number(
    ((formData.morningQuantity || 0) + (formData.eveningQuantity || 0)).toFixed(2)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.livestockId || !formData.date) {
      setError('Please select an animal and date');
      return;
    }

    if (formData.morningQuantity < 0 || formData.eveningQuantity < 0) {
      setError('Milk quantities cannot be negative');
      return;
    }

    if (calculatedTotal <= 0) {
      setError('Total milk production must be greater than 0');
      return;
    }

    try {
      await onSubmit({
        livestockId: formData.livestockId,
        date: formData.date,
        morningQuantity: formData.morningQuantity,
        eveningQuantity: formData.eveningQuantity,
        totalQuantity: calculatedTotal,
        notes: formData.notes,
      });
    } catch (err: any) {
      setError(err.message || 'Error recording milk production');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Milk className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {initialData ? t('milk.editMilk', 'Edit Milk Production') : t('milk.recordMilk', 'Record Milk Yield')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('milk.subtitle', 'Morning and evening quantities with automated daily total calculation')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
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
          {/* Milking Animal & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('milk.animal', 'Milking Animal')} *
              </label>
              <select
                name="livestockId"
                required
                value={formData.livestockId}
                onChange={handleChange}
                disabled={!!preselectedLivestockId && !initialData}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white font-medium disabled:bg-slate-100"
              >
                <option value="">-- {t('livestock.title', 'Choose Animal')} --</option>
                {animals.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.animalId} - {a.species})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.date', 'Milking Date')} *
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              />
            </div>
          </div>

          {/* Morning & Evening Yields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('milk.morningQuantity', 'Morning Milk (Liters)')}
              </label>
              <input
                type="number"
                name="morningQuantity"
                step="0.1"
                min="0"
                value={formData.morningQuantity}
                onChange={handleChange}
                placeholder="0.0"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('milk.eveningQuantity', 'Evening Milk (Liters)')}
              </label>
              <input
                type="number"
                name="eveningQuantity"
                step="0.1"
                min="0"
                value={formData.eveningQuantity}
                onChange={handleChange}
                placeholder="0.0"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
          </div>

          {/* Auto-calculated Total Highlight Box */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900">
              {t('milk.totalQuantity', 'Computed Daily Total')}:
            </span>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-700">{formatNumber(calculatedTotal)}</span>
              <span className="text-xs text-blue-600 ml-1">L</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('common.notes', 'Fat % / Quality / Milking Notes')}
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Record fat test % (e.g. 4.2% Fat / 8.5 SNF), animal behavior, mastitis test..."
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
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="farm-btn-primary text-xs cursor-pointer"
            >
              {isSubmitting ? t('common.loading', 'Saving...') : initialData ? t('common.save', 'Update Milk Record') : t('milk.recordMilk', 'Record Yield')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
