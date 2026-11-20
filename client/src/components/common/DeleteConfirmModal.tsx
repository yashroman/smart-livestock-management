import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-full bg-red-50 text-red-600 flex-shrink-0 border border-red-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {message}
            </p>
            {itemName && (
              <div className="mt-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md">
                {itemName}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="farm-btn-secondary text-xs cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>{isDeleting ? t('common.loading') : t('common.delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
