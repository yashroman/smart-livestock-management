import React, { useState, useEffect } from 'react';
import { FinanceRecord, TransactionType } from '../../types';
import { X, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface TransactionModalProps {
  isOpen: boolean;
  type: TransactionType;
  initialData?: FinanceRecord | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<FinanceRecord>) => Promise<void>;
}

const INCOME_CATEGORIES = [
  'Milk Sales',
  'Livestock Sale',
  'Manure Sale',
  'Breeding Service',
  'Government Subsidy',
  'Other',
];

const EXPENSE_CATEGORIES = [
  'Feed',
  'Veterinary',
  'Medicine',
  'Vaccination',
  'Labour',
  'Equipment',
  'Electricity',
  'Transport',
  'Maintenance',
  'Other',
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  type,
  initialData,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const isIncome = type === 'income';
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const [formData, setFormData] = useState<{
    date: string;
    category: string;
    amount: number;
    description: string;
    paymentMethod: string;
    reference: string;
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    category: categories[0],
    amount: 0,
    description: '',
    paymentMethod: 'Cash',
    reference: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        category: initialData.category || categories[0],
        amount: initialData.amount || 0,
        description: initialData.description || '',
        paymentMethod: initialData.paymentMethod || 'Cash',
        reference: initialData.reference || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: categories[0],
        amount: 0,
        description: '',
        paymentMethod: 'Cash',
        reference: '',
        notes: '',
      });
    }
    setError(null);
  }, [initialData, type, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.category.trim()) {
      setError('Please select a category.');
      return;
    }

    if (formData.amount <= 0 || isNaN(formData.amount)) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a short description or party details.');
      return;
    }

    if (!formData.date) {
      setError('Please select a valid date.');
      return;
    }

    try {
      const payload: Partial<FinanceRecord> = {
        type,
        date: formData.date,
        category: formData.category.trim(),
        amount: Number(formData.amount),
        description: formData.description.trim(),
        paymentMethod: formData.paymentMethod.trim() || 'Cash',
        reference: formData.reference.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await onSubmit(payload);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-lg ${
                isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData
                  ? (isIncome ? t('income.title', 'Edit Income Entry') : t('expenses.title', 'Edit Expense Entry'))
                  : (isIncome ? t('income.addIncome', 'Record New Income') : t('expenses.addExpense', 'Record New Expense'))}
              </h3>
              <p className="text-xs text-slate-500">
                {isIncome
                  ? t('income.subtitle', 'Track farm revenue from milk, livestock, or manure sales')
                  : t('expenses.subtitle', 'Track farm expenditures on feed, vet care, labour, or maintenance')}
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
          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('finance.category', 'Category')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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

          {/* Amount & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('finance.amount', 'Amount (₹)')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('finance.paymentMethod', 'Payment Method')}
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('finance.reference', 'Description / Particulars')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={
                isIncome
                  ? 'e.g. 50 Litres morning milk sold to dairy, cow sale to Ramesh'
                  : 'e.g. Purchased 5 bags concentrate feed from cooperative, vet consultation fee'
              }
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Reference # */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('finance.reference', 'Bill / Invoice / UPI Reference (Optional)')}
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="e.g. REC-2026-081, UPI: 82910283719"
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
              placeholder="Any additional remarks..."
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
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center space-x-1.5 ${
                isIncome
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <span>{isSubmitting ? t('common.loading', 'Saving...') : initialData ? t('common.save', 'Update Entry') : t('common.save', 'Save Entry')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
