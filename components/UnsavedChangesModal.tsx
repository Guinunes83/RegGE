import React, { useState, useEffect, useRef } from 'react';
import { useNavigationInterceptor } from '../contexts/NavigationContext';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({ isOpen, onSaveAndLeave, onDiscardAndLeave, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-orange-500 p-6 text-white shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-tighter">Alterações Não Salvas</h2>
          <button onClick={onCancel} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700 font-medium mb-6">Você tem alterações não salvas. O que deseja fazer?</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={onSaveAndLeave}
              className="bg-[#007b63] text-white px-6 py-3 rounded-xl font-bold uppercase text-xs shadow-md hover:bg-[#005a48] transition-colors w-full"
            >
              Salvar e Sair
            </button>
            <button 
              onClick={onDiscardAndLeave}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs shadow-md hover:bg-red-600 transition-colors w-full"
            >
              Sair sem Salvar
            </button>
            <button 
              onClick={onCancel}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold uppercase text-xs shadow-md hover:bg-gray-300 transition-colors w-full"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const useUnsavedChanges = (
  isEditing: boolean, 
  validateAndSave: () => Promise<boolean> | boolean
) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    resolve?: (value: boolean) => void;
  }>({ isOpen: false });

  const shouldInterceptRef = useRef(isEditing);

  useEffect(() => {
    shouldInterceptRef.current = isEditing;
  }, [isEditing]);

  const interceptor = React.useCallback(async (view: string, props: any) => {
    if (!shouldInterceptRef.current) return true;

    return new Promise<boolean>((resolve) => {
      setModalState({ isOpen: true, resolve });
    });
  }, []);

  useNavigationInterceptor(interceptor);

  const handleSaveAndLeave = async () => {
    shouldInterceptRef.current = false; // Bypass early in case save triggers navigation
    const success = await validateAndSave();
    if (success) {
      modalState.resolve?.(true);
      setModalState({ isOpen: false });
    } else {
      shouldInterceptRef.current = true; // Restore if failed
      modalState.resolve?.(false);
      setModalState({ isOpen: false });
    }
  };

  const handleDiscard = () => {
    shouldInterceptRef.current = false;
    modalState.resolve?.(true);
    setModalState({ isOpen: false });
  };

  const handleCancel = () => {
    modalState.resolve?.(false);
    setModalState({ isOpen: false });
  };

  const bypassInterceptor = () => {
    shouldInterceptRef.current = false;
  };

  return {
    isModalOpen: modalState.isOpen,
    handleSaveAndLeave,
    handleDiscard,
    handleCancel,
    bypassInterceptor
  };
};
