
import React, { useState, useEffect } from 'react';
import { User, UserProfile } from '../types';
import { db } from '../database';
import { DROPDOWN_OPTIONS } from '../constants';

interface CreateProfileViewProps {
  onCancel: () => void;
  onSave?: () => void;
  userToEdit?: User; // Prop para edição
}

const ProfileInput = ({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder,
  required = false,
  mask,
  options,
  onAddOption
}: any) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (mask === 'cpf') {
      val = val.replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else if (mask === 'phone') {
      val = val.replace(/\D/g, '');
      if (val.length <= 10) {
        val = val.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else {
        val = val.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
      val = val.substring(0, 15);
    }
    onChange(val);
  };

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <div className="flex gap-2">
          <select
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-white transition-all shadow-sm flex-1"
            value={value}
            onChange={handleChange}
          >
            <option value="" disabled>{placeholder || "Selecione uma opção"}</option>
            {options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {onAddOption && (
            <button
              type="button"
              onClick={onAddOption}
              className="bg-[#007b63] text-white px-3 py-2 rounded-xl font-bold text-xl hover:bg-[#005a48] transition-colors shadow-sm flex items-center justify-center w-[46px]"
            >
              +
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <input 
            type={inputType} 
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-white transition-all shadow-sm w-full pr-10"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
          />
          {isPassword && (
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
          )}
        </div>
      )}
    </div>
  );
};

export const CreateProfileView: React.FC<CreateProfileViewProps> = ({ onCancel, onSave, userToEdit }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    active: true,
    profile: UserProfile.NURSE, // Default
    profiles: [UserProfile.NURSE], // Default multiple profiles
    ...userToEdit // Carrega dados se for edição
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    const loadCustomRoles = async () => {
      const roles = await db.getAll<{id: string, name: string}>('customRoles');
      setCustomRoles(roles.map(r => r.name));
    };
    loadCustomRoles();
  }, []);

  const handleAddCustomRole = async () => {
    if (newRole.trim()) {
      const roleName = newRole.trim();
      await db.upsert('customRoles', { id: roleName, name: roleName });
      setCustomRoles([...customRoles, roleName]);
      setFormData({ ...formData, jobTitle: roleName });
      setShowAddRoleModal(false);
      setNewRole('');
    }
  };

  const isEditing = !!userToEdit;

  // Fixed asynchronous handling of database results
  const handleRegister = async () => {
    setError(null);
    setSuccess(null);

    // Validação de Campos Obrigatórios
    if (!formData.name || !formData.login || !formData.cpf || !formData.contact || !formData.jobTitle) {
      setError("Todos os campos marcados com * são obrigatórios.");
      return;
    }
    
    if (!isEditing && !formData.password) {
      setError("A senha é obrigatória para novos usuários.");
      return;
    }

    if (formData.password && formData.password !== confirmPassword) {
      setError("A senha e a confirmação de senha não coincidem.");
      return;
    }
    
    if (!formData.profiles || formData.profiles.length === 0) {
      setError("Selecione pelo menos um perfil de acesso.");
      return;
    }

    // Validação de CPF único
    const users = await db.getAll<User>('users');
    // Verifica duplicidade excluindo o próprio ID (caso seja edição)
    const cpfExists = users.some(u => u.cpf === formData.cpf && u.id !== formData.id);
    if (cpfExists) {
      setError("Já existe um usuário cadastrado com este CPF.");
      return;
    }

    // Validação de Login único
    const loginExists = users.some(u => u.login?.trim() === formData.login?.trim() && u.id !== formData.id);
    if (loginExists) {
      setError("Este login já está em uso. Escolha outro.");
      return;
    }

    const userToSave: User = {
      ...formData as User,
      login: formData.login?.trim(),
      password: formData.password?.trim(),
      id: formData.id || Math.random().toString(36).substr(2, 9),
      profile: formData.profiles[0] // Set the first selected profile as the main one for backwards compatibility
    };

    await db.upsert('users', userToSave);
    setSuccess(isEditing ? "Usuário atualizado com sucesso!" : "Usuário cadastrado com sucesso!");
    
    // Reset form se for criação, manter se for edição (ou fechar via onSave)
    if (!isEditing) {
        setFormData({
          name: '',
          jobTitle: '',
          cpf: '',
          contact: '',
          login: '',
          password: '',
          profile: UserProfile.NURSE,
          profiles: [UserProfile.NURSE],
          active: true
        });
        setConfirmPassword('');
    }

    if(onSave) setTimeout(onSave, 1000);
  };

  const toggleProfileSelection = (profile: UserProfile) => {
    const currentProfiles = formData.profiles || [];
    if (currentProfiles.includes(profile)) {
      setFormData({ ...formData, profiles: currentProfiles.filter(p => p !== profile) });
    } else {
      setFormData({ ...formData, profiles: [...currentProfiles, profile] });
    }
  };

  const [allProfiles, setAllProfiles] = useState<string[]>(Object.values(UserProfile));

  useEffect(() => {
    const loadProfiles = async () => {
      const customProfiles = await db.getAll<{ id: string, name: string }>('userProfiles');
      const defaultProfiles = Object.values(UserProfile);
      const merged = [...defaultProfiles, ...customProfiles.map(p => p.name)];
      const unique = Array.from(new Set(merged));
      setAllProfiles(unique);
    };
    loadProfiles();
  }, []);

  const availableProfiles = allProfiles.filter(p => !(formData.profiles || []).includes(p));
  const selectedProfiles = formData.profiles || [];

  return (
    <div className="flex items-center justify-center p-6">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Lado Esquerdo - Decorativo / Info */}
        <div className="bg-[#007b63] p-8 md:w-1/4 flex flex-col justify-between text-white relative overflow-hidden">
           <div className="relative z-10">
             <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">
                {isEditing ? 'Editar' : 'Novo'}<br/>Acesso
             </h2>
             <p className="text-xs font-medium opacity-80 leading-relaxed">
               {isEditing 
                 ? 'Atualize as informações do colaborador e suas permissões de sistema.'
                 : 'Crie credenciais para novos membros da equipe. Certifique-se de atribuir o perfil de acesso correto para garantir a segurança dos dados.'
               }
             </p>
           </div>
           
           {/* Círculos decorativos */}
           <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
           <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="p-8 md:w-3/4 bg-white">
          <h3 className="text-[#007b63] font-black uppercase text-sm tracking-widest mb-6 border-b border-gray-100 pb-2">Dados do colaborador</h3>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
              <p>{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Linha 2 */}
            <div className="md:col-span-3">
              <ProfileInput 
                label="Nome Completo" 
                value={formData.name || ''} 
                onChange={(v: string) => setFormData({...formData, name: v})} 
                placeholder="Ex: João da Silva"
                required 
              />
            </div>
            
            <div className="md:col-span-2">
              <ProfileInput 
                label="Função (Cargo)" 
                value={formData.jobTitle || ''} 
                onChange={(v: string) => setFormData({...formData, jobTitle: v})} 
                placeholder="Selecione a função"
                options={[...DROPDOWN_OPTIONS.teamRoles, ...customRoles]}
                onAddOption={() => setShowAddRoleModal(true)}
                required 
              />
            </div>

            {/* Linha 3 */}
            <div className="md:col-span-2 md:col-start-1">
              <ProfileInput 
                label="CPF" 
                value={formData.cpf || ''} 
                onChange={(v: string) => setFormData({...formData, cpf: v})} 
                placeholder="000.000.000-00"
                mask="cpf"
                required 
              />
            </div>

            <div className="md:col-span-3">
              <ProfileInput 
                label="Contato (Celular)" 
                value={formData.contact || ''} 
                onChange={(v: string) => setFormData({...formData, contact: v})} 
                placeholder="(00) 00000-0000"
                mask="phone"
                required 
              />
            </div>
            
            {isEditing && (
               <div className="md:col-span-5 flex flex-col gap-1.5 w-full">
                 <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Status</label>
                 <div className="flex items-center gap-3 h-[46px]">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                       <input type="radio" checked={formData.active} onChange={() => setFormData({...formData, active: true})} className="accent-[#007b63]" /> Ativo
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                       <input type="radio" checked={!formData.active} onChange={() => setFormData({...formData, active: false})} className="accent-red-500" /> Inativo
                    </label>
                 </div>
               </div>
            )}
            
            {/* Linha 4 - Seleção de Perfis Estilo Emenda */}
            <div className="md:col-span-5 flex flex-col gap-3 w-full mt-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">
                Perfis de Acesso <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column: Available Profiles */}
                <div className="border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-48">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 font-bold text-xs text-gray-600 uppercase flex justify-between">
                    <span>Perfis Disponíveis</span>
                    <span className="text-[10px] bg-gray-200 px-1.5 rounded">{availableProfiles.length}</span>
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {availableProfiles.length === 0 && <p className="text-center text-xs text-gray-400 mt-6 italic">Todos os perfis selecionados.</p>}
                    {availableProfiles.map(profile => (
                      <label key={profile} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer group transition-colors">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded checked:bg-[#007b63] checked:border-[#007b63] transition-all"
                            checked={false}
                            onChange={() => toggleProfileSelection(profile)}
                          />
                          <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{profile}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Right Column: Selected Profiles */}
                <div className="border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-48">
                  <div className="bg-[#d1e7e4] px-4 py-2 border-b border-[#007b63]/20 font-bold text-xs text-[#007b63] uppercase flex justify-between">
                    <span>Perfis Selecionados</span>
                    <span className="text-[10px] bg-white px-1.5 rounded text-[#007b63]">{selectedProfiles.length}</span>
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {selectedProfiles.length === 0 && <p className="text-center text-xs text-gray-400 mt-6 italic">Nenhum perfil selecionado.</p>}
                    {selectedProfiles.map(profile => (
                      <label key={profile} className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-red-50 rounded cursor-pointer group transition-colors border border-transparent hover:border-red-100">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            className="peer appearance-none w-4 h-4 border-2 border-[#007b63] bg-[#007b63] rounded checked:bg-red-500 checked:border-red-500 transition-all"
                            checked={true}
                            onChange={() => toggleProfileSelection(profile)}
                          />
                          <svg className="absolute w-3 h-3 text-white peer-checked:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          <svg className="absolute w-3 h-3 text-white hidden peer-checked:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <span className="text-xs font-medium text-gray-700 group-hover:text-red-600">{profile}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Linha 5 */}
            <div className="md:col-span-5 mt-4">
              <h3 className="text-[#007b63] font-black uppercase text-sm tracking-widest mb-2 border-b border-gray-100 pb-2">Credenciais de Acesso</h3>
            </div>
            
            {/* Linha 6 */}
            <div className="md:col-span-2">
              <ProfileInput 
                label="Login de Usuário" 
                value={formData.login || ''} 
                onChange={(v: string) => setFormData({...formData, login: v})} 
                placeholder="usuario.sobrenome"
                required 
              />
            </div>
            
            <div className="md:col-span-1 md:col-start-3">
              <ProfileInput 
                label={isEditing ? "Nova Senha (Opcional)" : "Senha"}
                type="password"
                value={formData.password || ''} 
                onChange={(v: string) => setFormData({...formData, password: v})} 
                placeholder="••••••••"
                required={!isEditing}
              />
            </div>
            
            <div className="md:col-span-2">
              <ProfileInput 
                label={isEditing ? "Confirmar Nova Senha" : "Confirmar Senha"}
                type="password"
                value={confirmPassword} 
                onChange={(v: string) => setConfirmPassword(v)} 
                placeholder="••••••••"
                required={!isEditing || !!formData.password}
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4 justify-end">
            <button 
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-600 rounded-xl text-xs font-bold uppercase hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleRegister}
              className="px-8 py-3 bg-[#007b63] text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-[#007b63]/20 hover:bg-[#005a48] hover:scale-105 transition-all"
            >
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Usuário'}
            </button>
          </div>

        </div>
      </div>

      {/* MODAL ADICIONAR FUNÇÃO */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
            <div className="bg-[#007b63] p-4 text-center">
              <h3 className="text-white font-bold uppercase tracking-widest text-xs">Adicionar Função</h3>
            </div>
            <div className="p-6 text-center flex flex-col gap-4">
              <p className="text-gray-600 text-sm font-medium leading-relaxed">Digite o nome da nova função (cargo):</p>
              <input 
                type="text" 
                className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] w-full"
                placeholder="Ex: Farmacêutico Chefe"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                autoFocus
              />
            </div>
            <div className="p-4 bg-gray-50 flex justify-center gap-3 border-t border-gray-100">
              <button
                onClick={() => { setShowAddRoleModal(false); setNewRole(''); }}
                className="flex-1 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg text-xs font-bold uppercase hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCustomRole}
                className="flex-1 px-4 py-2 bg-[#007b63] text-white rounded-lg text-xs font-bold uppercase shadow-md hover:bg-[#005a48] transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
