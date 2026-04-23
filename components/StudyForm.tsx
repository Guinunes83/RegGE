
import React, { useState, useEffect } from 'react';
import { Study, MonitorEntry, Patient, TeamMember, StudyDelegation, PIEntry, Sponsor } from '../types';
import { DROPDOWN_OPTIONS, MOCK_AVAILABLE_MONITORS, MOCK_PATIENTS, COLORS, DELEGATION_ROLES } from '../constants';
import { ConfirmationModal } from './ConfirmationModal';
import { db } from '../database';
import { SponsorForm } from './SponsorForm';
import { TeamForm } from './TeamForm';
import { MonitorForm } from './MonitorForm';
import { ParticipantForm } from './ParticipantForm';
import { UnsavedChangesModal, useUnsavedChanges } from './UnsavedChangesModal';

interface StudyFormProps {
  study?: Study;
  mode: 'edit' | 'view';
  onSave: (data: Partial<Study>) => void;
  onCancel: () => void;
  onEdit?: () => void;
  isReadOnly?: boolean;
}

const SectionTitle = ({ title }: { title: string }) => (
  <div className="bg-[#d1e7e4] text-[#007b63] font-bold text-center py-1.5 uppercase tracking-widest text-xs mb-4 border-b border-[#007b63]/20">
    {title}
  </div>
);

