
import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../database';

interface ChangePasswordModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ currentUser, onClose, onSuccess }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    setError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    if (oldPassword !== currentUser.password) {
      setError("A senha antiga está incorreta.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A nova senha e a confirmação não coincidem.");
      return;
    }

    if (newPassword === oldPassword) {
      setError("A nova senha não pode ser igual à senha antiga.");
      return;
    }

    const updatedUser = { ...currentUser, password: newPassword };
    db.upsert('users', updatedUser);
    
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="bg-[#007b63] p-4 text-center text-white relative">
          <h2 className="text-xl font-bold uppercase tracking-widest">Alterar Senha</h2>
          <p className="text-xs opacity-80 mt-1">Atualize suas credenciais de acesso</p>
          <button onClick={onClose} className="absolute right-4 top-4 text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-bold shadow-sm text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Login</label>
            <input 
              type="text" 
              className="border border-gray-300 bg-gray-100 text-gray-600 rounded-xl px-4 py-3 text-sm outline-none w-full cursor-not-allowed"
              value={currentUser.login}
              disabled
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Senha Atual</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-white transition-all shadow-sm w-full pr-10"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Nova Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-white transition-all shadow-sm w-full pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Confirmar Nova Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-white transition-all shadow-sm w-full pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between gap-3 border-t border-gray-200">
          <button 
            onClick={handleSave}
            className="flex-1 py-3 bg-[#007b63] text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-[#007b63]/20 hover:bg-[#005a48] transition-all"
          >
            OK
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-xl text-xs font-bold uppercase hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
