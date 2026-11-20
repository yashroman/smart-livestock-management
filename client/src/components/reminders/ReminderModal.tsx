import React, { useState, useEffect } from 'react';
import { Reminder, Livestock, ReminderPriority, ReminderStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { X, Bell, AlertCircle } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  initialData?: Reminder | null;
  animals: Livestock[];
  preselectedLivestockId?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<Reminder>) => Promise<void>;
}

const REMINDER_TYPES = [
  'Vaccination',
  'Health Check',
  'Breeding',
  'Pregnancy',
  'Feeding',
  'Milk Recording',
  'Veterinary Visit',
  'Other',
];

const PRIORITIES: ReminderPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES: ReminderStatus[] = ['Pending', 'Completed', 'Cancelled'];

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  initialData,
  animals,
  preselectedLivestockId,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<{
    title: string;
    type: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: ReminderPriority;
    status: ReminderStatus;
    relatedLivestockId: string;
    notes: string;
  }>({
    title: '',
    type: 'Vaccination',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    priority: 'Medium',
    status: 'Pending',
    relatedLivestockId: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      const animalIdStr =
        typeof initialData.relatedLivestockId === 'object' && initialData.relatedLivestockId !== null
          ? (initialData.relatedLivestockId as any)._id
          : initialData.relatedLivestockId;

      setFormData({
        title: initialData.title || '',
        type: initialData.type || 'Vaccination',
        description: initialData.description || '',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        dueTime: initialData.dueTime || '09:00',
        priority: initialData.priority || 'Medium',
        status: initialData.status || 'Pending',
        relatedLivestockId: animalIdStr || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        title: '',
        type: 'Vaccination',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:00',
        priority: 'Medium',
        status: 'Pending',
        relatedLivestockId: preselectedLivestockId || '',
        notes: '',
      });
    }
    setError(null);
  }, [initialData, preselectedLivestockId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Please provide a reminder title.');
      return;
    }

    if (!formData.dueDate) {
      setError('Please provide a due date.');
      return;
    }

    try {
      const payload: Partial<Reminder> = {
        title: formData.title.trim(),
        type: formData.type.trim(),
        description: formData.description.trim() || undefined,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        relatedLivestockId: formData.relatedLivestockId || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await onSubmit(payload);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save reminder');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? t('reminders.editReminder', 'Edit Reminder / Task') : t('reminders.addReminder', 'Schedule Farm Reminder')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('reminders.subtitle', 'Set timely alerts for vaccines, vet visits, breeding checks, or farm chores')}
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('reminders.taskTitle', 'Reminder Title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('reminders.taskTitlePlaceholder', 'e.g. FMD Booster Vaccine for Cow COW-001, Check Calving Pen')}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('reminders.type', 'Reminder Type')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                {REMINDER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('reminders.priority', 'Priority Level')}
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as ReminderPriority })
                }
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p === 'Low'
                      ? t('reminders.low', 'Low')
                      : p === 'Medium'
                      ? t('reminders.medium', 'Medium')
                      : p === 'High'
                      ? t('reminders.high', 'High')
                      : t('reminders.urgent', 'Urgent')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Due Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('reminders.dueDate', 'Due Date')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('reminders.dueTime', 'Due Time (Optional)')}
              </label>
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Related Animal & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('reminders.linkedAnimal', 'Linked Animal (Optional)')}
              </label>
              <select
                value={formData.relatedLivestockId}
                onChange={(e) => setFormData({ ...formData, relatedLivestockId: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- {t('common.all', 'General Farm Task (No Animal)')} --</option>
                {animals.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.animalId} - {a.name} ({a.species})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('livestock.status', 'Status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ReminderStatus })
                }
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'Pending'
                      ? t('reminders.markPending', 'Pending')
                      : s === 'Completed'
                      ? t('reminders.completed', 'Completed')
                      : t('common.cancel', 'Cancelled')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('common.description', 'Description / Instructions')}
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Contact Dr. Sharma for morning herd visit"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('common.notes', 'Notes')}</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any follow-up observations or reminders..."
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
              <span>{isSubmitting ? t('common.saving', 'Saving...') : initialData ? t('reminders.editReminder', 'Update Reminder') : t('reminders.addReminder', 'Set Reminder')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
