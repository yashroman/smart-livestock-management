import React, { useState, useEffect } from 'react';
import { FeedRecord, Livestock } from '../../types';
import { X, Utensils, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface FeedRecordModalProps {
  isOpen: boolean;
  initialData?: FeedRecord | null;
  animals: Livestock[];
  preselectedLivestockId?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<FeedRecord>) => Promise<void>;
}

const FEED_TYPES = [
  'Green Fodder',
  'Dry Fodder',
  'Hay',
  'Silage',
  'Concentrate',
  'Mineral Mixture',
  'Other',
];

const FEED_UNITS = ['kg', 'litre', 'gram', 'bag', 'other'];

export const FeedRecordModal: React.FC<FeedRecordModalProps> = ({
  isOpen,
  initialData,
  animals,
  preselectedLivestockId,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [allocationMode, setAllocationMode] = useState<'individual' | 'group'>('individual');
  const [formData, setFormData] = useState<{
    livestockId: string;
    group: string;
    feedType: string;
    quantity: number;
    unit: string;
    date: string;
    cost: number;
    notes: string;
  }>({
    livestockId: '',
    group: '',
    feedType: 'Green Fodder',
    quantity: 10,
    unit: 'kg',
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      const animalIdStr =
        typeof initialData.livestockId === 'object' && initialData.livestockId !== null
          ? (initialData.livestockId as any)._id
          : initialData.livestockId;

      const isGroup = !animalIdStr && Boolean(initialData.group);
      setAllocationMode(isGroup ? 'group' : 'individual');

      setFormData({
        livestockId: animalIdStr || '',
        group: initialData.group || '',
        feedType: initialData.feedType || 'Green Fodder',
        quantity: initialData.quantity || 0,
        unit: initialData.unit || 'kg',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        cost: initialData.cost || 0,
        notes: initialData.notes || '',
      });
    } else {
      setAllocationMode(preselectedLivestockId ? 'individual' : 'individual');
      setFormData({
        livestockId: preselectedLivestockId || (animals.length > 0 ? animals[0]._id : ''),
        group: '',
        feedType: 'Green Fodder',
        quantity: 10,
        unit: 'kg',
        date: new Date().toISOString().split('T')[0],
        cost: 0,
        notes: '',
      });
    }
    setError(null);
  }, [initialData, animals, preselectedLivestockId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (allocationMode === 'individual' && !formData.livestockId) {
      setError('Please select an animal for individual feeding.');
      return;
    }

    if (allocationMode === 'group' && !formData.group.trim()) {
      setError('Please enter a group name (e.g. Milking Herd, Calves, All).');
      return;
    }

    if (!formData.feedType.trim()) {
      setError('Please select or specify a feed type.');
      return;
    }

    if (formData.quantity < 0 || isNaN(formData.quantity)) {
      setError('Feed quantity must be 0 or greater.');
      return;
    }

    if (!formData.unit.trim()) {
      setError('Please select a measurement unit.');
      return;
    }

    if (!formData.date) {
      setError('Please provide a valid feeding date.');
      return;
    }

    if (formData.cost < 0 || isNaN(formData.cost)) {
      setError('Feed cost cannot be negative.');
      return;
    }

    try {
      const payload: Partial<FeedRecord> = {
        feedType: formData.feedType.trim(),
        quantity: Number(formData.quantity),
        unit: formData.unit.trim(),
        date: formData.date,
        cost: Number(formData.cost),
        notes: formData.notes.trim() || undefined,
        group: allocationMode === 'group' ? formData.group.trim() : undefined,
        livestockId: allocationMode === 'individual' ? formData.livestockId : undefined,
      };

      await onSubmit(payload);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save feed record');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? t('feed.editRecord', 'Edit Feed Record') : t('feed.addRecord', 'Record Feed Allocation')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('feed.subtitle', 'Log daily ration, fodder type, quantity and optional cost')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.cancel', 'Close')}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Allocation Toggle: Animal vs Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('feed.target', 'Feed Destination')}
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setAllocationMode('individual')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  allocationMode === 'individual'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('feed.singleAnimal', 'Individual Animal')}
              </button>
              <button
                type="button"
                onClick={() => setAllocationMode('group')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  allocationMode === 'group'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('feed.herdGroup', 'Herd / Group')}
              </button>
            </div>
          </div>

          {/* Individual Animal Selector */}
          {allocationMode === 'individual' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.title', 'Select Animal')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.livestockId}
                onChange={(e) => setFormData({ ...formData, livestockId: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">-- {t('livestock.title', 'Choose Animal')} --</option>
                {animals.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.animalId} - {a.name} ({a.species})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Group Input */}
          {allocationMode === 'group' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('feed.herdGroup', 'Group Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                placeholder="e.g. Milking Herd, Calves Pen, Whole Herd"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
              </input>
            </div>
          )}

          {/* Feed Type & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('feed.feedType', 'Feed Type')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.feedType}
                onChange={(e) => setFormData({ ...formData, feedType: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                {FEED_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.date', 'Date')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('feed.quantity', 'Quantity')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('feed.unit', 'Unit')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                {FEED_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('feed.cost', 'Estimated Feed Cost (₹)')}
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={formData.cost}
              onChange={(e) =>
                setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
              }
              placeholder="0"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Note: Feed cost is for ration budgeting. It is kept separate from Finance Expenses.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('common.notes', 'Notes / Diet Remarks')}</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Mixed with 50g mineral powder, extra ration due to peak lactation..."
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              <span>{isSubmitting ? t('common.loading', 'Saving...') : initialData ? t('common.save', 'Update Record') : t('feed.addRecord', 'Save Record')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
