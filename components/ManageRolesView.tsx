import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { UserProfile } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface ManageRolesViewProps {
  onShowSuccess: (title: string, message: string) => void;
  currentUserProfile: UserProfile;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  dependsOn?: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // INÍCIO
  { id: 'access_agenda', name: 'Acesso à Agenda', description: 'Permite visualizar a Agenda.', category: 'Início', subcategory: 'Agenda' },
  { id: 'edit_agenda', name: 'Acesso ao botão "+NOVO EVENTO"', description: 'Permite criar novos eventos na Agenda.', category: 'Início', subcategory: 'Agenda', dependsOn: 'access_agenda' },
  
  { id: 'access_settings', name: 'Acesso à Configurações', description: 'Permite acessar as configurações do sistema.', category: 'Início', subcategory: 'Configuração' },
  
  { id: 'access_dashboard', name: 'Acesso ao Dashboard', description: 'Permite visualizar o Dashboard.', category: 'Início', subcategory: 'Dashboard' },
  { id: 'access_notepad', name: 'Acesso ao Bloco de Notas', description: 'Permite acessar o Bloco de Notas.', category: 'Início', subcategory: 'Bloco de notas' },
  { id: 'access_regulatory_links', name: 'Acesso à Links Úteis', description: 'Permite acessar Links Úteis.', category: 'Início', subcategory: 'Links Úteis' },
  
  // Perfil de Usuário
  { id: 'access_manage_roles', name: 'Acesso à Relação de Perfis', description: 'O perfil que tiver esta caixa de seleção marcada, terá acesso e verá o menu Relação de Perfis.', category: 'Perfil de Usuário', subcategory: 'Perfil' },
  { id: 'manage_permissions', name: 'Gerenciamento de Permissões', description: 'Pode atribuir e restringir permissões os perfis.', category: 'Perfil de Usuário', subcategory: 'Perfil' },
  { id: 'manage_users', name: 'Gerenciar Usuários', description: 'Pode cadastrar novos usuarios no sistema.', category: 'Perfil de Usuário', subcategory: 'Perfil' },

  // DADOS
  { id: 'access_calibrations', name: 'Acesso à Calibrações', description: 'Permite visualizar as calibrações.', category: 'Dados', subcategory: 'Calibrações' },
  { id: 'create_calibrations', name: 'Acesso ao botão "+NOVA CALIBRAÇÃO"', description: 'Permite adicionar novas calibrações.', category: 'Dados', subcategory: 'Calibrações', dependsOn: 'access_calibrations' },
  
  { id: 'access_team', name: 'Acesso à Estudo', description: 'Permite visualizar a equipe.', category: 'Dados', subcategory: 'Equipe' },
  { id: 'create_team', name: 'Acesso à botão "+NOVO"', description: 'Permite adicionar membros à equipe.', category: 'Dados', subcategory: 'Equipe', dependsOn: 'access_team' },
  { id: 'edit_team', name: 'Acesso ao botão Editar no cadastro do estudo', description: 'Pode alterar informações dos membros da equipe.', category: 'Dados', subcategory: 'Equipe', dependsOn: 'access_team' },
  { id: 'delete_team', name: 'Apagar "PERMANENTEMENTE" um registro de membro da equipe', description: 'Permite excluir definitivamente um formulário da lista de relação de membro.', category: 'Dados', subcategory: 'Equipe', dependsOn: 'access_team' },
  { id: 'view_platform_passwords', name: 'Acesso as SENHA na sessão Plataformas de acesso', description: 'Permite visualizar senhas de plataformas.', category: 'Dados', subcategory: 'Equipe', dependsOn: 'access_team' },

  { id: 'access_indices', name: 'Acesso à Índice', description: 'Permite visualizar os índices.', category: 'Dados', subcategory: 'Índice' },

  { id: 'access_monitoria', name: 'Acesso à Monitoria', description: 'Permite visualizar a monitoria.', category: 'Dados', subcategory: 'Monitoria' },
  { id: 'create_monitoria', name: 'Acesso à botão "+NOVO"', description: 'Permite adicionar nova monitoria.', category: 'Dados', subcategory: 'Monitoria', dependsOn: 'access_monitoria' },
  { id: 'edit_monitoria', name: 'Acesso ao botão Editar no visualização de dados monitoria', description: 'Pode alterar informações da monitoria.', category: 'Dados', subcategory: 'Monitoria', dependsOn: 'access_monitoria' },

  { id: 'access_participants', name: 'Acesso à Participante', description: 'Permite visualizar os participantes.', category: 'Dados', subcategory: 'Participantes' },
  { id: 'create_participants', name: 'Acesso à botão "+NOVO"', description: 'Permite adicionar novos participantes.', category: 'Dados', subcategory: 'Participantes', dependsOn: 'access_participants' },
  { id: 'edit_participants', name: 'Acesso ao botão Editar no visualização de dados participantes', description: 'Pode alterar informações dos participantes.', category: 'Dados', subcategory: 'Participantes', dependsOn: 'access_participants' },

  { id: 'access_sponsors', name: 'Acesso à Patrocinador', description: 'Permite visualizar os patrocinadores.', category: 'Dados', subcategory: 'Patrocinador' },
  { id: 'create_sponsors', name: 'Acesso à botão "+NOVO"', description: 'Permite adicionar novos patrocinadores.', category: 'Dados', subcategory: 'Patrocinador', dependsOn: 'access_sponsors' },
  { id: 'edit_sponsors', name: 'Acesso ao botão Editar no visualização de dados Patrocinador', description: 'Pode alterar informações dos patrocinadores.', category: 'Dados', subcategory: 'Patrocinador', dependsOn: 'access_sponsors' },

  // SETOR
  { id: 'access_adm', name: 'Acesso à Adm', description: 'Permite acessar o menu Adm.', category: 'Setor', subcategory: 'Adm' },
  { id: 'access_birthday', name: 'Acesso à Aniversário', description: 'Permite acessar aniversários.', category: 'Setor', subcategory: 'Adm' },
  { id: 'access_associates', name: 'Acesso à Associado', description: 'Permite acessar associados.', category: 'Setor', subcategory: 'Adm' },
  { id: 'access_adm_general', name: 'Acesso à Geral', description: 'Permite acessar geral da Adm.', category: 'Setor', subcategory: 'Adm' },
  { id: 'access_assets', name: 'Acesso à Patrimônio', description: 'Permite acessar patrimônio.', category: 'Setor', subcategory: 'Adm' },
  { id: 'access_hr', name: 'Acesso à RH', description: 'Permite acessar RH.', category: 'Setor', subcategory: 'Adm' },

  { id: 'access_audit', name: 'Acesso à Auditoria', description: 'Permite acessar Auditoria.', category: 'Setor', subcategory: 'Auditoria' },

  { id: 'access_visit_control', name: 'Acesso à Controle de Visitas', description: 'Permite acessar Controle de Visitas.', category: 'Setor', subcategory: 'Coordenação' },
  { id: 'access_gcp_deviation', name: 'Acesso à Desvio de GCP', description: 'Permite acessar Desvio de GCP.', category: 'Setor', subcategory: 'Coordenação' },
  { id: 'access_protocol_deviation', name: 'Acesso à Desvio de Protocolo', description: 'Permite acessar Desvio de Protocolo.', category: 'Setor', subcategory: 'Coordenação' },
  { id: 'access_sae_deviation', name: 'Acesso à Desvio de SAE', description: 'Permite acessar Desvio de SAE.', category: 'Setor', subcategory: 'Coordenação' },
  { id: 'access_kit_stock', name: 'Acesso à Estoque Kit', description: 'Permite acessar Estoque Kit.', category: 'Setor', subcategory: 'Coordenação' },
  { id: 'access_exam_request', name: 'Acesso à Solicitação de exame', description: 'Permite acessar Solicitação de exame.', category: 'Setor', subcategory: 'Coordenação' },

  { id: 'access_education', name: 'Acesso à Educação / Ensino', description: 'Permite acessar Educação / Ensino.', category: 'Setor', subcategory: 'Educação / Ensino' },

  { id: 'access_infusion_control', name: 'Acesso à Controle de Infusão', description: 'Permite acessar Controle de Infusão.', category: 'Setor', subcategory: 'Enfermagem' },
  { id: 'access_nursing_general', name: 'Acesso à Geral', description: 'Permite acessar Geral da Enfermagem.', category: 'Setor', subcategory: 'Enfermagem' },

  { id: 'access_pharmacy', name: 'Avesso à Farmácia', description: 'Permite acessar Farmácia.', category: 'Setor', subcategory: 'Farmácia' },

  { id: 'access_finance_transactions', name: 'Acesso à Lançamento NFs', description: 'Permite acessar Lançamento NFs.', category: 'Setor', subcategory: 'Financeiro' },
  { id: 'access_finance_report', name: 'Acesso à Relatório de lançamento', description: 'Permite acessar Relatório de lançamento.', category: 'Setor', subcategory: 'Financeiro' },

  { id: 'access_reception', name: 'Acesso à Recepção', description: 'Permite acessar Recepção.', category: 'Setor', subcategory: 'Recepção' },

  { id: 'access_regulatory_partial_report', name: 'Acesso à Relatório Parcial', description: 'Permite acessar Relatório Parcial.', category: 'Setor', subcategory: 'Regulatório' },
  { id: 'access_cep_meeting', name: 'Acesso à Reunião do CEP', description: 'Permite acessar Reunião do CEP.', category: 'Setor', subcategory: 'Regulatório' },
];

