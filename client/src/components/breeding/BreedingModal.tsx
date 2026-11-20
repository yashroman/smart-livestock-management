import { useState, useEffect } from 'react';
import { BreedingRecord, Livestock } from '../../types';
import { X, GitBranch, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface BreedingModalProps {
  isOpen: boolean;
  initialData?: BreedingRecord | null;
  animals: Livestock[];
  preselectedLivestockId?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<BreedingRecord>) => Promise<void>;
}

export const BreedingModal: React.FC<BreedingModalProps> = ({
  isOpen,
  initialData,
  animals,
  preselectedLivestockId,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<BreedingRecord>>({
    livestockId: '',
    breedingDate: new Date().toISOString().split('T')[0],
    method: 'Artificial Insemination',
    partner: '',
    pregnancyStatus: 'Pending Check',
    confirmationDate: '',
    expectedDeliveryDate: '',
    actualDeliveryDate: '',
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
        breedingDate: initialData.breedingDate
          ? new Date(initialData.breedingDate).toISOString().split('T')[0]
          : '',
        method: initialData.method || 'Artificial Insemination',
        partner: initialData.partner || '',
        pregnancyStatus: initialData.pregnancyStatus || 'Pending Check',
        confirmationDate: initialData.confirmationDate
          ? new Date(initialData.confirmationDate).toISOString().split('T')[0]
          : '',
        expectedDeliveryDate: initialData.expectedDeliveryDate
          ? new Date(initialData.expectedDeliveryDate).toISOString().split('T')[0]
          : '',
        actualDeliveryDate: initialData.actualDeliveryDate
          ? new Date(initialData.actualDeliveryDate).toISOString().split('T')[0]
          : '',
        notes: initialData.notes || '',
      });
    } else {
      // Find female animals first
      const females = animals.filter((a) => a.gender === 'Female');
      const defaultAnimalId =
        preselectedLivestockId ||
        (females.length > 0 ? females[0]._id : animals.length > 0 ? animals[0]._id : '');

      setFormData({
        livestockId: defaultAnimalId,
        breedingDate: new Date().toISOString().split('T')[0],
        method: 'Artificial Insemination',
        partner: '',
        pregnancyStatus: 'Pending Check',
        confirmationDate: '',
        expectedDeliveryDate: '',
        actualDeliveryDate: '',
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.livestockId ||
      !formData.breedingDate ||
      !formData.method ||
      !formData.partner?.trim()
    ) {
      setError('Please fill in animal, breeding date, method, and partner / semen straw ID');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Error recording breeding event');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {initialData ? t('breeding.editRecord', 'Edit Breeding Record') : t('breeding.addRecord', 'Record Breeding / Insemination')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('breeding.subtitle', 'Track artificial insemination, gestation timeline, and delivery tracking')}
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
          {/* Female Animal & Breeding Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('breeding.animal', 'Select Dam (Female)')} *
              </label>
              <select
                name="livestockId"
                required
                value={formData.livestockId as string}
                onChange={handleChange}
                disabled={!!preselectedLivestockId && !initialData}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white font-medium disabled:bg-slate-100"
              >
                <option value="">-- {t('livestock.title', 'Choose Animal')} --</option>
                {animals.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.animalId} - {a.gender})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('breeding.breedingDate', 'Breeding Date')} *
              </label>
              <input
                type="date"
                name="breedingDate"
                required
                value={formData.breedingDate}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              />
            </div>
          </div>

          {/* Method & Partner / Sire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('breeding.breedingMethod', 'Breeding Method')} *
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              >
                <option value="Artificial Insemination">{t('breeding.artificialInsemination', 'Artificial Insemination (AI)')}</option>
                <option value="Natural Service">{t('breeding.naturalService', 'Natural Service')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('breeding.bullId', 'Sire / Bull / Semen Straw ID')} *
              </label>
              <input
                type="text"
                name="partner"
                required
                value={formData.partner}
                onChange={handleChange}
                placeholder="e.g. Gir Purebred Straw #504 / Bull Sultan"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
          </div>

          {/* Pregnancy Status & Confirmation Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('breeding.pregnancyStatus', 'Pregnancy Status')}
              </label>
              <select
                name="pregnancyStatus"
                value={formData.pregnancyStatus}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white font-medium"
              >
                <option value="Pending Check">{t('breeding.suspectedPregnant', 'Pending Check')}</option>
                <option value="Not Confirmed">{t('breeding.suspectedPregnant', 'Not Confirmed')}</option>
                <option value="Confirmed Pregnant">{t('breeding.confirmedPregnant', 'Confirmed Pregnant')}</option>
                <option value="Pregnant">{t('livestock.pregnant', 'Pregnant')}</option>
                <option value="Delivered">{t('breeding.calved', 'Delivered / Calved')}</option>
                <option value="Not Pregnant">{t('breeding.notPregnant', 'Not Pregnant (Failed/Repeat)')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('breeding.gestationDays', 'PD Confirmation Date')}
              </label>
              <input
                type="date"
                name="confirmationDate"
                value={formData.confirmationDate}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              />
            </div>
          </div>

          {/* Delivery Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('breeding.expectedDelivery', 'Expected Calving / Delivery Date')}
              </label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              />
              <span className="text-[10px] text-slate-400">Leave blank to auto-calculate by species</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('breeding.actualDelivery', 'Actual Delivery Date (if calved)')}
              </label>
              <input
                type="date"
                name="actualDeliveryDate"
                value={formData.actualDeliveryDate}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('common.notes', 'Breeding & Calving Notes')}
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Record AI technician name, calf gender, ease of calving..."
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
              {isSubmitting ? t('common.loading', 'Saving...') : initialData ? t('common.save', 'Update Record') : t('breeding.addRecord', 'Save Breeding Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
