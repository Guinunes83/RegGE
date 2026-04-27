
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
  
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryLogin, setRecoveryLogin] = useState('');
  const [recoveryCpf, setRecoveryCpf] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

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

  const formatCpf = (value: string) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoveryMessage('');

    if (!recoveryLogin || !recoveryCpf) {
      setRecoveryError('Preencha o login e o CPF.');
      return;
    }

    const users = await db.getAll<User>('users');
    const user = users.find(u => 
      u.login?.trim().toLowerCase() === recoveryLogin.trim().toLowerCase() && 
      u.cpf?.replace(/\D/g, '') === recoveryCpf.replace(/\D/g, '')
    );

    if (user) {
      setRecoveryMessage(`Sua senha é: ${user.password}`);
    } else {
      setRecoveryError('Usuário ou CPF não encontrados.');
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
          
          <div className="flex justify-end">
            <button 
              type="button" 
              onClick={() => {
                 setRecoveryLogin(login);
                 setRecoveryCpf('');
                 setRecoveryMessage('');
                 setRecoveryError('');
                 setShowForgotModal(true);
              }}
              className="text-[#007b63] text-xs font-bold hover:underline"
            >
              Esqueci minha senha!
            </button>
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

      {showForgotModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-[#007b63] uppercase tracking-tighter mb-4">Recuperar Senha</h3>
            <p className="text-xs text-gray-500 mb-6">Confirme o seu usuário e o CPF vinculado ao cadastro para visualizar sua senha.</p>
            
            <form onSubmit={handleRecovery} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Usuário</label>
                <input 
                  type="text" 
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63] transition-all"
                  value={recoveryLogin}
                  onChange={e => setRecoveryLogin(e.target.value)}
                  placeholder="Seu usuário"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">CPF</label>
                <input 
                  type="text" 
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63] transition-all"
                  value={recoveryCpf}
                  onChange={e => setRecoveryCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              {recoveryError && (
                <div className="bg-red-50 p-2 rounded text-center">
                  <p className="text-red-500 text-xs font-bold">{recoveryError}</p>
                </div>
              )}

              {recoveryMessage && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                  <p className="text-green-700 text-sm font-bold break-all">{recoveryMessage}</p>
                </div>
              )}

              <div className="mt-4 flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-gray-500 font-bold uppercase text-xs hover:bg-gray-100 rounded-lg"
                >
                  Fechar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-[#007b63] text-white rounded-lg font-bold uppercase text-xs hover:bg-[#00604d] shadow-md transition-all"
                >
                  Verificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
