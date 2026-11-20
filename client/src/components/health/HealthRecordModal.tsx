import React, { useState, useEffect } from 'react';
import { HealthRecord, Livestock } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { X, HeartPulse, AlertCircle } from 'lucide-react';

interface HealthRecordModalProps {
  isOpen: boolean;
  initialData?: HealthRecord | null;
  animals: Livestock[];
  preselectedLivestockId?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<HealthRecord>) => Promise<void>;
}

export const HealthRecordModal: React.FC<HealthRecordModalProps> = ({
  isOpen,
  initialData,
  animals,
  preselectedLivestockId,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<HealthRecord>>({
    livestockId: '',
    date: new Date().toISOString().split('T')[0],
    symptoms: '',
    healthCondition: '',
    temperature: undefined,
    treatment: '',
    medicine: '',
    dosage: '',
    veterinarian: '',
    followUpDate: '',
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
        symptoms: initialData.symptoms || '',
        healthCondition: initialData.healthCondition || '',
        temperature: initialData.temperature,
        treatment: initialData.treatment || '',
        medicine: initialData.medicine || '',
        dosage: initialData.dosage || '',
        veterinarian: initialData.veterinarian || '',
        followUpDate: initialData.followUpDate
          ? new Date(initialData.followUpDate).toISOString().split('T')[0]
          : '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        livestockId: preselectedLivestockId || (animals.length > 0 ? animals[0]._id : ''),
        date: new Date().toISOString().split('T')[0],
        symptoms: '',
        healthCondition: '',
        temperature: 101.5,
        treatment: '',
        medicine: '',
        dosage: '',
        veterinarian: '',
        followUpDate: '',
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
      [name]: name === 'temperature' ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.livestockId ||
      !formData.symptoms?.trim() ||
      !formData.healthCondition?.trim() ||
      !formData.treatment?.trim() ||
      !formData.medicine?.trim() ||
      !formData.dosage?.trim() ||
      !formData.veterinarian?.trim()
    ) {
      setError(t('validation.required', 'Please fill in all required health checkup fields'));
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || t('errors.failedToSave', 'Error saving health record'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-red-50 text-red-700 rounded-lg border border-red-100">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {initialData ? t('health.editRecord', 'Edit Health Record') : t('health.addRecord', 'Record Health & Treatment')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('health.subtitle', 'Log clinical observations, diagnoses, and veterinary treatments')}
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
          {/* Animal & Checkup Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('health.animal', 'Select Animal')} *
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.date', 'Treatment Date')} *
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

          {/* Condition & Symptoms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('health.symptoms', 'Observed Symptoms')} *
              </label>
              <input
                type="text"
                name="symptoms"
                required
                value={formData.symptoms}
                onChange={handleChange}
                placeholder={t('health.symptomsPlaceholder', 'e.g. High fever, loss of appetite, coughing')}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('health.condition', 'Diagnosis / Condition')} *
              </label>
              <input
                type="text"
                name="healthCondition"
                required
                value={formData.healthCondition}
                onChange={handleChange}
                placeholder={t('health.conditionPlaceholder', 'e.g. Mastitis, Bloat, Bovine Respiratory')}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
          </div>

          {/* Temperature & Treatment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('health.temperature', 'Temperature (°F)')}
              </label>
              <input
                type="number"
                name="temperature"
                step="0.1"
                min="80"
                max="120"
                value={formData.temperature ?? ''}
                onChange={handleChange}
                placeholder="e.g. 101.5"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('health.treatment', 'Treatment Administered')} *
              </label>
              <input
                type="text"
                name="treatment"
                required
                value={formData.treatment}
                onChange={handleChange}
                placeholder={t('health.treatmentPlaceholder', 'e.g. Antibiotic course & hydration fluid')}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
          </div>

          {/* Medicine & Dosage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('health.medicine', 'Prescribed Medicine')} *
              </label>
              <input
                type="text"
                name="medicine"
                required
                value={formData.medicine}
                onChange={handleChange}
                placeholder={t('health.medicinePlaceholder', 'e.g. Enrofloxacin / Meloxicam')}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('health.dosage', 'Dosage & Frequency')} *
              </label>
              <input
                type="text"
                name="dosage"
                required
                value={formData.dosage}
                onChange={handleChange}
                placeholder={t('health.dosagePlaceholder', 'e.g. 15ml intramuscular daily for 3 days')}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
              />
            </div>
          </div>

          {/* Veterinarian & Follow-up Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('health.veterinarian', 'Attending Veterinarian')} *
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('health.followUpDate', 'Follow-up Date')}
              </label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('common.notes', 'Follow-up & Recovery Notes')}
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder={t('common.notesPlaceholder', 'Record recovery observations, dietary changes, or isolation status...')}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-farm-600 focus:border-farm-600 outline-none"
            />
          </div>

          {/* Buttons */}
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
              {isSubmitting ? t('common.loading', 'Saving Record...') : initialData ? t('common.update', 'Update Record') : t('common.save', 'Save Health Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
