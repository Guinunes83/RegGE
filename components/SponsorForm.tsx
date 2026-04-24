
import React, { useState, useEffect } from 'react';
import { Sponsor, Study } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';
import { UnsavedChangesModal, useUnsavedChanges } from './UnsavedChangesModal';
import { showValidation } from './ValidationModal';

interface SponsorFormProps {
  sponsor?: Sponsor;
  studies: Study[];
  mode: 'edit' | 'view';
  onSave: (data: Partial<Sponsor>) => Promise<void> | void;
  onCancel: () => void;
  onEdit?: () => void;
  onUpdate?: () => void; // Callback para atualizar dados globais
  isReadOnly?: boolean;
}

const SponsorInput = ({ 
  label, 
  value, 
  onChange,
  isView,
  type = "text",
  placeholder
}: any) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">
      {label}
    </label>
    <input 
      type={isView ? "text" : type}
      readOnly={isView}
      placeholder={isView ? '' : placeholder}
      className={`border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none transition-all ${isView ? 'bg-gray-100' : 'bg-white'}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export const SponsorForm: React.FC<SponsorFormProps> = ({ sponsor, studies, mode, onSave, onCancel, onEdit, onUpdate, isReadOnly = false }) => {
  const [formData, setFormData] = useState<Partial<Sponsor> & { studyIds?: string[] }>(sponsor || {});
  const [activeStudiesFull, setActiveStudiesFull] = useState<Study[]>([]);
  
  const isView = mode === 'view';

  // Initialize linked studies based on Study records
  useEffect(() => {
    // Only active studies can generally be linked, or we can just list all
    const active = studies.sort((a,b) => a.name.localeCompare(b.name));
    setActiveStudiesFull(active);

    if (sponsor?.name) {
      const linkedStudyIds = active.filter(s => 
        s.sponsor && s.sponsor.toLowerCase().trim() === sponsor.name.toLowerCase().trim()
      ).map(s => s.id);
      
      setFormData(prev => ({ ...prev, studyIds: linkedStudyIds }));
    } else {
      setFormData(prev => ({ ...prev, studyIds: [] }));
    }
  }, [sponsor, studies]);

  const handleChange = (field: keyof Sponsor, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const performValidationAndSave = async (): Promise<boolean> => {
    if (!formData.name) {
      showValidation('O campo Nome é obrigatório e precisa ser preenchido antes de salvar.');
      return false;
    }

    // Bidirectional sync
    // Iterate over all activeStudiesFull and update them if they changed state.
    const updatesToStudies: Study[] = [];
    const newName = formData.name.trim();

    for (const study of activeStudiesFull) {
      const isSelected = (formData.studyIds || []).includes(study.id);
      const isCurrentlyLinked = study.sponsor && sponsor?.name && study.sponsor.toLowerCase().trim() === sponsor.name.toLowerCase().trim();

      if (isSelected && study.sponsor !== newName) {
        // Study is selected but hasn't been updated to the sponsor yet
        updatesToStudies.push({ ...study, sponsor: newName });
      } else if (!isSelected && isCurrentlyLinked) {
        // Study was unselected but still points to this sponsor
        updatesToStudies.push({ ...study, sponsor: '' });
      } else if (isSelected && sponsor && sponsor.name !== newName) {
         // Sponsor name changed, update the study's sponsor field to match new name
         updatesToStudies.push({ ...study, sponsor: newName });
      }
    }

    const { studyIds, ...sponsorDataToSave } = formData;
    await onSave(sponsorDataToSave);

    for (const study of updatesToStudies) {
       await db.upsert('studies', study);
    }
    
    if (updatesToStudies.length > 0 && onUpdate) {
      onUpdate();
    }

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
          {isView ? 'Visualização de Patrocinador' : 'Cadastro de Patrocinador'}
        </h2>
        <button onClick={handleCancelClick} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-8 flex flex-col gap-8 overflow-y-auto bg-gray-50/50 flex-1">
        
        {/* Dados do Patrocinador */}
        <section>
          <div className="bg-[#d1e7e4] text-[#007b63] font-bold text-center py-1.5 uppercase tracking-widest text-xs mb-4 border-b border-[#007b63]/20">
            DADOS GERAIS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SponsorInput label="Nome" value={formData.name} onChange={(v: string) => handleChange('name', v.toUpperCase())} isView={isView} />
            <SponsorInput label="Nome Alternativo" value={formData.alternativeName} onChange={(v: string) => handleChange('alternativeName', v)} isView={isView} />
            <SponsorInput label="Moeda" value={formData.currency} onChange={(v: string) => handleChange('currency', v)} isView={isView} />
            <SponsorInput label="CRO" value={formData.cro} onChange={(v: string) => handleChange('cro', v)} isView={isView} />
            <SponsorInput label="CNPJ" value={formData.cnpj} onChange={(v: string) => handleChange('cnpj', v)} isView={isView} placeholder="00.000.000/0000-00" />
            <div className="lg:col-span-3">
               <SponsorInput label="Endereço" value={formData.address} onChange={(v: string) => handleChange('address', v)} isView={isView} />
            </div>
          </div>
        </section>

        {/* Grade de Estudos Relacionados */}
        <section>
          <div className="bg-[#d1e7e4] text-[#007b63] font-bold text-center py-1.5 uppercase tracking-widest text-xs mb-4 border-b border-[#007b63]/20">
            ESTUDOS VINCULADOS
          </div>
          <div className="flex flex-col gap-3 w-full">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column: Available Studies */}
              <div className="border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-64">
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
                      <span className="text-xs text-gray-600 group-hover:text-gray-900">{study.name} ({study.protocol})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Right Column: Selected Studies */}
              <div className="border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-64">
                <div className="bg-[#d1e7e4] px-4 py-2 border-b border-[#007b63]/20 font-bold text-xs text-[#007b63] uppercase flex justify-between">
                  <span>Estudos Selecionados</span>
                  <span className="text-[10px] bg-white px-1.5 rounded text-[#007b63]">{(formData.studyIds || []).length}</span>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-white">
                  {(formData.studyIds || []).length === 0 && <p className="text-center text-xs text-gray-400 mt-6 italic">Nenhum estudo selecionado.</p>}
                  {(formData.studyIds || []).map(studyId => {
                    const study = activeStudiesFull.find(s => s.id === studyId);
                    if (!study) return null;
                    return (
                      <label key={studyId} className={`flex items-center gap-2 p-2 bg-gray-50 hover:bg-red-50 border-transparent hover:border-red-100 rounded group transition-colors border ${isView || isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            disabled={isView || isReadOnly}
                            className={`peer appearance-none w-4 h-4 border-2 rounded transition-all disabled:opacity-50 border-[#007b63] bg-[#007b63] checked:bg-red-500 checked:border-red-500`}
                            checked={true}
                            onChange={() => {
                              const current = formData.studyIds || [];
                              setFormData({ ...formData, studyIds: current.filter(id => id !== studyId) })
                            }}
                          />
                          <svg className="absolute w-3 h-3 text-white peer-checked:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          <svg className={`absolute w-3 h-3 text-white pointer-events-none hidden peer-checked:block`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <span className={`text-xs font-medium text-gray-700 group-hover:text-red-600`}>{study.name} ({study.protocol})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 px-8 py-6">
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
  );
};
