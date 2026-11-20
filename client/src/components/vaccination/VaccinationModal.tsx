import React, { useState, useEffect } from 'react';
import { Vaccination, Livestock } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { X, Syringe, AlertCircle } from 'lucide-react';

interface VaccinationModalProps {
  isOpen: boolean;
  initialData?: Vaccination | null;
  animals: Livestock[];
  preselectedLivestockId?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<Vaccination>) => Promise<void>;
}

const COMMON_VACCINES = ['FMD (Foot & Mouth)', 'HS (Hemorrhagic Septicemia)', 'BQ (Black Quarter)', 'Brucellosis', 'Anthrax', 'PPR'];

export const VaccinationModal: React.FC<VaccinationModalProps> = ({
  isOpen,
  initialData,
  animals,
  preselectedLivestockId,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<Vaccination>>({
    livestockId: '',
    vaccine: '',
    vaccinationDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    dose: '2 ml Subcutaneous',
    veterinarian: '',
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
        vaccine: initialData.vaccine || '',
        vaccinationDate: initialData.vaccinationDate
          ? new Date(initialData.vaccinationDate).toISOString().split('T')[0]
          : '',
        nextDueDate: initialData.nextDueDate
          ? new Date(initialData.nextDueDate).toISOString().split('T')[0]
          : '',
        dose: initialData.dose || '',
        veterinarian: initialData.veterinarian || '',
        notes: initialData.notes || '',
      });
    } else {
      const today = new Date();
      const sixMonthsLater = new Date(today);
      sixMonthsLater.setMonth(today.getMonth() + 6);

      setFormData({
        livestockId: preselectedLivestockId || (animals.length > 0 ? animals[0]._id : ''),
        vaccine: 'FMD (Foot & Mouth)',
        vaccinationDate: today.toISOString().split('T')[0],
        nextDueDate: sixMonthsLater.toISOString().split('T')[0],
        dose: '2 ml Subcutaneous',
        veterinarian: '',
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

  const setDueDateOffset = (months: number) => {
    const base = formData.vaccinationDate ? new Date(formData.vaccinationDate) : new Date();
    const future = new Date(base);
    future.setMonth(base.getMonth() + months);
    setFormData((prev) => ({ ...prev, nextDueDate: future.toISOString().split('T')[0] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.livestockId ||
      !formData.vaccine?.trim() ||
      !formData.vaccinationDate ||
      !formData.nextDueDate ||
      !formData.dose?.trim() ||
      !formData.veterinarian?.trim()
    ) {
      setError(t('validation.required', 'Please fill in all mandatory vaccination fields'));
      return;
    }

    if (new Date(formData.nextDueDate) < new Date(formData.vaccinationDate)) {
      setError(t('validation.dateRange', 'Next due date must be on or after the vaccination date'));
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || t('errors.failedToSave', 'Error recording vaccination'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
              <Syringe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {initialData ? t('vaccination.editVaccination', 'Edit Vaccination') : t('vaccination.addVaccination', 'Schedule Vaccination')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('vaccination.subtitle', 'Status automatically computed as Completed, Due Soon, or Overdue')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            title={t('common.close', 'Close')}
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
          {/* Animal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('vaccination.animal', 'Select Animal')} *
            </label>
            <select
              name="livestockId"
              required
              value={formData.livestockId as string}
              onChange={handleChange}
              disabled={!!preselectedLivestockId && !initialData}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white font-medium disabled:bg-slate-100"
            >
              <option value="">{t('common.selectOption', '-- Choose Animal --')}</option>
              {animals.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.animalId} - {a.species})
                </option>
              ))}
            </select>
          </div>

          {/* Vaccine Name & Quick Suggestions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('vaccination.vaccine', 'Vaccine Name')} *
            </label>
            <input
              type="text"
              name="vaccine"
              required
              value={formData.vaccine}
              onChange={handleChange}
              placeholder={t('vaccination.vaccinePlaceholder', 'e.g. FMD (Foot & Mouth)')}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
            />
            <div className="mt-1.5 flex flex-wrap gap-1">
              {COMMON_VACCINES.map((vac) => (
                <button
                  type="button"
                  key={vac}
                  onClick={() => setFormData((prev) => ({ ...prev, vaccine: vac }))}
                  className="text-[10px] bg-slate-100 hover:bg-farm-50 hover:text-farm-800 text-slate-600 px-2 py-0.5 rounded transition-colors"
                >
                  {vac}
                </button>
              ))}
            </div>
          </div>

          {/* Vaccination Date & Next Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('vaccination.vaccinationDate', 'Vaccination Date')} *
              </label>
              <input
                type="date"
                name="vaccinationDate"
                required
                value={formData.vaccinationDate}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t('vaccination.nextDueDate', 'Next Due Date')} *
                </label>
                <div className="space-x-1">
                  <button
                    type="button"
                    onClick={() => setDueDateOffset(6)}
                    className="text-[10px] text-farm-700 hover:underline"
                  >
                    +6m
                  </button>
                  <span className="text-[10px] text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setDueDateOffset(12)}
                    className="text-[10px] text-farm-700 hover:underline"
                  >
                    +1y
                  </button>
                </div>
              </div>
              <input
                type="date"
                name="nextDueDate"
                required
                value={formData.nextDueDate}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              />
            </div>
          </div>

          {/* Dose & Veterinarian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('vaccination.dose', 'Dose & Administration')} *
              </label>
              <input
                type="text"
                name="dose"
                required
                value={formData.dose}
                onChange={handleChange}
                placeholder={t('vaccination.dosePlaceholder', 'e.g. 2 ml Subcutaneous')}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('vaccination.veterinarian', 'Administering Veterinarian')} *
              </label>
              <input
                type="text"
                name="veterinarian"
                required
                value={formData.veterinarian}
                onChange={handleChange}
                placeholder="e.g. Dr. Sunil Shinde"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('common.notes', 'Batch No. / Manufacturer / Notes')}
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder={t('common.notesPlaceholder', 'Record batch number, manufacturer, or booster instructions...')}
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
              {isSubmitting ? t('common.loading', 'Saving...') : initialData ? t('common.update', 'Update Vaccination') : t('vaccination.addVaccination', 'Schedule Vaccine')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
