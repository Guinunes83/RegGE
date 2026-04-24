
import React, { useEffect, useState } from 'react';
import { Patient, Study, Consultation } from '../types';
import { DROPDOWN_OPTIONS } from '../constants';
import { db } from '../database';
import { UnsavedChangesModal, useUnsavedChanges } from './UnsavedChangesModal';
import { showValidation } from './ValidationModal';

interface ParticipantFormProps {
  patient?: Patient;
  studies: Study[];
  mode: 'edit' | 'view';
  onSave: (data: Partial<Patient>) => void;
  onCancel: () => void;
  onEdit?: () => void;
  isReadOnly?: boolean;
  onOpenMonitor?: () => void;
}

const ParticipantInput = ({ 
  label, 
  value, 
  onChange,
  isView,
  type = "text", 
  options,
  disabled = false,
  isTextArea = false,
  displayValue,
  required = false,
  placeholder,
  mask,
  span
}: any) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const valToShow = isView && displayValue ? displayValue : (isView && type === 'date' ? formatDate(value) : (value || ''));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let val = e.target.value;
    
    if (!isView && mask) {
      if (mask === 'cpf') {
        val = val.replace(/\D/g, '')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})/, '$1-$2')
          .substring(0, 14);
      } else if (mask === 'phone') {
        val = val.replace(/\D/g, '');
        if (val.length <= 10) val = val.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        else val = val.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        val = val.substring(0, 15);
      }
    }
    onChange(val);
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${span || ''}`}>
      <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">
        {label} {required && !isView && <span className="text-red-500">*</span>}
      </label>
      {isView ? (
        isTextArea ? (
           <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 min-h-[80px] whitespace-pre-wrap">{valToShow}</div>
        ) : (
           <input 
             type="text" 
             readOnly 
             className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 outline-none"
             value={valToShow}
           />
        )
      ) : options ? (
        <select 
          className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none"
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
        >
          <option value="">Selecione...</option>
          {[...options].sort((a: any, b: any) => {
            const valA = (a?.name || a || '').toString();
            const valB = (b?.name || b || '').toString();
            return valA.localeCompare(valB);
          }).map((o: any) => (
             <option key={o.id || o} value={o.id || o}>{o.name || o}</option>
          ))}
        </select>
      ) : isTextArea ? (
         <textarea 
           rows={3}
           className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none bg-white"
           value={value || ''}
           onChange={handleChange}
           placeholder={placeholder}
         />
      ) : (
        <input 
          type={type}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none transition-all bg-white"
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export const ParticipantForm: React.FC<ParticipantFormProps> = ({ patient, studies, mode, onSave, onCancel, onEdit, isReadOnly = false, onOpenMonitor }) => {
  const [formData, setFormData] = useState<Partial<Patient>>(patient || {});
  const [error, setError] = useState<string | null>(null);
  
  // States para histórico de consultas
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const isView = mode === 'view';

  // Load consultations
  useEffect(() => {
    if (patient && patient.id) {
        const loadHistory = async () => {
            const allConsultations = await db.getAll<Consultation>('consultations');
            const history = allConsultations
                .filter(c => c.patientId === patient.id)
                .sort((a,b) => b.date.localeCompare(a.date)); // Mais recente primeiro
            setConsultations(history);
        };
        loadHistory();
    }
  }, [patient]);

  // Auto-fill treatment based on Study when Study changes in Edit mode
  useEffect(() => {
    if (!isView && formData.studyId) {
      const selectedStudy = studies.find(s => s.id === formData.studyId);
      if (selectedStudy && !formData.treatment) {
        setFormData(prev => ({ ...prev, treatment: selectedStudy.pathology }));
      }
    }
  }, [formData.studyId, isView, studies]); 

  const performValidationAndSave = async (): Promise<boolean> => {
    setError(null);

    if (!formData.name) {
      showValidation("O campo Nome é obrigatório e precisa ser preenchido antes de salvar.");
      return false;
    }

    await onSave(formData);
    return true;
  };

  const { isModalOpen, handleSaveAndLeave, handleDiscard, handleCancel, bypassInterceptor } = useUnsavedChanges(!isView && !isReadOnly, performValidationAndSave);

  const validateAndSave = async () => {
    bypassInterceptor();
    await performValidationAndSave();
  };

  const handleCancelClick = () => {
    bypassInterceptor();
    onCancel();
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  const currentStudyName = studies.find(s => s.id === formData.studyId)?.name;
  
  // Filter only active studies for selection
  const studyOptions = studies
    .filter(s => s.status === 'Active')
    .map(s => ({ id: s.id, name: s.name }));

  const calculateBMI = (weight: string, height: string) => {
      const w = parseFloat(weight);
      const h = parseFloat(height) / 100; // converter cm para m
      if (w && h) return (w / (h * h)).toFixed(2);
      return '-';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-6xl mx-auto flex flex-col relative max-h-[90vh]">
      <UnsavedChangesModal 
        isOpen={isModalOpen}
        onSaveAndLeave={handleSaveAndLeave}
        onDiscardAndLeave={handleDiscard}
        onCancel={handleCancel}
      />
      <div className="bg-[#007b63] shrink-0 text-white py-4 px-6 flex justify-between items-center z-10 sticky top-0">
        <h2 className="text-xl font-bold tracking-tight">
          {isView ? 'Visualização de Dados Participante' : 'Cadastro de Dados Participante'}
        </h2>
        <div className="flex gap-2">
          {!isView && !isReadOnly && onOpenMonitor && (
            <button 
              onClick={onOpenMonitor}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors mr-4"
              title="Abrir Cadastro de Monitores"
            >
              + Novo Monitor
            </button>
          )}
          <button onClick={handleCancelClick} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-8 flex flex-col gap-8 overflow-y-auto bg-gray-50/50 flex-1">
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-xs font-bold rounded shadow-sm">
            {error}
          </div>
        )}

        {/* DADOS CADASTRAIS */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
             {/* Linha 1: -NOME COMPLETO x2, SEXOx1, DATA NASC.x1; */}
             <ParticipantInput 
               label="Nome Completo" 
               value={formData.name} 
               onChange={(v: string) => setFormData({...formData, name: v})} 
               isView={isView} 
               span="md:col-span-2"
               required
             />
             <ParticipantInput 
               label="Sexo" 
               value={formData.sex} 
               onChange={(v: string) => setFormData({...formData, sex: v as 'M' | 'F'})} 
               options={['M', 'F']}
               isView={isView}
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Data Nasc." 
               value={formData.birthDate} 
               onChange={(v: string) => setFormData({...formData, birthDate: v})} 
               type="date" 
               isView={isView} 
               span="md:col-span-1"
             />
             
             {/* Linha 2: -CONTATO PRINCIPALX1, CONTATO SECUNDARIOX1, E-MAILX2; */}
             <ParticipantInput 
               label="Contato Principal" 
               value={formData.contact} 
               onChange={(v: string) => setFormData({...formData, contact: v})} 
               isView={isView} 
               mask="phone"
               placeholder="(00) 00000-0000"
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Contato Secundário" 
               value={formData.secondaryContact} 
               onChange={(v: string) => setFormData({...formData, secondaryContact: v})} 
               isView={isView} 
               mask="phone"
               placeholder="(00) 00000-0000"
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="E-mail" 
               value={formData.email} 
               onChange={(v: string) => setFormData({...formData, email: v})} 
               isView={isView} 
               placeholder="exemplo@email.com"
               span="md:col-span-2"
             />

             {/* Linha 3: -ESTUDOX1, Nº SCREENINGX1, Nº RAND.X1, Nº NO ESTUDO; */}
             <ParticipantInput 
               label="Estudo" 
               value={formData.studyId} 
               onChange={(v: string) => setFormData({...formData, studyId: v})} 
               options={studyOptions} 
               displayValue={currentStudyName} 
               isView={isView} 
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Nº Screening" 
               value={formData.screeningNumber} 
               onChange={(v: string) => setFormData({...formData, screeningNumber: v})} 
               isView={isView} 
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Nº Rand." 
               value={formData.randomization} 
               onChange={(v: string) => setFormData({...formData, randomization: v})} 
               isView={isView}
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Nº No Estudo" 
               value={formData.participantNumber} 
               onChange={(v: string) => setFormData({...formData, participantNumber: v})} 
               isView={isView}
               span="md:col-span-1"
             />

             {/* Linha 4: -TRATAMENTOX2, STATUSX1, DATA ASSIN. TCLEX1; */}
             <ParticipantInput 
               label="Tratamento" 
               value={formData.treatment} 
               onChange={(v: string) => setFormData({...formData, treatment: v})} 
               isView={isView} 
               span="md:col-span-2"
             />
             <ParticipantInput 
               label="Status" 
               value={formData.status} 
               onChange={(v: string) => setFormData({...formData, status: v})} 
               options={DROPDOWN_OPTIONS.participantStatus} 
               isView={isView} 
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Data Assin. TCLE" 
               value={formData.tcleDate} 
               onChange={(v: string) => setFormData({...formData, tcleDate: v})} 
               type="date" 
               isView={isView} 
               span="md:col-span-1"
             />

             {/* Linha 5: -OBSERVAÇÃOX4; */}
             <div className="md:col-span-4">
               <ParticipantInput 
                 label="Observação" 
                 value={formData.observations} 
                 onChange={(v: string) => setFormData({...formData, observations: v})} 
                 isView={isView} 
                 isTextArea={true} 
               />
             </div>
          </div>
        </section>

        {/* HISTÓRICO DE CONSULTAS (APENAS VIEW MODE SE JÁ EXISTIR PACIENTE) */}
        {patient?.id && (
            <section className="border-t border-gray-200 pt-6">
                <h3 className="text-[#007b63] font-black uppercase text-xs tracking-widest mb-4 border-b border-[#007b63]/20 pb-2">
                    Histórico de Consultas & Sinais Vitais
                </h3>
                
                <div className="overflow-hidden border rounded-xl bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#007b63] text-white uppercase tracking-tighter">
                            <tr>
                                <th className="px-4 py-3 w-8"></th>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Hora</th>
                                <th className="px-4 py-3">Visita</th>
                                <th className="px-4 py-3">PA (mmHg)</th>
                                <th className="px-4 py-3">Peso (kg)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {consultations.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-6 text-center italic text-gray-400">Nenhuma consulta registrada para este paciente.</td></tr>
                            ) : (
                                consultations.map(c => {
                                    const isExpanded = expandedRowId === c.id;
                                    return (
                                        <React.Fragment key={c.id}>
                                            <tr 
                                                className={`transition-colors cursor-pointer ${isExpanded ? 'bg-[#007b63]/5 border-l-4 border-l-[#007b63]' : 'hover:bg-gray-50'}`}
                                                onClick={() => toggleRowExpansion(c.id)}
                                            >
                                                <td className="px-4 py-3 text-center">
                                                    <svg className={`w-3 h-3 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-gray-700">{c.date.split('-').reverse().join('/')}</td>
                                                <td className="px-4 py-3">{c.time}</td>
                                                <td className="px-4 py-3 font-medium text-[#007b63]">{c.visitName}</td>
                                                <td className="px-4 py-3">{c.systolicPressure}/{c.diastolicPressure}</td>
                                                <td className="px-4 py-3">{c.weight}</td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50 animate-in fade-in slide-in-from-top-1">
                                                    <td colSpan={6} className="px-8 py-4">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-gray-600">
                                                            <div className="flex flex-col border-r border-gray-200">
                                                                <span className="font-bold uppercase text-[10px] text-gray-400">Altura</span>
                                                                <span className="text-sm font-bold">{c.height} cm</span>
                                                            </div>
                                                            <div className="flex flex-col border-r border-gray-200">
                                                                <span className="font-bold uppercase text-[10px] text-gray-400">IMC (Calc)</span>
                                                                <span className="text-sm font-bold">{calculateBMI(c.weight, c.height)}</span>
                                                            </div>
                                                            <div className="flex flex-col border-r border-gray-200">
                                                                <span className="font-bold uppercase text-[10px] text-gray-400">Temperatura</span>
                                                                <span className="text-sm font-bold">{c.temperature || '-'} °C</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold uppercase text-[10px] text-gray-400">Freq. Cardíaca</span>
                                                                <span className="text-sm font-bold">{c.heartRate || '-'} bpm</span>
                                                            </div>
                                                            {c.observations && (
                                                                <div className="col-span-2 md:col-span-4 mt-2 pt-2 border-t border-gray-200">
                                                                    <span className="font-bold uppercase text-[10px] text-gray-400 block mb-1">Observações da Consulta</span>
                                                                    <p className="italic text-gray-800 bg-white p-2 rounded border border-gray-200">{c.observations}</p>
                                                                </div>
                                                            )}
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
            </section>
        )}

      </div>

      <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center px-8 py-6 shrink-0 mt-auto">
        <div>
          {!isView && !isReadOnly && onOpenMonitor && (
            <button 
              onClick={onOpenMonitor}
              className="text-[#007b63] font-bold text-xs uppercase hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Cadastrar Monitoria
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {isView || isReadOnly ? (
            <>
              <button onClick={handleCancelClick} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50">
                Fechar
              </button>
              {!isReadOnly && (
                <button onClick={onEdit} className="px-8 py-2 bg-[#007b63] text-white rounded-lg text-sm font-bold shadow-lg shadow-[#007b63]/20 hover:bg-[#005a48]">
                  Editar
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={handleCancelClick} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={validateAndSave} className="px-8 py-2 bg-[#007b63] text-white rounded-lg text-sm font-bold shadow-lg shadow-[#007b63]/20 hover:bg-[#005a48]">
                Salvar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