export const ManageRolesView: React.FC<ManageRolesViewProps> = ({ onShowSuccess, currentUserProfile }) => {
  const [roles, setRoles] = useState<{ id: string, name: string, permissions?: string[] }[]>([]);
  const [dynamicPermissions, setDynamicPermissions] = useState<Permission[]>([]);
  const [newRole, setNewRole] = useState('');
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
  
  const [selectedRole, setSelectedRole] = useState<{ id: string, name: string, permissions?: string[] } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);

  useEffect(() => {
    loadRoles();
    loadDynamicPermissions();
  }, []);

  const loadDynamicPermissions = async () => {
    const docs = await db.getAll<{id: string, name: string}>('cepDocuments');
    const dynamicPerms: Permission[] = docs.map(d => ({
      id: `doc_notify_${d.name}`,
      name: d.name,
      description: `Notifica ao aprovar o documento ${d.name} na Reunião CEP.`,
      category: 'Documentos emenda',
      subcategory: 'Documentos'
    }));
    setDynamicPermissions(dynamicPerms);
  };

  const loadRoles = async () => {
    // Load default roles
    const defaultRoles = Object.values(UserProfile).map(name => ({ id: name, name, permissions: [] }));
    
    // Load custom roles from DB
    const customRoles = await db.getAll<{ id: string, name: string, permissions?: string[] }>('userProfiles');
    
    // Merge and remove duplicates, preferring DB versions if they exist (for permissions)
    const allRoles = [...defaultRoles, ...customRoles];
    const uniqueRolesMap = new Map();
    
    // Process default roles first
    defaultRoles.forEach(r => uniqueRolesMap.set(r.name, r));
    // Override with DB roles (which might have permissions saved)
    customRoles.forEach(r => uniqueRolesMap.set(r.name, r));
    
    const sortedRoles = Array.from(uniqueRolesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    setRoles(sortedRoles);
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newRole.trim()) return;

    const roleName = newRole.trim();
    
    // Check if role already exists
    if (roles.some(r => r.name.toLowerCase() === roleName.toLowerCase())) {
      setError('Este perfil já existe.');
      return;
    }

    const newRoleObj = { id: roleName, name: roleName, permissions: [] };
    await db.upsert('userProfiles', newRoleObj);
    
    setNewRole('');
    setIsNewRoleModalOpen(false);
    onShowSuccess('Sucesso', 'Perfil adicionado com sucesso.');
    loadRoles();
  };

  const handleDeleteRole = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening the modal
    // Prevent deleting default roles
    const defaultRoles: string[] = Object.values(UserProfile);
    if (defaultRoles.includes(id)) {
      setError('Não é possível excluir perfis padrão do sistema.');
      return;
    }

    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteModal.id) {
      await db.delete('userProfiles', deleteModal.id);
      onShowSuccess('Excluído', 'Perfil excluído com sucesso.');
      loadRoles();
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  const handleRoleClick = (role: { id: string, name: string, permissions?: string[] }) => {
    setSelectedRole(role);
  };

  const handleToggleSubcategory = async (subcategory: string, category: string) => {
    if (!selectedRole) return;
    
    const canEditPermissions = currentUserProfile === UserProfile.DEVELOPER || currentUserProfile === UserProfile.ADMIN;
    if (!canEditPermissions) {
      alert('Apenas Desenvolvedor e Administrador podem alterar permissões.');
      return;
    }

    const ALL_PERMS = [...AVAILABLE_PERMISSIONS, ...dynamicPermissions];
    const subcategoryPerms = ALL_PERMS.filter(p => p.subcategory === subcategory && p.category === category);
    const currentPerms = selectedRole.permissions || [];
    
    // Check if all permissions in subcategory are currently checked
    const allChecked = subcategoryPerms.every(p => currentPerms.includes(p.id));
    
    let newPerms: string[];
    if (allChecked) {
      // Uncheck all
      newPerms = currentPerms.filter(p => !subcategoryPerms.some(sp => sp.id === p));
    } else {
      // Check all
      newPerms = [...currentPerms];
      subcategoryPerms.forEach(p => {
        if (!newPerms.includes(p.id)) {
          newPerms.push(p.id);
        }
      });
    }
    
    const updatedRole = { ...selectedRole, permissions: newPerms };
    setSelectedRole(updatedRole);
    
    // Save to DB
    await db.upsert('userProfiles', updatedRole);
    loadRoles();
  };

  const handleTogglePermission = async (permId: string) => {
    if (!selectedRole) return;
    
    const canEditPermissions = currentUserProfile === UserProfile.DEVELOPER || currentUserProfile === UserProfile.ADMIN;
    if (!canEditPermissions) {
      alert('Apenas Desenvolvedor e Administrador podem alterar permissões.');
      return;
    }

    const ALL_PERMS = [...AVAILABLE_PERMISSIONS, ...dynamicPermissions];
    const currentPerms = selectedRole.permissions || [];
    let newPerms: string[];

    if (currentPerms.includes(permId)) {
      // Unchecking: remove this permission AND any permissions that depend on it
      const permsToRemove = [permId];
      ALL_PERMS.forEach(p => {
        if (p.dependsOn === permId) {
          permsToRemove.push(p.id);
        }
      });
      newPerms = currentPerms.filter(p => !permsToRemove.includes(p));
    } else {
      // Checking: add this permission
      const permDef = ALL_PERMS.find(p => p.id === permId);
      if (permDef?.dependsOn && !currentPerms.includes(permDef.dependsOn)) {
        // Parent is not checked, so we can't check this one
        return;
      }
      newPerms = [...currentPerms, permId];
    }
      
    const updatedRole = { ...selectedRole, permissions: newPerms };
    setSelectedRole(updatedRole);
    
    // Save to DB
    await db.upsert('userProfiles', updatedRole);
    loadRoles();
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full w-full">
      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        title="Excluir Perfil"
        message="Tem certeza que deseja excluir este perfil? Usuários com este perfil podem perder acesso a algumas áreas."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: null })}
      />

      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Relação de Perfis</h2>
        <button 
          onClick={() => setIsNewRoleModalOpen(true)}
          className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase hover:bg-[#00604d] transition-colors"
        >
          + Novo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
            <p>{error}</p>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Nome do Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map((role) => {
                const isDefault = (Object.values(UserProfile) as string[]).includes(role.name);
                return (
                  <tr 
                    key={role.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleRoleClick(role)}
                  >
                    <td className="px-6 py-2 text-sm font-bold text-gray-700 flex justify-between items-center">
                      <span>{role.name}</span>
                      {!isDefault && (
                        <button 
                          onClick={(e) => handleDeleteRole(e, role.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                          title="Excluir Perfil"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Role Modal */}
      {isNewRoleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsNewRoleModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-[#007b63] p-6 text-white shrink-0 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter">Novo Perfil</h2>
              <button onClick={() => setIsNewRoleModalOpen(false)} className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddRole} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1 mb-1 block">Nome do Novo Perfil</label>
                  <input 
                    type="text" 
                    className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] w-full"
                    placeholder="Ex: Médico Pesquisador"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    autoFocus
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-[#007b63] text-white px-6 py-3 rounded-xl font-bold uppercase text-xs shadow-md hover:bg-[#005a48] transition-colors h-[46px]"
                >
                  Adicionar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedRole(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-[#007b63] p-6 text-white shrink-0">
              <h2 className="text-xl font-black uppercase tracking-tighter">Permissões do Perfil</h2>
              <p className="text-sm opacity-90 mt-1 font-medium">{selectedRole.name}</p>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50 flex flex-col gap-3">
              {Array.from(new Set([...dynamicPermissions, ...AVAILABLE_PERMISSIONS].map(p => p.category))).map(category => {
                const ALL_PERMS = [...AVAILABLE_PERMISSIONS, ...dynamicPermissions];
                const isExpanded = expandedCategories.includes(category);
                const categoryPerms = ALL_PERMS.filter(p => p.category === category);
                
                return (
                  <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm shrink-0">
                    <button 
                      onClick={() => setExpandedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category])}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs">{category}</h3>
                      <svg 
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isExpanded && (
                      <div className="divide-y divide-gray-100 border-t border-gray-200">
                        {Array.from(new Set(categoryPerms.map(p => p.subcategory))).map(subcategory => {
                          const subcategoryPerms = categoryPerms.filter(p => p.subcategory === subcategory);
                          const allChecked = subcategoryPerms.every(p => (selectedRole.permissions || []).includes(p.id));
                          const canEdit = currentUserProfile === UserProfile.DEVELOPER || currentUserProfile === UserProfile.ADMIN;
                          
                          return (
                            <div key={subcategory} className="flex flex-col">
                              <div 
                                className={`flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-100 ${canEdit ? 'cursor-pointer hover:bg-gray-100' : 'opacity-80'}`}
                                onClick={() => handleToggleSubcategory(subcategory, category)}
                              >
                                <div className="shrink-0">
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allChecked ? 'bg-[#007b63] border-[#007b63]' : 'border-gray-400 bg-white'}`}>
                                    {allChecked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                                </div>
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{subcategory}</h4>
                              </div>
                              
                              <div className="flex flex-col divide-y divide-gray-50 pl-4">
                                {subcategoryPerms.map(perm => {
                                  const hasPerm = (selectedRole.permissions || []).includes(perm.id);
                                  const isParentChecked = !perm.dependsOn || (selectedRole.permissions || []).includes(perm.dependsOn);
                                  const isDisabled = !canEdit || !isParentChecked;
                                  
                                  return (
                                    <div 
                                      key={perm.id} 
                                      className={`flex items-start gap-4 p-3 transition-all ${hasPerm ? 'bg-[#007b63]/5' : 'bg-white'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
                                      onClick={() => {
                                        if (!isDisabled) {
                                          handleTogglePermission(perm.id);
                                        }
                                      }}
                                    >
                                      <div className="pt-0.5 shrink-0">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasPerm ? 'bg-[#007b63] border-[#007b63]' : 'border-gray-300 bg-white'} ${isDisabled ? 'bg-gray-100 border-gray-200' : ''}`}>
                                          {hasPerm && <svg className={`w-3.5 h-3.5 ${isDisabled ? 'text-gray-400' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className={`text-sm font-bold ${hasPerm ? 'text-[#007b63]' : 'text-gray-700'} ${isDisabled ? 'text-gray-400' : ''}`}>{perm.name}</h4>
                                        <p className={`text-xs mt-1 leading-relaxed ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>{perm.description}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedRole(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold uppercase hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
