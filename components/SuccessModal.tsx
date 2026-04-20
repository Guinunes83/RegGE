
import React from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 border border-[#007b63]/20">
        <div className="bg-[#007b63] p-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-lg">
             <svg className="w-8 h-8 text-[#007b63]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-white font-black uppercase tracking-widest text-sm">{title}</h3>
        </div>
        <div className="p-8 text-center bg-white">
          <p className="text-gray-600 text-sm font-bold leading-relaxed">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-center border-t border-gray-100">
          <button
            onClick={onConfirm}
            className="w-full px-6 py-3 bg-[#007b63] text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-[#007b63]/20 hover:bg-[#005a48] transition-all transform hover:scale-[1.02]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
