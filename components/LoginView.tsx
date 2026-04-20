
import React, { useState } from 'react';
import { LOGO_SVG } from '../constants';
import { db } from '../database';
import { User, UserProfile } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onCancel: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onCancel }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Fixed asynchronous handling of database results
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = await db.getAll<User>('users');
    const user = users.find(u => u.login?.trim() === login.trim() && u.password === password);

    if (user) {
      if (user.active) {
        onLoginSuccess(user);
      } else {
        setError('Usuário inativo. Contate o administrador.');
      }
    } else {
      setError('Login ou senha incorretos.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col items-center p-8 animate-in fade-in zoom-in duration-300">
        <div className="w-32 mb-6">
          {LOGO_SVG}
        </div>
        
        <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter mb-2">Acesso ao Sistema</h2>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Identificação de Usuário</p>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Login</label>
            <input 
              type="text" 
              className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-gray-50 focus:bg-white transition-all"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Digite seu usuário..."
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Senha</label>
            <input 
              type="password" 
              className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-gray-50 focus:bg-white transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Digite sua senha..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-center">
              <p className="text-red-500 text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
             <button 
               type="button" 
               onClick={onCancel}
               className="flex-1 border border-gray-300 text-gray-500 py-3 rounded-xl font-bold uppercase text-xs hover:bg-gray-50 transition-all"
             >
               Cancelar
             </button>
             <button 
               type="submit" 
               className="flex-1 bg-[#007b63] text-white py-3 rounded-xl font-bold uppercase text-xs shadow-lg shadow-[#007b63]/20 hover:bg-[#00604d] hover:scale-105 transition-all"
             >
               Entrar
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