const StudyInput = ({ 
  label, 
  value, 
  onChange,
  isView,
  type = "text", 
  options, 
  isForcedDropdown = false,
  span,
  onAdd // Prop para função de adicionar novo item
}: any) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const shouldRenderDropdown = !isView && (options || isForcedDropdown);
  const displayValue = (isView && type === 'date') ? formatDate(value) : value;

  return (
    <div className={`flex flex-col gap-1 w-full ${span || ''}`}>
      <div className="flex justify-between items-center">
        <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">{label}</label>
      </div>
      <div className="flex gap-1">
        {shouldRenderDropdown ? (
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none flex-1 w-full"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Selecione...</option>
            {[...(options || [])].sort((a: string, b: string) => a.localeCompare(b)).map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input 
            type={type === 'password' && isView ? 'text' : type}
            readOnly={isView}
            className={`border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none transition-all flex-1 w-full ${isView ? 'bg-gray-100 cursor-text' : 'bg-white'}`}
            value={displayValue || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isView ? '' : `Digite ${label.toLowerCase()}...`}
          />
        )}
        {!isView && onAdd && (
          <button 
            onClick={onAdd}
            className="bg-[#007b63] text-white w-[38px] rounded-md font-bold text-lg hover:bg-[#005a48] transition-colors flex items-center justify-center shadow-sm"
            title={`Adicionar novo ${label}`}
            type="button"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};

export const StudyForm: React.FC<StudyFormProps> = ({ study, mode, onSave, onCancel, onEdit, isReadOnly = false }) => {
  const [formData, setFormData] = React.useState<Partial<Study>>(study || {
    monitors: [],
    participantsIds: [],
    delegation: [],
    medicationRoute: '',
    studyType: '',
    studyParticipantsCount: '',
    status: 'Active'
  });

  // Dados para Dropdowns Dinâmicos
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [piList, setPiList] = useState<string[]>([]);
  const [sponsorList, setSponsorList] = useState<string[]>([]);
  const [coordinatorList, setCoordinatorList] = useState<string[]>([]);
  const [croList, setCroList] = useState<string[]>([]);
  const [monitorList, setMonitorList] = useState<MonitorEntry[]>([]);
  const [participantList, setParticipantList] = useState<Patient[]>([]);

  // Controle de Modais de Cadastro Rápido
  const [activeModal, setActiveModal] = useState<'pi' | 'sponsor' | 'cro' | 'coordinator' | 'monitor' | 'participant' | 'teamMember' | null>(null);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    const [allTeam, allPis, allSponsors, allMonitors, allPatients] = await Promise.all([
      db.getAll<TeamMember>('team-members'),
      db.getAll<PIEntry>('pis'),
      db.getAll<Sponsor>('sponsors'),
      db.getAll<MonitorEntry>('monitors'),
      db.getAll<Patient>('patients')
    ]);

    setTeamMembers(allTeam.sort((a,b) => a.name.localeCompare(b.name)));
    setMonitorList(allMonitors.concat(MOCK_AVAILABLE_MONITORS).filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i));
    setParticipantList(allPatients.concat(MOCK_PATIENTS).filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i));
    
    // Mapear PIs para strings usando os membros cadastrados na equipe (database team-members)
    setPiList(allTeam.map(t => t.name).sort());
    
    // Mapear Sponsors para strings
    setSponsorList(allSponsors.map(s => s.name).sort());

    // Mapear CROs (usando a mesma tabela de Sponsors para simplificar, já que CROs são empresas)
    setCroList(allSponsors.map(s => s.name).concat(DROPDOWN_OPTIONS.cros).filter((v, i, a) => a.indexOf(v) === i).sort());

    // Mapear Coordenadores (apenas membros da equipe com a função de coordenador de estudo)
    const coords = allTeam.filter(t => t.role && t.role.toLowerCase().includes('coordenador')).map(t => t.name);
    setCoordinatorList(coords.filter((v, i, a) => a.indexOf(v) === i).sort());
  };

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    id: string;
    type: 'monitor' | 'participant' | 'delegation';
  }>({ isOpen: false, id: '', type: 'monitor' });

  const isView = mode === 'view';

  const handleChange = (name: keyof Study, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addMonitor = (monitorId: string) => {
    const monitor = monitorList.find(m => m.id === monitorId);
    if (monitor && !formData.monitors?.find(m => m.id === monitorId)) {
      setFormData({ ...formData, monitors: [...(formData.monitors || []), monitor] });
    }
  };

  const executeRemoveMonitor = (monitorId: string) => {
    setFormData({ ...formData, monitors: formData.monitors?.filter(m => m.id !== monitorId) || [] });
    setConfirmModal({ isOpen: false, id: '', type: 'monitor' });
  };

  const toggleParticipant = (pId: string) => {
    const current = formData.participantsIds || [];
    if (current.includes(pId)) {
      setConfirmModal({ isOpen: true, id: pId, type: 'participant' });
    } else {
      setFormData({ ...formData, participantsIds: [...current, pId] });
    }
  };

  const executeRemoveParticipant = (pId: string) => {
    setFormData({ ...formData, participantsIds: (formData.participantsIds || []).filter(id => id !== pId) });
    setConfirmModal({ isOpen: false, id: '', type: 'participant' });
  };

  const addDelegation = () => {
    if (!selectedMemberId || !selectedRole) return;
    
    const member = teamMembers.find(m => m.id === selectedMemberId);
    if (!member) return;

    // Evitar duplicatas
    const exists = formData.delegation?.some(d => d.memberId === selectedMemberId && d.role === selectedRole);
    if (exists) {
        alert("Este membro já está delegado para esta função neste estudo.");
        return;
    }

    const newDelegation: StudyDelegation = {
        memberId: member.id,
        memberName: member.name,
        role: selectedRole
    };

    setFormData({ ...formData, delegation: [...(formData.delegation || []), newDelegation] });
    setSelectedMemberId('');
    setSelectedRole('');
  };

  const executeRemoveDelegation = (memberId: string) => {
    setFormData({ 
        ...formData, 
        delegation: formData.delegation?.filter(d => d.memberId !== memberId) || [] 
    });
    setConfirmModal({ isOpen: false, id: '', type: 'delegation' });
  };

  const toggleStatus = () => {
    if (isView || isReadOnly) return; 
    setFormData(prev => ({
      ...prev,
      status: prev.status === 'Active' ? 'Closed' : 'Active'
    }));
  };

  // Handlers para salvamento dos Modais de Cadastro Rápido
  const handleSavePI = async (newPI: Partial<TeamMember>) => {
    // Força a função para PI se for criado pelo atalho de PI
    const memberToSave = { ...newPI, role: newPI.role || 'Investigador Principal' };
    const saved = await db.upsert('team-members', memberToSave);
    await fetchDropdownData(); // Recarrega listas
    handleChange('pi', saved.name || ''); // Seleciona o novo PI
    setActiveModal(null);
  };

  const handleSaveSponsor = async (newSponsor: Partial<Sponsor>) => {
    await db.upsert('sponsors', newSponsor);
    await fetchDropdownData();
    if (activeModal === 'sponsor') handleChange('sponsor', newSponsor.name || '');
    if (activeModal === 'cro') handleChange('cro', newSponsor.name || ''); // CRO usa mesma tabela
    setActiveModal(null);
  };

  const handleSaveTeamMember = async (newMember: Partial<TeamMember>) => {
    const saved = await db.upsert('team-members', newMember);
    
    // Atualiza a lista de membros da equipe localmente para refletir imediatamente
    setTeamMembers(prev => {
        const newList = [...prev, saved as TeamMember];
        return newList.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i).sort((a,b) => a.name.localeCompare(b.name));
    });
    
    await fetchDropdownData();
    setSelectedMemberId(saved.id);
    setActiveModal(null);
  };

  const handleSaveCoordinator = async (newMember: Partial<TeamMember>) => {
    // Força a função para coordenador se não estiver
    const memberToSave = { ...newMember, role: 'Coordenador de estudos' };
    const saved = await db.upsert('team-members', memberToSave);
    
    // Atualiza a lista de coordenadores localmente para refletir imediatamente
    setCoordinatorList(prev => {
        const newList = [...prev, saved.name];
        return newList.filter((v, i, a) => a.indexOf(v) === i).sort();
    });
    setTeamMembers(prev => {
        const newList = [...prev, saved as TeamMember];
        return newList.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i).sort((a,b) => a.name.localeCompare(b.name));
    });
    
    await fetchDropdownData();
    handleChange('coordinator', saved.name || '');
    setActiveModal(null);
  };

  const handleSaveMonitor = async (data: Partial<MonitorEntry>) => {
    const saved = await db.upsert('monitors', data);
    
    // Atualiza a lista de monitores localmente para refletir imediatamente
    setMonitorList(prev => {
        const newList = [...prev, saved as MonitorEntry];
        return newList.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    });
    
    await fetchDropdownData();
    const allMonitors = await db.getAll<MonitorEntry>('monitors');
    const monitor = allMonitors.find(m => m.id === saved.id);
    if (monitor && !formData.monitors?.find(m => m.id === monitor.id)) {
      setFormData(prev => ({ ...prev, monitors: [...(prev.monitors || []), monitor] }));
    }
    setActiveModal(null);
  };

  const handleSaveParticipant = async (data: Partial<Patient>) => {
    const saved = await db.upsert('patients', data);
    
    // Atualiza a lista de participantes localmente para refletir imediatamente
    setParticipantList(prev => {
        const newList = [...prev, saved as Patient];
        return newList.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    });
    
    await fetchDropdownData();
    const current = formData.participantsIds || [];
    if (!current.includes(saved.id)) {
      setFormData(prev => ({ ...prev, participantsIds: [...current, saved.id] }));
    }
    setActiveModal(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const linkedParticipants = participantList.filter(p => formData.participantsIds?.includes(p.id));
  const isActive = formData.status === 'Active';

  const performValidationAndSave = async (): Promise<boolean> => {
    if (!formData.name) {
      alert('O campo Nome é obrigatório.');
      return false;
    }
    if (!formData.protocol) {
      alert('O campo Protocolo é obrigatório.');
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
          {isView ? 'Visualização de Dados do Estudo' : 'Cadastro de Dados do Estudo'}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Linha 1 */}
            <StudyInput label="Nome Estudo" value={formData.name} onChange={(v: string) => handleChange('name', v.toUpperCase())} isView={isView} span="md:col-span-2" />
            <StudyInput label="Protocolo" value={formData.protocol} onChange={(v: string) => handleChange('protocol', v)} isView={isView} />
            <StudyInput label="Centro Coordenador" value={formData.coordinatorCenter} onChange={(v: string) => handleChange('coordinatorCenter', v)} options={['SIM', 'NÃO']} isForcedDropdown isView={isView} />
            
            {/* Linha 2 */}
            <StudyInput 
              label="Patrocinador" 
              value={formData.sponsor} 
              onChange={(v: string) => handleChange('sponsor', v)} 
              options={sponsorList} 
              isForcedDropdown 
              isView={isView} 
              onAdd={() => setActiveModal('sponsor')}
            />
            <StudyInput 
              label="PI" 
              value={formData.pi} 
              onChange={(v: string) => handleChange('pi', v)} 
              options={piList} 
              isForcedDropdown 
              isView={isView} 
              span="md:col-span-2" 
              onAdd={() => setActiveModal('pi')}
            />
            <StudyInput 
              label="CRO/PAGADOR" 
              value={formData.cro} 
              onChange={(v: string) => handleChange('cro', v)} 
              options={croList} 
              isForcedDropdown 
              isView={isView} 
              onAdd={() => setActiveModal('cro')}
            />
            
            {/* Linha 3 */}
            <StudyInput label="Patologia" value={formData.pathology} onChange={(v: string) => handleChange('pathology', v)} isView={isView} span="md:col-span-2" />
            <StudyInput 
              label="Coord. de estudos" 
              value={formData.coordinator} 
              onChange={(v: string) => handleChange('coordinator', v)} 
              options={coordinatorList}
              isForcedDropdown 
              isView={isView} 
            />
            <StudyInput label="Recrutamento" value={formData.recruitment} onChange={(v: string) => handleChange('recruitment', v)} options={DROPDOWN_OPTIONS.recruitmentStatus} isForcedDropdown isView={isView} />
          </div>
        </section>

        <section>
          <SectionTitle title="REGULATÓRIO" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <StudyInput label="C.A.A.E" value={formData.regulatoryCAAE} onChange={(v: string) => handleChange('regulatoryCAAE', v)} isView={isView} />
            <StudyInput label="Nº Centro" value={formData.regulatoryCenterNumber} onChange={(v: string) => handleChange('regulatoryCenterNumber', v)} isView={isView} />
            <div className="md:col-span-2">
              <StudyInput label="Obs.:" value={formData.regulatoryObs} onChange={(v: string) => handleChange('regulatoryObs', v)} isView={isView} />
            </div>
            <div className="md:col-span-2">
              <StudyInput label="Plataforma de Distribuição de SUSAR / CIOM" value={formData.regulatorySusarPlatform} onChange={(v: string) => handleChange('regulatorySusarPlatform', v)} isView={isView} />
            </div>
          </div>
        </section>

        <section>
          <SectionTitle title="ÍNDICES" />
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <StudyInput label="Data Rec. Feasibility" type="date" value={formData.feasibilityReceptionDate} onChange={(v: string) => handleChange('feasibilityReceptionDate', v)} isView={isView} />
            <StudyInput label="Data Assin. Feasibility" type="date" value={formData.feasibilitySigningDate} onChange={(v: string) => handleChange('feasibilitySigningDate', v)} isView={isView} />
            <StudyInput label="Aviso Centro Selec." type="date" value={formData.centerSelectionNoticeDate} onChange={(v: string) => handleChange('centerSelectionNoticeDate', v)} isView={isView} />
            <StudyInput label="Data Rec. Contrato" type="date" value={formData.contractReceptionDate} onChange={(v: string) => handleChange('contractReceptionDate', v)} isView={isView} />
            <StudyInput label="Data Assin. Contrato" type="date" value={formData.contractSigningDate} onChange={(v: string) => handleChange('contractSigningDate', v)} isView={isView} />
            <StudyInput label="Rec. Dossiê inicial" type="date" value={formData.initialDossierReceptionDate} onChange={(v: string) => handleChange('initialDossierReceptionDate', v)} isView={isView} />
            
            <StudyInput label="Sub. Dossiê Inicial" type="date" value={formData.initialDossierSubmissionDate} onChange={(v: string) => handleChange('initialDossierSubmissionDate', v)} isView={isView} />
            <StudyInput label="Data Aceite do CEP" type="date" value={formData.cepAcceptanceDate} onChange={(v: string) => handleChange('cepAcceptanceDate', v)} isView={isView} />
            <StudyInput label="Aprov. Parecer Inicial" type="date" value={formData.initialOpinionApprovalDate} onChange={(v: string) => handleChange('initialOpinionApprovalDate', v)} isView={isView} />
            <StudyInput label="Ativação do Centro" type="date" value={formData.centerActivationDate} onChange={(v: string) => handleChange('centerActivationDate', v)} isView={isView} />
            <StudyInput label="Data 01º Participante" type="date" value={formData.firstParticipantDate} onChange={(v: string) => handleChange('firstParticipantDate', v)} isView={isView} />
            <StudyInput label="Data 01º Randomizado" type="date" value={formData.firstRandomizedDate} onChange={(v: string) => handleChange('firstRandomizedDate', v)} isView={isView} />
            
            <StudyInput label="Data Parecer R. FINAL" type="date" value={formData.finalOpinionDate} onChange={(v: string) => handleChange('finalOpinionDate', v)} isView={isView} />
          </div>
        </section>

        <section>
          <SectionTitle title="MONITÓRIA" />
          {!isView && !isReadOnly && (
            <div className="mb-4 flex gap-2">
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-[#007b63]" onChange={(e) => addMonitor(e.target.value)} value="">
                <option value="">Vincular Monitor...</option>
                {[...monitorList].sort((a,b) => a.name.localeCompare(b.name)).map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
              </select>
              <button 
                onClick={() => setActiveModal('monitor')}
                className="bg-[#007b63] text-white px-4 py-2 rounded-md font-bold hover:bg-[#005a48] transition-colors flex items-center justify-center"
                title="Novo Monitor"
              >
                +
              </button>
            </div>
          )}
          <div className="overflow-hidden border rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#007b63] text-white">
                <tr>
                  <th className="px-4 py-2">Monitor(a)</th>
                  <th className="px-4 py-2">Função</th>
                  <th className="px-4 py-2">E-mail</th>
                  {!isView && !isReadOnly && <th className="px-4 py-2 text-right">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {formData.monitors?.map(m => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">{m.name}</td>
                    <td className="px-4 py-3">{m.role}</td>
                    <td className="px-4 py-3">{m.email}</td>
                    {!isView && !isReadOnly && <td className="px-4 py-3 text-right"><button onClick={() => setConfirmModal({ isOpen: true, id: m.id, type: 'monitor' })} className="text-red-500 font-bold text-[10px] uppercase">Remover</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionTitle title="PARTICIPANTES" />
          {!isView && !isReadOnly && (
            <div className="mb-4 flex gap-2">
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-[#007b63]" onChange={(e) => toggleParticipant(e.target.value)} value="">
                <option value="">Vincular Participante...</option>
                {[...participantList].sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.participantNumber})</option>
                ))}
              </select>
              <button 
                onClick={() => setActiveModal('participant')}
                className="bg-[#007b63] text-white px-4 py-2 rounded-md font-bold hover:bg-[#005a48] transition-colors flex items-center justify-center"
                title="Novo Participante"
              >
                +
              </button>
            </div>
          )}
          <div className="overflow-hidden border rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#007b63] text-white">
                <tr>
                  <th className="px-4 py-2">Nome Participante</th>
                  <th className="px-4 py-2">Data Nasc.</th>
                  <th className="px-4 py-2">Contato</th>
                  <th className="px-4 py-2">Data Assin. TCLE</th>
                  {!isView && !isReadOnly && <th className="px-4 py-2 text-right">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {linkedParticipants.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{formatDate(p.birthDate)}</td>
                    <td className="px-4 py-3">{p.contact || '-'}</td>
                    <td className="px-4 py-3">{formatDate(p.tcleDate)}</td>
                    {!isView && !isReadOnly && <td className="px-4 py-3 text-right"><button onClick={() => toggleParticipant(p.id)} className="text-red-500 font-bold text-[10px] uppercase">Remover</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionTitle title="ENFERMAGEM" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <StudyInput label="Via Medicação" value={formData.medicationRoute} onChange={(v: string) => handleChange('medicationRoute', v)} options={DROPDOWN_OPTIONS.medicationRoutes} isForcedDropdown isView={isView} />
            <StudyInput label="Tipo de Estudo" value={formData.studyType} onChange={(v: string) => handleChange('studyType', v)} options={DROPDOWN_OPTIONS.studyTypes} isForcedDropdown isView={isView} />
          </div>
        </section>
      </div>

      <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center px-8 py-6 shrink-0 mt-auto shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        
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
             {isActive ? 'Estudo Ativo' : 'Estudo Inativo'}
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

      {/* OVERLAY MODALS PARA CADASTRO RÁPIDO */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl relative">
             {activeModal === 'pi' && (
                <TeamForm 
                  mode="edit" 
                  onSave={handleSavePI} 
                  onCancel={() => setActiveModal(null)} 
                />
             )}
             
             {(activeModal === 'sponsor' || activeModal === 'cro') && (
                <SponsorForm 
                  mode="edit" 
                  studies={[]} // Não precisamos vincular estudos aqui, apenas criar a entidade
                  onSave={handleSaveSponsor} 
                  onCancel={() => setActiveModal(null)} 
                />
             )}

             {activeModal === 'coordinator' && (
                <TeamForm 
                  mode="edit" 
                  onSave={handleSaveCoordinator} 
                  onCancel={() => setActiveModal(null)} 
                />
             )}

             {activeModal === 'teamMember' && (
                <TeamForm 
                  mode="edit" 
                  onSave={handleSaveTeamMember} 
                  onCancel={() => setActiveModal(null)} 
                />
             )}

             {activeModal === 'monitor' && (
                <MonitorForm 
                  mode="edit" 
                  studies={[]}
                  onSave={handleSaveMonitor} 
                  onCancel={() => setActiveModal(null)} 
                />
             )}

             {activeModal === 'participant' && (
                <ParticipantForm 
                  mode="edit" 
                  studies={[]}
                  onSave={handleSaveParticipant} 
                  onCancel={() => setActiveModal(null)} 
                />
             )}
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title="Confirmar Remoção"
        message={`Deseja realmente remover este item (${confirmModal.type === 'monitor' ? 'monitor' : confirmModal.type === 'delegation' ? 'membro delegado' : 'participante'}) do estudo?`}
        onConfirm={() => {
            if (confirmModal.type === 'monitor') executeRemoveMonitor(confirmModal.id);
            else if (confirmModal.type === 'delegation') executeRemoveDelegation(confirmModal.id);
            else executeRemoveParticipant(confirmModal.id);
        }}
        onCancel={() => setConfirmModal({ isOpen: false, id: '', type: 'monitor' })}
      />
    </div>
  );
};
