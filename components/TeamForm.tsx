
import React, { useState } from 'react';
import { TeamMember, PlatformAccess, User, UserProfile } from '../types';
import { DROPDOWN_OPTIONS } from '../constants';
import { ConfirmationModal } from './ConfirmationModal';
import { UnsavedChangesModal, useUnsavedChanges } from './UnsavedChangesModal';
import { showValidation } from './ValidationModal';

import { db } from '../database';

interface TeamFormProps {
  member?: TeamMember;
  mode: 'edit' | 'view';
  onSave: (data: Partial<TeamMember>) => void;
  onCancel: () => void;
  onEdit?: () => void;
  isReadOnly?: boolean;
  currentUser?: User;
}

const SectionTitle = ({ title }: { title: string }) => (
  <div className="bg-[#d1e7e4] text-[#007b63] font-bold text-center py-1.5 uppercase tracking-widest text-xs mb-4 border-b border-[#007b63]/20">
    {title}
  </div>
);

const TeamInput = ({ 
  label, 
  value, 
  onChange,
  isView,
  type = "text", 
  options, 
  required = false,
  placeholder,
  span,
  onAddOption
}: any) => (
  <div className={`flex flex-col gap-1 w-full ${span || ''}`}>
    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">
      {label} {required && !isView && <span className="text-red-500">*</span>}
    </label>
    {options && !isView ? (
      <div className={`grid ${onAddOption ? 'grid-cols-[1fr,auto] gap-2' : 'grid-cols-1'}`}>
        <select 
          className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none w-full"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Selecione...</option>
          {[...options].sort((a, b) => a.localeCompare(b)).map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
        {onAddOption && (
          <button
            type="button"
            onClick={onAddOption}
            className="bg-[#007b63] text-white px-3 py-2 rounded-md font-bold hover:bg-[#005a48] transition-colors flex items-center justify-center min-w-[40px]"
          >
            +
          </button>
        )}
      </div>
    ) : (
      <input 
        type={isView ? "text" : type}
        readOnly={isView}
        placeholder={isView ? '' : placeholder}
        className={`border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none transition-all ${isView ? 'bg-gray-100' : 'bg-white'}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
);

export const TeamForm: React.FC<TeamFormProps> = ({ member, mode, onSave, onCancel, onEdit, isReadOnly = false, currentUser }) => {
  const [formData, setFormData] = React.useState<Partial<TeamMember>>(member || {
    platforms: [],
    active: true // Padrão ativo
  });

  const [customRoles, setCustomRoles] = React.useState<string[]>([]);
  const [showAddRoleModal, setShowAddRoleModal] = React.useState(false);
  const [newRole, setNewRole] = React.useState('');
  const [editingRoleOption, setEditingRoleOption] = React.useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = React.useState('');
  
  const [customPlatforms, setCustomPlatforms] = React.useState<string[]>([]);
  const [showAddPlatformModal, setShowAddPlatformModal] = React.useState(false);
  const [newPlatformName, setNewPlatformName] = React.useState('');
  const [editingPlatformOption, setEditingPlatformOption] = React.useState<string | null>(null);
  const [editingOptionName, setEditingOptionName] = React.useState('');

  const [activeStudiesFull, setActiveStudiesFull] = React.useState<any[]>([]);
  const [divergentStudies, setDivergentStudies] = React.useState<string[]>([]);
  const [divergenceMessage, setDivergenceMessage] = React.useState('');
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);
  
  // Backwards compatibility for easy rendering
  const activeStudies = activeStudiesFull.map(s => ({ id: s.id, name: s.name }));

  const canViewPasswords = currentUser?.profile === UserProfile.DEVELOPER || currentUser?.profile === UserProfile.ADMIN || userPermissions.includes('view_platform_passwords');

  React.useEffect(() => {
    const loadCustomRoles = async () => {
      const roles = await db.getAll<{id: string, name: string}>('customRoles');
      setCustomRoles(roles.map(r => r.name));
    };
    const loadCustomPlatforms = async () => {
      const platforms = await db.getAll<{id: string, name: string}>('customPlatforms');
      setCustomPlatforms(platforms.map(p => p.name));
    };
    const loadStudies = async () => {
      const allStudies = await db.getAll<any>('studies');
      setActiveStudiesFull(allStudies.filter(s => s.status === 'Active'));
    };
    const loadUserPermissions = async () => {
      if (currentUser) {
        const roles = await db.getAll<{id: string, name: string, permissions?: string[]}>('userProfiles');
        const pf = roles.find(r => r.name === currentUser.profile);
        setUserPermissions(pf?.permissions || []);
      }
    };
    
    loadCustomRoles();
    loadCustomPlatforms();
    loadStudies();
    loadUserPermissions();
  }, [currentUser]);

  const handleAddCustomRole = async () => {
    if (newRole.trim()) {
      const roleName = newRole.trim();
      await db.upsert('customRoles', { id: roleName, name: roleName });
      setCustomRoles([...customRoles, roleName]);
      setFormData({ ...formData, role: roleName });
      setNewRole('');
    }
  };

  const handleEditCustomRole = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingRoleOption(null);
      return;
    }
    const name = newName.trim();
    await db.delete('customRoles', oldName);
    await db.upsert('customRoles', { id: name, name: name });
    
    setCustomRoles(customRoles.map(r => r === oldName ? name : r));
    setEditingRoleOption(null);

    // Update form if the edited role is currently selected
    if (formData.role === oldName) {
      setFormData({ ...formData, role: name });
    }
  };

  const handleDeleteCustomRoleOption = async (name: string) => {
    await db.delete('customRoles', name);
    setCustomRoles(customRoles.filter(r => r !== name));
    if (formData.role === name) {
      setFormData({ ...formData, role: '' });
    }
  };

  const handleAddCustomPlatform = async () => {
    if (newPlatformName.trim()) {
      const pName = newPlatformName.trim();
      await db.upsert('customPlatforms', { id: pName, name: pName });
      setCustomPlatforms([...customPlatforms, pName]);
      setNewPlatform({...newPlatform, name: pName});
      setNewPlatformName('');
    }
  };

  const handleEditCustomPlatform = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingPlatformOption(null);
      return;
    }
    const name = newName.trim();
    await db.delete('customPlatforms', oldName);
    await db.upsert('customPlatforms', { id: name, name: name });
    
    setCustomPlatforms(customPlatforms.map(p => p === oldName ? name : p));
    setEditingPlatformOption(null);

    // Update in any selected newPlatform dropdown
    if (newPlatform.name === oldName) {
      setNewPlatform({ ...newPlatform, name });
    }
  };

  const handleDeleteCustomPlatformOption = async (name: string) => {
    await db.delete('customPlatforms', name);
    setCustomPlatforms(customPlatforms.filter(p => p !== name));
    if (newPlatform.name === name) {
      setNewPlatform({ ...newPlatform, name: '' });
    }
  };

  const [newPlatform, setNewPlatform] = React.useState<Partial<PlatformAccess>>({});
  const [newStudyRole, setNewStudyRole] = React.useState<{studyId: string, role: string}>({studyId: '', role: ''});
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
  const [platformSortConfig, setPlatformSortConfig] = React.useState<{ key: keyof PlatformAccess, direction: 'asc' | 'desc' } | null>(null);

  const handlePlatformSort = (key: keyof PlatformAccess) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (platformSortConfig && platformSortConfig.key === key && platformSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setPlatformSortConfig({ key, direction });
  };

  const getSortedPlatforms = () => {
    if (!formData.platforms) return [];
    if (!platformSortConfig) return formData.platforms;
    
    return [...formData.platforms].sort((a, b) => {
      const valA = (a[platformSortConfig.key] || '').toString().toLowerCase();
      const valB = (b[platformSortConfig.key] || '').toString().toLowerCase();
      
      if (valA < valB) return platformSortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return platformSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const isView = mode === 'view';

  const formatPhone = (val: string) => {
    const numbers = val.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handlePhoneChange = (name: keyof TeamMember, value: string) => {
    const formatted = formatPhone(value);
    if (formatted.length <= 15) {
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
  };

  const handleNameChange = (value: string) => {
    if (!/\d/.test(value)) {
      setFormData(prev => ({ ...prev, name: value }));
    }
  };

  const handleCPFChange = (value: string) => {
    let val = value.replace(/\D/g, '');
    if (val.length > 11) val = val.substring(0, 11);
    
    const formatted = val
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const handleCNPJChange = (value: string) => {
    let val = value.replace(/\D/g, '');
    if (val.length > 14) val = val.substring(0, 14);
    
    const formatted = val
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
    
    setFormData(prev => ({ ...prev, cnpj: formatted }));
  };

  const handleFieldChange = (name: keyof TeamMember, value: string) => {
    if (name === 'phone' || name === 'cellphone') handlePhoneChange(name, value);
    else if (name === 'name') handleNameChange(value);
    else if (name === 'cpf') handleCPFChange(value);
    else if (name === 'cnpj') handleCNPJChange(value);
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleStatus = () => {
    if (isView || isReadOnly) return;
    setFormData(prev => ({ ...prev, active: !prev.active }));
  };

  const addPlatform = () => {
    if (newPlatform.name && newPlatform.login) {
      setFormData({
        ...formData,
        platforms: [...(formData.platforms || []), { ...newPlatform, id: Math.random().toString() } as PlatformAccess]
      });
      setNewPlatform({});
    }
  };

  const executeRemovePlatform = (id: string) => {
    setFormData({
      ...formData,
      platforms: formData.platforms?.filter(p => p.id !== id) || []
    });
    setConfirmModal({ isOpen: false, id: '' });
  };

  const addStudyRole = () => {
    if (newStudyRole.studyId && newStudyRole.role) {
      setFormData({
        ...formData,
        studyRoles: [...(formData.studyRoles || []), { ...newStudyRole }]
      });
      setNewStudyRole({studyId: '', role: ''});
    }
  };

  const executeRemoveStudyRole = (studyId: string) => {
    setFormData({
      ...formData,
      studyRoles: formData.studyRoles?.filter(sr => sr.studyId !== studyId) || []
    });
    setConfirmModal({ isOpen: false, id: '' });
  };

  const isActive = formData.active !== false; // Consider undefined as active

  const formatDateView = (dateString?: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const performValidationAndSave = async (): Promise<boolean> => {
    if (!formData.name) {
      showValidation('O campo Nome é obrigatório e precisa ser preenchido antes de salvar.');
      return false;
    }
    if (!formData.cpf) {
      showValidation('O campo CPF é obrigatório e precisa ser preenchido antes de salvar.');
      return false;
    }
    
    // Logic for Study divergence
    const currentDivergences: string[] = [];
    const updatesToStudies: any[] = [];
    
    for (const studyId of (formData.studyIds || [])) {
        const study = activeStudiesFull.find(s => s.id === studyId);
        if (study) {
            if (study.pi && study.pi.trim() !== '' && study.pi !== formData.name) {
                currentDivergences.push(study.id);
            } else if (!study.pi || study.pi.trim() === '') {
                updatesToStudies.push({ ...study, pi: formData.name });
            }
        }
    }

    if (currentDivergences.length > 0) {
        setDivergentStudies(currentDivergences);
        setDivergenceMessage('Há uma divergência no cadastro. O(s) estudo(s) destacado(s) em vermelho já possuem um PI diferente no sistema.');
        const contentDiv = document.getElementById('teamFormContent');
        if (contentDiv) contentDiv.scrollTo({ top: 0, behavior: 'smooth' });
        return false; 
    }

    setDivergentStudies([]);
    setDivergenceMessage('');

    for (const study of updatesToStudies) {
       await db.upsert('studies', study);
    }

    // Clean up old studyRoles to avoid confusion
    if (formData.studyRoles) {
      formData.studyRoles = [];
    }

    await onSave(formData);
    return true; // Used if we need to let caller know
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
          {isView ? 'Visualização de Dados Equipe' : 'Cadastro de Dados Equipe'}
        </h2>
        <button onClick={handleCancelClick} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div id="teamFormContent" className="p-8 flex flex-col gap-8 overflow-y-auto bg-gray-50/50 flex-1 relative">
        {divergenceMessage && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg font-bold border border-red-200 shadow-sm">
            {divergenceMessage}
          </div>
        )}
        <section>
          <SectionTitle title="GERAL" />
          <div className="grid grid-cols-1 md:grid-cols-[1fr,2fr,1fr] gap-3">
            {/* Linha 1 */}
            <TeamInput 
              label="Sr. / Sra." 
              value={formData.honorific} 
              onChange={(v: string) => handleFieldChange('honorific', v)} 
              options={DROPDOWN_OPTIONS.teamHonorifics} 
              isView={isView} 
            />
            <TeamInput 
              label="Nome" 
              value={formData.name} 
              onChange={(v: string) => handleFieldChange('name', v)} 
              required 
              isView={isView} 
            />
            <TeamInput 
              label="Função" 
              value={formData.role} 
              onChange={(v: string) => handleFieldChange('role', v)} 
              options={[...DROPDOWN_OPTIONS.teamRoles, ...customRoles]} 
              onAddOption={() => setShowAddRoleModal(true)}
              required 
              isView={isView} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            {/* Linha 2 */}
            <TeamInput 
              label="Telefone" 
              value={formData.phone} 
              onChange={(v: string) => handleFieldChange('phone', v)} 
              placeholder="(00) 0000-0000" 
              isView={isView} 
            />
            <TeamInput 
              label="Celular" 
              value={formData.cellphone} 
              onChange={(v: string) => handleFieldChange('cellphone', v)} 
              required 
              placeholder="(00) 00000-0000" 
              isView={isView} 
            />
            <TeamInput 
              label="Data Nasc." 
              value={isView ? formatDateView(formData.birthDate) : formData.birthDate} 
              onChange={(v: string) => handleFieldChange('birthDate', v)} 
              type="date" 
              required 
              isView={isView} 
            />
          </div>
        </section>

        <section>
          <SectionTitle title="CV e GCP" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TeamInput label="Data CV" value={isView ? formatDateView(formData.cvDate) : formData.cvDate} onChange={(v: string) => handleFieldChange('cvDate', v)} type="date" isView={isView} />
            <TeamInput label="Data GCP" value={isView ? formatDateView(formData.gcpDate) : formData.gcpDate} onChange={(v: string) => handleFieldChange('gcpDate', v)} type="date" isView={isView} />
          </div>
        </section>

        <section>
          <SectionTitle title="ESTUDOS VINCULADOS" />
          <div className="flex flex-col gap-3 w-full">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column: Available Studies */}
              <div className="border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-48">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 font-bold text-xs text-gray-600 uppercase flex justify-between">
                  <span>Estudos Disponíveis</span>
                  <span className="text-[10px] bg-gray-200 px-1.5 rounded">{activeStudiesFull.filter(s => !(formData.studyIds || []).includes(s.id)).length}</span>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-white">
                  {activeStudiesFull.filter(s => !(formData.studyIds || []).includes(s.id)).length === 0 && <p className="text-center text-xs text-gray-400 mt-6 italic">Todos os estudos selecionados.</p>}
                  {activeStudiesFull.filter(s => !(formData.studyIds || []).includes(s.id)).map(study => (
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
                    const study = activeStudiesFull.find(s => s.id === studyId);
                    const isDivergent = divergentStudies.includes(studyId);
                    return (
                      <label key={studyId} className={`flex items-center gap-2 p-2 ${isDivergent ? 'bg-red-50 hover:bg-red-100 border-red-200' : 'bg-gray-50 hover:bg-red-50 border-transparent hover:border-red-100'} rounded group transition-colors border ${isView || isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            disabled={isView || isReadOnly}
                            className={`peer appearance-none w-4 h-4 border-2 rounded transition-all disabled:opacity-50 ${isDivergent ? 'border-red-500 bg-red-500' : 'border-[#007b63] bg-[#007b63] checked:bg-red-500 checked:border-red-500'}`}
                            checked={true}
                            onChange={() => {
                              const current = formData.studyIds || [];
                              setFormData({ ...formData, studyIds: current.filter(id => id !== studyId) })
                            }}
                          />
                          {!isDivergent && <svg className="absolute w-3 h-3 text-white peer-checked:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          <svg className={`absolute w-3 h-3 text-white pointer-events-none ${isDivergent ? 'block' : 'hidden peer-checked:block'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <span className={`text-xs font-medium ${isDivergent ? 'text-red-700' : 'text-gray-700 group-hover:text-red-600'}`}>{study?.name || studyId}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle title="PLATAFORMAS DE ACESSO" />
          {!isView && !isReadOnly && (
            <div className={`grid grid-cols-1 md:grid-cols-[1fr,1fr,${canViewPasswords ? '1fr,' : ''}1fr,auto] gap-3 mb-4 items-end`}>
              <div className="flex gap-2 w-full">
                <select 
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none w-full"
                  value={newPlatform.name || ''}
                  onChange={e => setNewPlatform({...newPlatform, name: e.target.value})}
                >
                  <option value="">Selecione Plataforma...</option>
                  {[...customPlatforms].sort((a,b) => a.localeCompare(b)).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddPlatformModal(true)}
                  className="bg-[#007b63] text-white px-3 py-2 rounded-md font-bold hover:bg-[#005a48] transition-colors flex items-center justify-center min-w-[40px]"
                  title="Gerenciar plataformas"
                >
                  +
                </button>
              </div>
              <input 
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none w-full" 
                placeholder="Login"
                value={newPlatform.login || ''}
                onChange={e => setNewPlatform({...newPlatform, login: e.target.value})}
              />
              {canViewPasswords && (
                <input 
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none w-full" 
                  placeholder="Senha"
                  value={newPlatform.password || ''}
                  onChange={e => setNewPlatform({...newPlatform, password: e.target.value})}
                />
              )}
              <input 
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none w-full" 
                  placeholder="Link"
                  value={newPlatform.link || ''}
                  onChange={e => setNewPlatform({...newPlatform, link: e.target.value})}
              />
              <button 
                onClick={addPlatform}
                className="bg-[#007b63] text-white px-4 py-2 rounded-md font-bold hover:bg-[#005a48] transition-colors"
               >
                 +
               </button>
            </div>
          )}
          <div className="overflow-hidden border rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm select-none">
              <thead className="bg-[#007b63] text-white font-semibold">
                <tr>
                  <th className="px-4 py-2 cursor-pointer hover:bg-[#006b56]" onClick={() => handlePlatformSort('name')}>
                    <div className="flex items-center gap-1">Nome Plataforma / Site <span className="opacity-70 text-xs">{platformSortConfig?.key === 'name' ? (platformSortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                  </th>
                  <th className="px-4 py-2 cursor-pointer hover:bg-[#006b56]" onClick={() => handlePlatformSort('login')}>
                    <div className="flex items-center gap-1">Login <span className="opacity-70 text-xs">{platformSortConfig?.key === 'login' ? (platformSortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                  </th>
                  {canViewPasswords && (
                    <th className="px-4 py-2 cursor-pointer hover:bg-[#006b56]" onClick={() => handlePlatformSort('password')}>
                      <div className="flex items-center gap-1">Senha <span className="opacity-70 text-xs">{platformSortConfig?.key === 'password' ? (platformSortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                    </th>
                  )}
                  <th className="px-4 py-2 cursor-pointer hover:bg-[#006b56]" onClick={() => handlePlatformSort('link')}>
                    <div className="flex items-center gap-1">Link <span className="opacity-70 text-xs">{platformSortConfig?.key === 'link' ? (platformSortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                  </th>
                  {!isView && !isReadOnly && <th className="px-4 py-2 text-right">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {getSortedPlatforms().map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{p.login}</td>
                    {canViewPasswords && <td className="px-4 py-2">{p.password}</td>}
                    <td className="px-4 py-2"><a href={p.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{p.link}</a></td>
                    {!isView && !isReadOnly && (
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => setConfirmModal({ isOpen: true, id: p.id })} className="text-red-500 font-bold uppercase text-[10px]">Remover</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionTitle title="RH / FINANCEIRO" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <TeamInput 
              label="CPF" 
              value={formData.cpf} 
              onChange={(v: string) => handleFieldChange('cpf', v)} 
              required 
              isView={isView} 
              placeholder="000.000.000-00"
            />
            <TeamInput label="LICENÇA" value={formData.license} onChange={(v: string) => handleFieldChange('license', v)} required isView={isView} />
            <TeamInput label="RQE" value={formData.rqe} onChange={(v: string) => handleFieldChange('rqe', v)} isView={isView} />
            <TeamInput label="MATRÍCULA" value={formData.matricula} onChange={(v: string) => handleFieldChange('matricula', v)} isView={isView} />
            
            <TeamInput 
              label="REGIME" 
              value={formData.contractType} 
              onChange={(v: string) => handleFieldChange('contractType', v)} 
              options={['CLT', 'PJ']} 
              isView={isView} 
            />
            {formData.contractType === 'PJ' && (
                <TeamInput label="CNPJ" value={formData.cnpj} onChange={(v: string) => handleFieldChange('cnpj', v)} isView={isView} placeholder="00.000.000/0000-00" />
            )}
            {formData.contractType === 'CLT' && (
              <>
                <TeamInput label="DATA ADMISSÃO" value={isView ? formatDateView(formData.admissionDate) : formData.admissionDate} onChange={(v: string) => handleFieldChange('admissionDate', v)} type="date" isView={isView} />
                <TeamInput label="DATA DESLIGAMENTO" value={isView ? formatDateView(formData.terminationDate) : formData.terminationDate} onChange={(v: string) => handleFieldChange('terminationDate', v)} type="date" isView={isView} />
              </>
            )}
          </div>
        </section>
      </div>

      <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center px-8 py-6 sticky bottom-0 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        
        <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
           <button 
             onClick={toggleStatus}
             disabled={isView || isReadOnly}
             className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isActive ? 'bg-[#007b63]' : 'bg-gray-300'} ${(isView || isReadOnly) ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
           >
             <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-md ${isActive ? 'left-7' : 'left-1'}`}></div>
           </button>
           <span className={`text-xs font-bold uppercase transition-colors ${isActive ? 'text-[#007b63]' : 'text-gray-400'}`}>
             {isActive ? 'Ativo' : 'Desativado'}
           </span>
        </div>

        <div className="flex gap-3">
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
      </div>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title="Confirmar Remoção"
        message={confirmModal.id.startsWith('study_') ? "Deseja realmente remover este estudo vinculado?" : "Deseja realmente remover esta plataforma de acesso?"}
        onConfirm={() => {
          if (confirmModal.id.startsWith('study_')) {
            executeRemoveStudyRole(confirmModal.id.replace('study_', ''));
          } else {
            executeRemovePlatform(confirmModal.id);
          }
        }}
        onCancel={() => setConfirmModal({ isOpen: false, id: '' })}
      />

      {showAddRoleModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative flex flex-col max-h-[80vh]">
            <h3 className="text-lg font-bold text-[#007b63] mb-4">Gerenciar Funções</h3>
            
            {/* List of existing custom roles */}
            <div className="flex flex-col gap-2 mb-4 overflow-y-auto flex-1 p-1">
               {customRoles.map(r => (
                  <div key={r} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                    {editingRoleOption === r ? (
                      <div className="flex w-full gap-2">
                        <input 
                          autoFocus
                          value={editingRoleName}
                          onChange={e => setEditingRoleName(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 outline-none focus:border-[#007b63]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditCustomRole(r, editingRoleName);
                            if (e.key === 'Escape') setEditingRoleOption(null);
                          }}
                        />
                        <button onClick={() => handleEditCustomRole(r, editingRoleName)} className="text-[#007b63] font-bold text-xs hover:underline">Salvar</button>
                        <button onClick={() => setEditingRoleOption(null)} className="text-gray-500 font-bold text-xs hover:underline">Canc.</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-gray-700">{r}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingRoleOption(r);
                              setEditingRoleName(r);
                            }} 
                            className="text-blue-500 hover:text-blue-700"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomRoleOption(r)} 
                            className="text-red-500 hover:text-red-700"
                            title="Remover"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
               ))}
               {customRoles.length === 0 && (
                 <p className="text-xs text-gray-400 italic text-center py-4">Nenhuma função customizada.</p>
               )}
            </div>

            <div className="flex flex-col gap-2 mb-6 border-t pt-4">
              <label className="text-[10px] uppercase font-bold text-gray-500">Adicionar Nova Função</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none flex-1"
                  placeholder="Ex.: Sub-Investigador"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomRole();
                  }}
                />
                <button 
                  onClick={handleAddCustomRole}
                  className="px-3 py-2 bg-[#007b63] text-white rounded text-sm font-bold shadow hover:bg-[#005a48] disabled:opacity-50"
                  disabled={!newRole.trim()}
                >
                  Criar
                </button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setShowAddRoleModal(false);
                  setNewRole('');
                  setEditingRoleOption(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-600 rounded text-sm font-semibold hover:bg-gray-50 w-full"
              >
                Fechar Gerenciador
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPlatformModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative flex flex-col max-h-[80vh]">
            <h3 className="text-lg font-bold text-[#007b63] mb-4">Gerenciar Plataformas</h3>
            
            {/* List of existing platforms */}
            <div className="flex flex-col gap-2 mb-4 overflow-y-auto flex-1 p-1">
               {customPlatforms.map(p => (
                  <div key={p} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                    {editingPlatformOption === p ? (
                      <div className="flex w-full gap-2">
                        <input 
                          autoFocus
                          value={editingOptionName}
                          onChange={e => setEditingOptionName(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 outline-none focus:border-[#007b63]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditCustomPlatform(p, editingOptionName);
                            if (e.key === 'Escape') setEditingPlatformOption(null);
                          }}
                        />
                        <button onClick={() => handleEditCustomPlatform(p, editingOptionName)} className="text-[#007b63] font-bold text-xs hover:underline">Salvar</button>
                        <button onClick={() => setEditingPlatformOption(null)} className="text-gray-500 font-bold text-xs hover:underline">Canc.</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-gray-700">{p}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingPlatformOption(p);
                              setEditingOptionName(p);
                            }} 
                            className="text-blue-500 hover:text-blue-700"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomPlatformOption(p)} 
                            className="text-red-500 hover:text-red-700"
                            title="Remover"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
               ))}
               {customPlatforms.length === 0 && (
                 <p className="text-xs text-gray-400 italic text-center py-4">Nenhuma plataforma cadastrada.</p>
               )}
            </div>

            <div className="flex flex-col gap-2 mb-6 border-t pt-4">
              <label className="text-[10px] uppercase font-bold text-gray-500">Adicionar Nova Plataforma</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none flex-1"
                  placeholder="Ex.: Plataforma Brasil"
                  value={newPlatformName}
                  onChange={(e) => setNewPlatformName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomPlatform();
                  }}
                />
                <button 
                  onClick={handleAddCustomPlatform}
                  className="px-3 py-2 bg-[#007b63] text-white rounded text-sm font-bold shadow hover:bg-[#005a48] disabled:opacity-50"
                  disabled={!newPlatformName.trim()}
                >
                  Criar
                </button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setShowAddPlatformModal(false);
                  setNewPlatformName('');
                  setEditingPlatformOption(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-600 rounded text-sm font-semibold hover:bg-gray-50 w-full"
              >
                Fechar Gerenciador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
