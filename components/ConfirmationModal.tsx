
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="bg-[#007b63] p-4 text-center">
          <h3 className="text-white font-bold uppercase tracking-widest text-xs">{title}</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600 text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-center gap-3 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg text-xs font-bold uppercase hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold uppercase shadow-md hover:bg-red-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
