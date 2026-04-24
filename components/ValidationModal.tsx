import React, { useEffect, useState } from 'react';

export const ValidationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleShow = (e: any) => {
      setMessage(e.detail);
      setIsOpen(true);
    };
    window.addEventListener('showValidationError', handleShow);
    return () => window.removeEventListener('showValidationError', handleShow);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md transform transition-all flex flex-col pt-8 pb-6 px-6 relative animate-[bounceIn_0.3s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 leading-tight">Aviso do Sistema</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <div className="mt-8 flex justify-center w-full">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full bg-[#007b63] text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm shadow-md hover:bg-[#005a48] hover:shadow-lg transition-all"
          >
            ENTENDI
          </button>
        </div>
      </div>
    </div>
  );
};

export const showValidation = (message: string) => {
  window.dispatchEvent(new CustomEvent('showValidationError', { detail: message }));
};
