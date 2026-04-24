
import React, { useState, useEffect } from 'react';
import { Study, CEPMeeting, AppNotification, UserProfile } from '../types';
import { DROPDOWN_OPTIONS, CEP_DOCUMENT_OPTIONS, formatDatePTBR } from '../constants';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';

interface CEPMeetingViewProps {
  studies: Study[];
  isReadOnly?: boolean;
  onShowSuccess: (title: string, message: string) => void;
  onNavigate: (view: any) => void;
}

const InputField = ({ label, value, onChange, type = "text", readOnly = false }: any) => {
  const displayValue = readOnly && type === 'date' ? formatDatePTBR(value) : value;
  const inputType = readOnly && type === 'date' ? 'text' : type;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">{label}</label>
      <input 
        type={inputType} 
        className={`border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#007b63] ${readOnly ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
        value={displayValue || ''}
        onChange={e => onChange && onChange(e.target.value)}
        readOnly={readOnly}
      />
    </div>
  );
};

const SelectField = ({ label, value, onChange, options, disabled = false }: any) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">{label}</label>
    <select 
      className={`border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#007b63] ${disabled ? 'bg-gray-100 text-gray-500 pointer-events-none' : 'bg-white'}`}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">Selecione...</option>
      {options.map((o: any) => (
        typeof o === 'string' 
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  </div>
);

export const CEPMeetingView: React.FC<CEPMeetingViewProps> = ({ studies, isReadOnly = false, onShowSuccess, onNavigate }) => {
  const [meetings, setMeetings] = useState<CEPMeeting[]>([]);
  const [calendarDates, setCalendarDates] = useState<string[]>([]);
  const [docOptions, setDocOptions] = useState<string[]>([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [editDocName, setEditDocName] = useState('');
  const [formData, setFormData] = useState<Partial<CEPMeeting>>({});
  
  // Controle de expansão da linha
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Load data
  useEffect(() => {
    fetchMeetings();
    fetchCalendarDates();
    fetchDocOptions();
  }, []);

  const fetchDocOptions = async () => {
    let docs = await db.getAll<{id: string, name: string}>('cepDocuments');
    
    // Se a coleção estiver completamente vazia, inicializar com os padrões (apenas uma vez)
    if (docs.length === 0) {
      const initializedFlag = localStorage.getItem('cep_docs_initialized');
      if (!initializedFlag) {
        for (const docName of CEP_DOCUMENT_OPTIONS) {
          await db.upsert('cepDocuments', { id: docName, name: docName });
        }
        localStorage.setItem('cep_docs_initialized', 'true');
        docs = await db.getAll<{id: string, name: string}>('cepDocuments');
      }
    }
    
    const dynamicNames = docs.map(d => d.name);
    const combined = Array.from(new Set(dynamicNames)).sort((a,b) => a.localeCompare(b));
    setDocOptions(combined);
  };

  const handleEditDocName = async (oldName: string, newName: string) => {
    if (oldName === newName || !newName.trim()) {
      setEditingDoc(null);
      return;
    }
    const cleanNewName = newName.trim();
    
    // 1. Update in cepDocuments
    await db.delete('cepDocuments', oldName);
    await db.upsert('cepDocuments', { id: cleanNewName, name: cleanNewName });

    // 2. Cascade in Meetings
    const allMeetings = await db.getAll<CEPMeeting>('cepMeetings');
    for (const m of allMeetings) {
      if (m.selectedDocuments?.includes(oldName)) {
        m.selectedDocuments = m.selectedDocuments.map(d => d === oldName ? cleanNewName : d);
        await db.upsert('cepMeetings', m);
      }
    }

    // 3. Cascade in user profiles perms
    const profiles = await db.getAll<{ id: string, name: string, permissions?: string[] }>('userProfiles');
    for (const p of profiles) {
      if (p.permissions?.includes(`doc_notify_${oldName}`)) {
        p.permissions = p.permissions.map(perm => perm === `doc_notify_${oldName}` ? `doc_notify_${cleanNewName}` : perm);
        await db.upsert('userProfiles', p);
      }
    }

    setEditingDoc(null);
    fetchDocOptions();
    fetchMeetings();
  };

  const handleDeleteDocName = async (docName: string) => {
    console.log("handleDeleteDocName called for:", docName);
    // 1. Remove from cepDocuments
    await db.delete('cepDocuments', docName);

    // 2. Cascade remove in Meetings
    const allMeetings = await db.getAll<CEPMeeting>('cepMeetings');
    for (const m of allMeetings) {
      if (m.selectedDocuments?.includes(docName)) {
        m.selectedDocuments = m.selectedDocuments.filter(d => d !== docName);
        await db.upsert('cepMeetings', m);
      }
    }

    // 3. Cascade remove in user profiles perms
    const profiles = await db.getAll<{ id: string, name: string, permissions?: string[] }>('userProfiles');
    for (const p of profiles) {
      if (p.permissions?.includes(`doc_notify_${docName}`)) {
        p.permissions = p.permissions.filter(perm => perm !== `doc_notify_${docName}`);
        await db.upsert('userProfiles', p);
      }
    }

    console.log("Finished deleting, now fetching doc options...");
    await fetchDocOptions();
    await fetchMeetings();
  };


  const fetchMeetings = async () => {
    const data = await db.getAll<CEPMeeting>('cepMeetings');
    setMeetings(data);
  };

  const fetchCalendarDates = async () => {
    const data = await db.getAll<any>('cepCalendar');
    // Extract unique dates properly sorting them
    const dates = Array.from(new Set(data.map(d => d.meetingDate).filter(Boolean))).sort((a,b) => a.localeCompare(b));
    setCalendarDates(dates);
  };

  // Auto-fill CAAE based on Study
  useEffect(() => {
    if (formData.studyId) {
      const study = studies.find(s => s.id === formData.studyId);
      if (study) {
        setFormData(prev => ({ ...prev, caae: study.caae || '' }));
      }
    }
  }, [formData.studyId, studies]);

  // Calculate Business Days
  useEffect(() => {
    if (formData.acceptanceDate && formData.approvalDate) {
      const start = new Date(formData.acceptanceDate);
      const end = new Date(formData.approvalDate);
      
      let count = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const dayOfWeek = cur.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        cur.setDate(cur.getDate() + 1);
      }
      setFormData(prev => ({ ...prev, businessDays: count.toString() }));
    }
  }, [formData.acceptanceDate, formData.approvalDate]);

  const generateNotificationsForApprovedAmendment = async (meeting: CEPMeeting) => {
    if (meeting.cepApproval !== 'APROVADO') return;

    const selectedDocs = meeting.selectedDocuments || [];
    if (selectedDocs.length === 0) return;

    const studyName = studies.find(s => s.id === meeting.studyId)?.name || 'Estudo desconhecido';
    const amendmentName = meeting.amendment || 'Emenda';
    const targetProfiles = new Set<string>();

    const allProfiles = await db.getAll<{ id: string, name: string, permissions?: string[] }>('userProfiles');

    // Add Admin and Developer explicitly if we want to default to them, or we can just rely on profiles.
    allProfiles.forEach(profile => {
      const perms = profile.permissions || [];
      selectedDocs.forEach(doc => {
        if (perms.includes(`doc_notify_${doc}`)) {
          targetProfiles.add(profile.name);
        }
      });
    });

    if (targetProfiles.size > 0) {
      const notification: AppNotification = {
        id: Math.random().toString(36).substr(2, 9),
        title: 'Aprovação de Emenda',
        message: `A emenda "${amendmentName}" do estudo "${studyName}" foi APROVADA. Documentos relevantes disponíveis.`,
        date: new Date().toLocaleDateString('pt-BR'),
        read: false,
        targetProfiles: Array.from(targetProfiles) as UserProfile[]
      };
      
      await db.upsert('notifications', notification);
    }
  };

  const handleRegister = async () => {
    if (isReadOnly) return;
    if (!formData.studyId || !formData.date || !formData.category) {
       alert("Preencha os campos obrigatórios.");
       return;
    }

    const isUpdate = !!formData.id;
    // Verificar se o estado anterior não era aprovado para evitar spam de notificações
    const oldMeeting = meetings.find(m => m.id === formData.id);
    const becameApproved = formData.cepApproval === 'APROVADO' && oldMeeting?.cepApproval !== 'APROVADO';

    const newMeeting: CEPMeeting = {
      ...formData as CEPMeeting,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      businessDays: formData.businessDays || '0'
    };

    await db.upsert('cepMeetings', newMeeting);
    
    // Gerar notificações se acabou de ser aprovado
    if (becameApproved) {
      await generateNotificationsForApprovedAmendment(newMeeting);
    }

    await fetchMeetings();
    setFormData({});
    onShowSuccess(isUpdate ? 'Atualizado com Sucesso!' : 'Cadastrado com Sucesso!', isUpdate ? 'Registro de Reunião CEP atualizado.' : 'Novo registro de Reunião CEP criado.');
  };

  const handleEdit = (meeting: CEPMeeting) => {
    if (isReadOnly) return;
    setFormData(meeting);
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    setModalConfig({
      isOpen: true,
      title: 'Excluir Reunião CEP',
      message: 'Tem certeza que deseja excluir este registro de Reunião CEP?',
      onConfirm: async () => {
        await db.delete('cepMeetings', id);
        await fetchMeetings();
        if (formData.id === id) setFormData({});
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        onShowSuccess('Removido com Sucesso!', 'O registro foi excluído permanentemente.');
      }
    });
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  // Move item da esquerda (disponível) para direita (selecionado) e vice-versa
  const toggleDocumentSelection = async (meeting: CEPMeeting, doc: string) => {
    if (isReadOnly) return;
    
    const currentSelection = meeting.selectedDocuments || [];
    let newSelection;

    // Se já estiver selecionado, remove. Se não, adiciona.
    if (currentSelection.includes(doc)) {
      newSelection = currentSelection.filter(d => d !== doc);
    } else {
      newSelection = [...currentSelection, doc];
    }

    const updatedMeeting = { ...meeting, selectedDocuments: newSelection };
    
    // Atualiza localmente para feedback instantâneo
    setMeetings(prev => prev.map(m => m.id === meeting.id ? updatedMeeting : m));
    
    // Persiste no banco
    await db.upsert('cepMeetings', updatedMeeting);
  };

  const activeStudies = studies.filter(s => s.status === 'Active').sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-6 bg-white/90 rounded-3xl shadow-2xl border border-gray-100 overflow-y-auto max-h-full scrollbar-thin relative">
      <ConfirmationModal
         isOpen={modalConfig.isOpen}
         title={modalConfig.title}
         message={modalConfig.message}
         onConfirm={modalConfig.onConfirm}
         onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* FORM */}
      <div className={`p-6 bg-[#d1e7e4]/20 rounded-2xl border border-[#007b63]/10 flex-shrink-0 ${isReadOnly ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center mb-6 border-b border-[#007b63]/20 pb-2">
           <h3 className="text-[#007b63] font-black uppercase text-xs tracking-widest">Registro de Reunião CEP</h3>
           <button 
             onClick={() => onNavigate('CEPCalendar')}
             className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase hover:bg-[#00604d] transition-colors"
           >
             Calendário de reuniões do CEP
           </button>
        </div>
        
        {/* SEÇÃO EMENDA */}
        <div className="mb-4">
          <h4 className="text-[10px] font-bold text-[#007b63] uppercase mb-2">Emenda</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SelectField label="Data da Reunião CEP" value={formData.date} options={calendarDates.map(d => ({id: d, name: formatDatePTBR(d)}))} onChange={(v: string) => setFormData({...formData, date: v})} disabled={isReadOnly} />
            <SelectField label="Categoria" value={formData.category} options={DROPDOWN_OPTIONS.cepCategories} onChange={(v: string) => setFormData({...formData, category: v})} disabled={isReadOnly} />
            <SelectField label="Estudo" value={formData.studyId} options={activeStudies.map(s => ({id: s.id, name: s.name}))} onChange={(v: string) => setFormData({...formData, studyId: v})} disabled={isReadOnly} />
            <InputField label="C.A.A.E" value={formData.caae} readOnly />
            <InputField label="Emenda" value={formData.amendment} onChange={(v: string) => setFormData({...formData, amendment: v})} readOnly={isReadOnly} />
            <InputField label="Linha PB" value={formData.pbLine} onChange={(v: string) => setFormData({...formData, pbLine: v})} readOnly={isReadOnly} />
            <SelectField label="Treinamento" value={formData.training} options={DROPDOWN_OPTIONS.cepTraining} onChange={(v: string) => setFormData({...formData, training: v})} disabled={isReadOnly} />
            <SelectField label="Aprovação do CEP" value={formData.cepApproval} options={DROPDOWN_OPTIONS.cepApproval} onChange={(v: string) => setFormData({...formData, cepApproval: v})} disabled={isReadOnly} />
          </div>
        </div>

        {/* SEÇÃO INDICE */}
        <div className="mb-4 pt-4 border-t border-gray-200">
           <h4 className="text-[10px] font-bold text-[#007b63] uppercase mb-2">Índice</h4>
           <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
             <InputField label="Data da Submissão" type="date" value={formData.submissionDate} onChange={(v: string) => setFormData({...formData, submissionDate: v})} readOnly={isReadOnly} />
             <InputField label="Data Aceite CEP" type="date" value={formData.acceptanceDate} onChange={(v: string) => setFormData({...formData, acceptanceDate: v})} readOnly={isReadOnly} />
             <InputField label="Data da Reunião" type="date" value={formData.indexMeetingDate} onChange={(v: string) => setFormData({...formData, indexMeetingDate: v})} readOnly={isReadOnly} />
             <InputField label="Data Aprovação Parecer" type="date" value={formData.approvalDate} onChange={(v: string) => setFormData({...formData, approvalDate: v})} readOnly={isReadOnly} />
             <InputField label="Dias Úteis Aguard. Aprov." value={formData.businessDays} readOnly />
             <InputField label="Data Última Verificação" type="date" value={formData.lastVerificationDate} onChange={(v: string) => setFormData({...formData, lastVerificationDate: v})} readOnly={isReadOnly} />
           </div>
        </div>

        {!isReadOnly && (
          <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setFormData({})} className="px-4 py-2 text-gray-500 text-xs font-bold uppercase hover:bg-gray-100 rounded-lg">Limpar</button>
              <button onClick={handleRegister} className="bg-[#007b63] text-white px-8 py-2 rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-[#005a48] transition-colors">
                {formData.id ? 'Atualizar' : 'Salvar'}
              </button>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="overflow-hidden border rounded-2xl bg-white shadow-sm flex-shrink-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#007b63] text-white uppercase tracking-tighter sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 w-8"></th>
                <th className="px-3 py-3 whitespace-nowrap">Data Reunião</th>
                <th className="px-3 py-3 whitespace-nowrap">Categoria</th>
                <th className="px-3 py-3 whitespace-nowrap">Estudo</th>
                <th className="px-3 py-3 whitespace-nowrap">C.A.A.E</th>
                <th className="px-3 py-3 whitespace-nowrap">Emenda</th>
                <th className="px-3 py-3 whitespace-nowrap">Linha PB</th>
                <th className="px-3 py-3 whitespace-nowrap">Aprovação CEP</th>
                <th className="px-3 py-3 whitespace-nowrap">Dias Úteis</th>
                <th className="px-3 py-3 whitespace-nowrap">Treinamento</th>
                <th className="px-3 py-3 whitespace-nowrap">Data Últ. Ver.</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-600">
              {meetings.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center italic text-gray-400">Nenhuma reunião registrada.</td>
                </tr>
              ) : (
                meetings.map(m => {
                  const isExpanded = expandedRowId === m.id;
                  const selectedDocs = m.selectedDocuments || [];
                  const availableDocs = docOptions.filter(doc => !selectedDocs.includes(doc));

                  return (
                    <React.Fragment key={m.id}>
                      <tr 
                        className={`transition-colors cursor-pointer ${isExpanded ? 'bg-[#007b63]/5 border-l-4 border-l-[#007b63]' : 'hover:bg-gray-50'}`}
                        onClick={() => toggleRowExpansion(m.id)}
                      >
                        <td className="px-3 py-3 text-center">
                          <svg className={`w-3 h-3 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                        <td className="px-3 py-3 font-medium">{formatDatePTBR(m.date)}</td>
                        <td className="px-3 py-3">{m.category}</td>
                        <td className="px-3 py-3 font-bold text-gray-800">{studies.find(s => s.id === m.studyId)?.name || 'N/A'}</td>
                        <td className="px-3 py-3">{m.caae}</td>
                        <td className="px-3 py-3">{m.amendment}</td>
                        <td className="px-3 py-3">{m.pbLine || '-'}</td>
                        <td className="px-3 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{m.cepApproval || '-'}</span></td>
                        <td className="px-3 py-3 text-center">{m.businessDays}</td>
                        <td className="px-3 py-3">{m.training}</td>
                        <td className="px-3 py-3">{m.lastVerificationDate ? formatDatePTBR(m.lastVerificationDate) : '-'}</td>
                        <td className="px-3 py-3 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {!isReadOnly && (
                            <>
                              <button onClick={() => handleEdit(m)} title="Editar" className="text-blue-500 font-bold hover:underline uppercase text-[10px]">
                                Editar
                              </button>
                              <button onClick={() => handleDelete(m.id)} title="Excluir" className="text-red-500 font-bold hover:underline uppercase text-[10px]">
                                Excluir
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                      {!isExpanded && (
                        <tr onClick={() => toggleRowExpansion(m.id)} className="cursor-pointer hover:bg-gray-50 border-b-0">
                          <td colSpan={12} className="px-3 py-1 text-center bg-gray-50/50">
                            <span className="text-[9px] text-gray-400 italic">Clique na linha para visualizar ou adicionar os documentos da emenda</span>
                          </td>
                        </tr>
                      )}
                      
                      {/* DETAIL ROW */}
                      {isExpanded && (
                        <tr className="bg-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
                          <td colSpan={12} className="px-8 py-6 border-b border-gray-200">
                            <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Documentos da Emenda</h5>
                                {!isReadOnly && (
                                  <button
                                    onClick={() => setIsDocModalOpen(true)}
                                    className="bg-[#007b63] text-white px-3 py-1.5 rounded-lg shadow-sm font-bold text-[10px] uppercase hover:bg-[#00604d] transition-colors"
                                  >
                                    + Documentos
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-8">
                                {/* Left Column: Available Documents */}
                                <div className="border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-64">
                                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 font-bold text-xs text-gray-600 uppercase flex justify-between">
                                    <span>Itens Disponíveis</span>
                                    <span className="text-[10px] bg-gray-200 px-1.5 rounded">{availableDocs.length}</span>
                                  </div>
                                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                    {availableDocs.length === 0 && <p className="text-center text-xs text-gray-400 mt-10 italic">Todos os itens selecionados.</p>}
                                    {availableDocs.map(doc => (
                                      <label key={doc} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer group transition-colors">
                                        <div className="relative flex items-center justify-center">
                                          <input 
                                            type="checkbox" 
                                            className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded checked:bg-[#007b63] checked:border-[#007b63] transition-all"
                                            checked={false}
                                            onChange={() => toggleDocumentSelection(m, doc)}
                                            disabled={isReadOnly}
                                          />
                                          <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{doc}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* Right Column: Selected Documents */}
                                <div className="border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-64">
                                  <div className="bg-[#d1e7e4] px-4 py-2 border-b border-[#007b63]/20 font-bold text-xs text-[#007b63] uppercase flex justify-between">
                                    <span>Itens Selecionados</span>
                                    <span className="text-[10px] bg-white px-1.5 rounded text-[#007b63]">{selectedDocs.length}</span>
                                  </div>
                                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                    {selectedDocs.length === 0 && <p className="text-center text-xs text-gray-400 mt-10 italic">Nenhum documento selecionado.</p>}
                                    {selectedDocs.sort().map(doc => (
                                      <label key={doc} className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-red-50 rounded cursor-pointer group transition-colors border border-transparent hover:border-red-100">
                                        <div className="relative flex items-center justify-center">
                                          <input 
                                            type="checkbox" 
                                            className="peer appearance-none w-4 h-4 border-2 border-[#007b63] bg-[#007b63] rounded checked:bg-red-500 checked:border-red-500 transition-all"
                                            checked={true}
                                            onChange={() => toggleDocumentSelection(m, doc)}
                                            disabled={isReadOnly}
                                          />
                                          <svg className="absolute w-3 h-3 text-white peer-checked:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                          <svg className="absolute w-3 h-3 text-white hidden peer-checked:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 group-hover:text-red-600">{doc}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CONFIG DE DOCUMENTOS */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsDocModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-[#007b63] p-6 text-white shrink-0 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter">Gerenciar Documentos</h2>
              <button onClick={() => setIsDocModalOpen(false)} className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-4 items-end mb-6">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1 mb-1 block">Nome do Documento</label>
                  <input 
                    type="text" 
                    className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] w-full"
                    placeholder="Ex: Brochura do Investigador"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newDocName.trim()) {
                        e.preventDefault();
                        const docObj = { id: newDocName.trim(), name: newDocName.trim() };
                        await db.upsert('cepDocuments', docObj);
                        setNewDocName('');
                        fetchDocOptions();
                      }
                    }}
                  />
                </div>
                <button 
                  onClick={async () => {
                    if (newDocName.trim()) {
                      const docObj = { id: newDocName.trim(), name: newDocName.trim() };
                      await db.upsert('cepDocuments', docObj);
                      setNewDocName('');
                      fetchDocOptions();
                    }
                  }}
                  className="bg-[#007b63] text-white px-6 py-3 rounded-xl font-bold uppercase text-xs shadow-md hover:bg-[#005a48] transition-colors h-[46px]"
                >
                  Adicionar
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 sticky top-0">
                    <tr><th className="px-4 py-2 text-xs font-bold uppercase">Documentos Cadastrados</th><th className="px-4 py-2 w-20 text-right">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {docOptions.map(doc => (
                      <tr key={doc} className="hover:bg-gray-50">
                        {editingDoc === doc ? (
                          <td className="px-4 py-2">
                            <input 
                              type="text" 
                              className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[#007b63] w-full"
                              value={editDocName}
                              onChange={(e) => setEditDocName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditDocName(doc, editDocName);
                                if (e.key === 'Escape') setEditingDoc(null);
                              }}
                              autoFocus
                            />
                          </td>
                        ) : (
                          <td className="px-4 py-2 text-gray-700">{doc}</td>
                        )}
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            {editingDoc === doc ? (
                              <>
                                <button className="text-green-600 hover:bg-green-50 p-1.5 rounded" onClick={() => handleEditDocName(doc, editDocName)} title="Salvar">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <button className="text-red-500 hover:bg-red-50 p-1.5 rounded" onClick={() => setEditingDoc(null)} title="Cancelar">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingDoc(doc);
                                    setEditDocName(doc);
                                  }}
                                  className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"
                                  title="Editar"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button 
                                  onClick={() => {
                                    setModalConfig({
                                      isOpen: true,
                                      title: 'Excluir Documento',
                                      message: `Tem certeza que deseja excluir o documento ${doc}?`,
                                      onConfirm: async () => {
                                        await handleDeleteDocName(doc);
                                        setModalConfig(prev => ({ ...prev, isOpen: false }));
                                      }
                                    });
                                  }}
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                                  title="Excluir"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
