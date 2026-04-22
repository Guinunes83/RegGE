
import React, { useState } from 'react';
import { Sponsor, Study } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';
import { UnsavedChangesModal, useUnsavedChanges } from './UnsavedChangesModal';

interface SponsorFormProps {
  sponsor?: Sponsor;
  studies: Study[];
  mode: 'edit' | 'view';
  onSave: (data: Partial<Sponsor>) => void;
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
  const [formData, setFormData] = useState<Partial<Sponsor>>(sponsor || {});
  const [selectedStudyToLink, setSelectedStudyToLink] = useState<string>('');
  
  const isView = mode === 'view';

  // Filter studies related to this sponsor
  const relatedStudies = studies.filter(s => 
    s.sponsor && formData.name && 
    s.sponsor.toLowerCase().trim() === formData.name.toLowerCase().trim()
  ).sort((a,b) => a.name.localeCompare(b.name));

  // Filter available studies (not linked to this sponsor)
  const availableStudies = studies.filter(s => 
    !s.sponsor || (formData.name && s.sponsor.toLowerCase().trim() !== formData.name.toLowerCase().trim())
  ).sort((a,b) => a.name.localeCompare(b.name));

  const handleChange = (field: keyof Sponsor, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLinkStudy = () => {
    if (!selectedStudyToLink || !formData.name) return;

    const studyToUpdate = studies.find(s => s.id === selectedStudyToLink);
    if (studyToUpdate) {
      // Atualiza o estudo no banco de dados com o novo patrocinador
      const updatedStudy = { ...studyToUpdate, sponsor: formData.name };
      db.upsert('studies', updatedStudy);
      
      // Limpa seleção
      setSelectedStudyToLink('');
      
      // Notifica o componente pai para recarregar os dados
      if (onUpdate) onUpdate();
    }
  };

  const performValidationAndSave = async (): Promise<boolean> => {
    if (!formData.name) {
      alert('O campo Nome é obrigatório.');
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
            <SponsorInput label="Nome" value={formData.name} onChange={(v: string) => handleChange('name', v)} isView={isView} />
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
          
          {/* Menu de Vinculação (Apenas Edição) */}
          {!isView && !isReadOnly && (
            <div className="mb-4 flex items-end gap-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Vincular Estudo Existente</label>
                <select 
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63] w-full bg-white"
                  value={selectedStudyToLink}
                  onChange={(e) => setSelectedStudyToLink(e.target.value)}
                >
                  <option value="">Selecione um estudo para adicionar...</option>
                  {availableStudies.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.protocol})</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleLinkStudy}
                disabled={!selectedStudyToLink || !formData.name}
                className="bg-[#007b63] hover:bg-[#005a48] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md px-4 py-2 font-bold shadow-md transition-all h-[38px] w-12 flex items-center justify-center"
                title="Adicionar Estudo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl border border-gray-200">
            {relatedStudies.length === 0 ? (
              <p className="text-center text-gray-400 italic text-sm py-4">Nenhum estudo vinculado a este patrocinador.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {relatedStudies.map(study => (
                  <div key={study.id} className="bg-gray-50 border border-gray-200 rounded p-2 text-xs font-bold text-gray-700 text-center hover:bg-gray-100 transition-colors truncate" title={study.name}>
                    {study.name}
                  </div>
                ))}
              </div>
            )}
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
