
import React, { useState } from 'react';
import { MonitorEntry, MonitorLogin, Study } from '../types';
import { DROPDOWN_OPTIONS } from '../constants';
import { ConfirmationModal } from './ConfirmationModal';
import { UnsavedChangesModal, useUnsavedChanges } from './UnsavedChangesModal';

interface MonitorFormProps {
  monitor?: MonitorEntry;
  studies: Study[];
  mode: 'edit' | 'view';
  onSave: (data: Partial<MonitorEntry>) => void;
  onCancel: () => void;
  onEdit?: () => void;
  isReadOnly?: boolean;
}

const SectionTitle = ({ title }: { title: string }) => (
  <div className="bg-[#d1e7e4] text-[#007b63] font-bold text-center py-1.5 uppercase tracking-widest text-xs mb-4 border-b border-[#007b63]/20">
    {title}
  </div>
);

const MonitorInput = ({ 
  label, 
  value, 
  onChange,
  isView,
  type = "text", 
  options,
  placeholder,
  error,
  displayValue // For ID lookups like Study
}: any) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">
      {label}
    </label>
    {options && !isView ? (
      <select 
        className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Selecione...</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <div>
        <input 
          type={isView ? "text" : type}
          readOnly={isView}
          placeholder={isView ? '' : placeholder}
          className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none transition-all ${isView ? 'bg-gray-100' : 'bg-white'}`}
          value={isView && displayValue ? displayValue : (value || '')}
          onChange={(e) => onChange(e.target.value)}
        />
        {error && !isView && <span className="text-red-500 text-[10px] ml-1">{error}</span>}
      </div>
    )}
  </div>
);

export const MonitorForm: React.FC<MonitorFormProps> = ({ monitor, studies, mode, onSave, onCancel, onEdit, isReadOnly = false }) => {
  const [formData, setFormData] = React.useState<Partial<MonitorEntry>>(monitor || {
    logins: []
  });

  const [newLogin, setNewLogin] = React.useState<Partial<MonitorLogin>>({});
  const [emailError, setEmailError] = React.useState('');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });

  const isView = mode === 'view';

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (val: string) => {
    setFormData(prev => ({ ...prev, email: val }));
    if (val && !validateEmail(val)) {
      setEmailError('Formato de e-mail inválido');
    } else {
      setEmailError('');
    }
  };

  const addLogin = () => {
    if (newLogin.description && newLogin.login) {
      setFormData({
        ...formData,
        logins: [...(formData.logins || []), { ...newLogin, id: Math.random().toString() } as MonitorLogin]
      });
      setNewLogin({});
    }
  };

  const executeRemoveLogin = (id: string) => {
    setFormData({
      ...formData,
      logins: formData.logins?.filter(l => l.id !== id) || []
    });
    setConfirmModal({ isOpen: false, id: '' });
  };

  const performValidationAndSave = async (): Promise<boolean> => {
    if (!formData.name) {
       alert('O campo Nome é obrigatório.');
       return false;
    }
    if (formData.email && !validateEmail(formData.email)) {
       alert('Por favor, corrija o e-mail antes de salvar.');
       return false;
    }
    await onSave(formData);
    return true;
  };

  const { isModalOpen, handleSaveAndLeave, handleDiscard, handleCancel, bypassInterceptor } = useUnsavedChanges(!isView && !isReadOnly, performValidationAndSave);

  const handleSaveClick = async () => {
    bypassInterceptor();
    await performValidationAndSave();
  };

  const handleCancelClick = () => {
    bypassInterceptor();
    onCancel();
  };

  // Only show Active studies in the dropdown
  const studyOptions = studies
    .filter(s => s.status === 'Active')
    .map(s => ({ label: s.name, value: s.id }));
    
  const roleOptions = DROPDOWN_OPTIONS.monitorRoles.map(r => ({ label: r, value: r }));
  const croOptions = DROPDOWN_OPTIONS.cros.map(c => ({ label: c, value: c }));

  // Helper to get study name for view mode
  const currentStudyName = studies.find(s => s.id === formData.studyId)?.name || formData.studyId;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-5xl mx-auto flex flex-col relative max-h-[90vh]">
      <UnsavedChangesModal 
        isOpen={isModalOpen}
        onSaveAndLeave={handleSaveAndLeave}
        onDiscardAndLeave={handleDiscard}
        onCancel={handleCancel}
      />
      <div className="bg-[#007b63] shrink-0 text-white py-4 px-6 flex justify-between items-center z-10 sticky top-0">
        <h2 className="text-xl font-bold tracking-tight">
          {isView ? 'Visualização de Dados Monitoria' : 'Cadastro de Dados Monitoria'}
        </h2>
        <button onClick={handleCancelClick} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-8 flex flex-col gap-8 overflow-y-auto bg-gray-50/50 flex-1">
        <section>
          <SectionTitle title="GERAL" />
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MonitorInput label="Nome" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} placeholder="Nome Completo" isView={isView} />
              <MonitorInput label="Função" value={formData.role} onChange={(v: string) => setFormData({...formData, role: v})} options={roleOptions} isView={isView} />
              <MonitorInput label="CRO" value={formData.cro} onChange={(v: string) => setFormData({...formData, cro: v})} options={croOptions} isView={isView} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MonitorInput label="Contato" value={formData.contact} onChange={(v: string) => setFormData({...formData, contact: v})} placeholder="(00) 00000-0000" isView={isView} />
              <MonitorInput label="E-mail" value={formData.email} onChange={handleEmailChange} placeholder="email@exemplo.com" error={emailError} isView={isView} />
            </div>
            
            <div className="flex flex-col gap-3 w-full mt-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">
                Vínculo de Estudos
              </label>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column: Available Studies */}
                <div className="border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-48">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 font-bold text-xs text-gray-600 uppercase flex justify-between">
                    <span>Estudos Disponíveis</span>
                    <span className="text-[10px] bg-gray-200 px-1.5 rounded">{studies.filter(s => s.status === 'Active' && !(formData.studyIds || []).includes(s.id)).length}</span>
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-white">
                    {studies.filter(s => s.status === 'Active' && !(formData.studyIds || []).includes(s.id)).length === 0 && <p className="text-center text-xs text-gray-400 mt-6 italic">Todos os estudos selecionados.</p>}
                    {studies.filter(s => s.status === 'Active' && !(formData.studyIds || []).includes(s.id)).map(study => (
                      <label key={study.id} className={`flex items-center gap-2 p-2 hover:bg-gray-50 rounded group transition-colors ${isView || isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            disabled={isView || isReadOnly}
                            className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded checked:bg-[#007b63] checked:border-[#007b63] transition-all disabled:opacity-50"
                            checked={false}
                            onChange={() => {
                              const current = formData.studyIds || [];
                              setFormData({ ...formData, studyIds: [...current, study.id] })
                            }}
                          />
                          <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{study.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Right Column: Selected Studies */}
                <div className="border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-48">
                  <div className="bg-[#d1e7e4] px-4 py-2 border-b border-[#007b63]/20 font-bold text-xs text-[#007b63] uppercase flex justify-between">
                    <span>Estudos Selecionados</span>
                    <span className="text-[10px] bg-white px-1.5 rounded text-[#007b63]">{(formData.studyIds || []).length}</span>
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-white">
                    {(formData.studyIds || []).length === 0 && <p className="text-center text-xs text-gray-400 mt-6 italic">Nenhum estudo selecionado.</p>}
                    {(formData.studyIds || []).map(studyId => {
                      const study = studies.find(s => s.id === studyId);
                      return (
                        <label key={studyId} className={`flex items-center gap-2 p-2 bg-gray-50 hover:bg-red-50 rounded group transition-colors border border-transparent hover:border-red-100 ${isView || isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              disabled={isView || isReadOnly}
                              className="peer appearance-none w-4 h-4 border-2 border-[#007b63] bg-[#007b63] rounded checked:bg-red-500 checked:border-red-500 transition-all disabled:opacity-50"
                              checked={true}
                              onChange={() => {
                                const current = formData.studyIds || [];
                                setFormData({ ...formData, studyIds: current.filter(id => id !== studyId) })
                              }}
                            />
                            <svg className="absolute w-3 h-3 text-white peer-checked:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            <svg className="absolute w-3 h-3 text-white hidden peer-checked:block pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700 group-hover:text-red-600">{study?.name || studyId}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle title="LOGINS" />
          {!isView && !isReadOnly && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1fr,auto] gap-3 mb-4 items-end">
              <input 
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none" 
                placeholder="Descrição (ex: Plataforma X)"
                value={newLogin.description || ''}
                onChange={e => setNewLogin({...newLogin, description: e.target.value})}
              />
              <input 
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none" 
                placeholder="Login"
                value={newLogin.login || ''}
                onChange={e => setNewLogin({...newLogin, login: e.target.value})}
              />
              <input 
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none" 
                placeholder="Senha"
                value={newLogin.password || ''}
                onChange={e => setNewLogin({...newLogin, password: e.target.value})}
              />
              <button 
                onClick={addLogin}
                className="bg-[#007b63] text-white px-4 py-2 rounded-md font-bold hover:bg-[#005a48] transition-colors uppercase text-xs h-[38px]"
              >
                Adicionar
              </button>
            </div>
          )}
          <div className="overflow-hidden border rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#007b63] text-white font-semibold">
                <tr>
                  <th className="px-4 py-2">Descrição</th>
                  <th className="px-4 py-2">Login</th>
                  <th className="px-4 py-2">Senha</th>
                  {!isView && !isReadOnly && <th className="px-4 py-2 text-right">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(!formData.logins || formData.logins.length === 0) && (
                   <tr><td colSpan={isView || isReadOnly ? 3 : 4} className="px-4 py-4 text-center text-gray-400 italic text-xs">Nenhum login cadastrado.</td></tr>
                )}
                {formData.logins?.map(l => (
                  <tr key={l.id}>
                    <td className="px-4 py-2">{l.description}</td>
                    <td className="px-4 py-2">{l.login}</td>
                    <td className="px-4 py-2">{l.password || ''}</td>
                    {!isView && !isReadOnly && (
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => setConfirmModal({ isOpen: true, id: l.id })} className="text-red-500 font-bold uppercase text-[10px]">Remover</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 px-8 py-6 shrink-0 mt-auto">
        {isView || isReadOnly ? (
          <>
             <button onClick={handleCancelClick} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
               Fechar
             </button>
             {!isReadOnly && (
               <button onClick={onEdit} className="px-8 py-2 bg-[#007b63] text-white rounded-lg text-sm font-bold shadow-lg shadow-[#007b63]/20 hover:bg-[#005a48] transition-all">
                 Editar
               </button>
             )}
          </>
        ) : (
          <>
            <button onClick={handleCancelClick} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSaveClick} className="px-8 py-2 bg-[#007b63] text-white rounded-lg text-sm font-bold shadow-lg shadow-[#007b63]/20 hover:bg-[#005a48] transition-all">
              Salvar
            </button>
          </>
        )}
      </div>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title="Confirmar Remoção"
        message="Deseja realmente remover este login de monitoria?"
        onConfirm={() => executeRemoveLogin(confirmModal.id)}
        onCancel={() => setConfirmModal({ isOpen: false, id: '' })}
      />
    </div>
  );
};
