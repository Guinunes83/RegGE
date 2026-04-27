
import React, { useState, useEffect, useMemo } from 'react';
import { Study, PIEntry, Patient, ProtocolDeviation, TeamMember } from '../types';
import { LOGO_SVG, formatDatePTBR } from '../constants';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';

interface ProtocolDeviationViewProps {
  studies: Study[];
  pis: TeamMember[];
  patients: Patient[];
  team: TeamMember[];
  isReadOnly?: boolean;
  onShowSuccess: (title: string, message: string) => void;
}

type DevType = 'Protocolo' | 'GCP' | 'SAE';
const DEVIATION_TYPES: { type: DevType; collection: string; label: string; pdfTitle: string }[] = [
  { type: 'Protocolo', collection: 'deviations', label: 'Desvio de Protocolo', pdfTitle: 'Desvio de Protocolo' },
  { type: 'GCP', collection: 'gcpDeviations', label: 'GCP', pdfTitle: 'Desvio de Boas Práticas Clínicas (GCP)' },
  { type: 'SAE', collection: 'saeDeviations', label: 'SAE', pdfTitle: 'Relatório de Evento Adverso Grave (SAE)' }
];

export const ProtocolDeviationView: React.FC<ProtocolDeviationViewProps> = ({ 
  studies, 
  pis, 
  patients, 
  team, 
  isReadOnly = false,
  onShowSuccess
}) => {
  const [selectedType, setSelectedType] = useState<DevType>('Protocolo');
  const [activeTab, setActiveTab] = useState<DevType>('Protocolo');

  const [deviations, setDeviations] = useState<Record<DevType, ProtocolDeviation[]>>({ Protocolo: [], GCP: [], SAE: [] });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<Partial<ProtocolDeviation>>({});
  const [piSelectionType, setPiSelectionType] = useState<'IP' | 'Sub'>('IP');
  
  const [bottomPiId, setBottomPiId] = useState<string>('');
  const [bottomCoordId, setBottomCoordId] = useState<string>('');
  
  const [isPrinting, setIsPrinting] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchDeviations = async () => {
    const protoDevs = await db.getAll<ProtocolDeviation>('deviations');
    const gcpDevs = await db.getAll<ProtocolDeviation>('gcpDeviations');
    const saeDevs = await db.getAll<ProtocolDeviation>('saeDeviations');
    setDeviations({ Protocolo: protoDevs, GCP: gcpDevs, SAE: saeDevs });
  };

  useEffect(() => {
    const wipeMocks = async () => {
      const mockIds = ['d1', 'd2', 'd3', 'sae1', 'sae2', 'sae3', 'gcp1', 'gcp2', 'gcp3'];
      const p1 = await db.getAll<ProtocolDeviation>('deviations');
      const p2 = await db.getAll<ProtocolDeviation>('gcpDeviations');
      const p3 = await db.getAll<ProtocolDeviation>('saeDeviations');
      for (const d of p1) if (mockIds.includes(d.id)) await db.delete('deviations', d.id);
      for (const d of p2) if (mockIds.includes(d.id)) await db.delete('gcpDeviations', d.id);
      for (const d of p3) if (mockIds.includes(d.id)) await db.delete('saeDeviations', d.id);
      
      fetchDeviations();
    };
    wipeMocks();
  }, []);



  useEffect(() => {
    if (formData.patientId) {
      const p = patients.find(pat => pat.id === formData.patientId);
      if (p) {
        setFormData(prev => ({ ...prev, patientNumber: p.participantNumber }));
      }
    }
  }, [formData.patientId, patients]);

  const handleRegister = async () => {
    if (isReadOnly) return;
    if (!formData.studyId || !formData.patientId || !formData.description) {
      alert("Por favor, preencha os campos obrigatórios (Estudo, Participante, Descrição).");
      return;
    }
    
    const isNew = !formData.id;
    const newDev: ProtocolDeviation = {
      ...formData as ProtocolDeviation,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      status: 'Pendente'
    };
    
    const config = DEVIATION_TYPES.find(t => t.type === selectedType)!;
    await db.upsert(config.collection as any, newDev);
    
    await fetchDeviations();
    setActiveTab(selectedType);
    setFormData({});
    onShowSuccess(isNew ? 'Cadastrado com Sucesso!' : 'Salvo com Sucesso!', `Registro de ${config.label} processado.`);
  };

  const handleEdit = (dev: ProtocolDeviation, type: DevType) => {
    if (isReadOnly) return;
    setSelectedType(type);
    setFormData(dev);
  };

  const handleDelete = (id: string, type: DevType) => {
    if (isReadOnly) return;
    const config = DEVIATION_TYPES.find(t => t.type === type)!;
    
    setModalConfig({
      isOpen: true,
      title: `Excluir Registro`,
      message: `Tem certeza que deseja excluir este registro?`,
      onConfirm: async () => {
        await db.delete(config.collection as any, id);
        await fetchDeviations();
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
        if (formData.id === id) setFormData({});
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        onShowSuccess('Removido com Sucesso!', 'O registro foi excluído permanentemente.');
      }
    });
  };

  const toggleSelect = (id: string, type: DevType) => {
    if (activeTab !== type) {
      setActiveTab(type);
      setSelectedIds(new Set([id]));
    } else {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
    }
  };

  const handleGeneratePDF = async () => {
    const config = DEVIATION_TYPES.find(t => t.type === activeTab)!;
    const activeDevs = deviations[activeTab];
    
    for (const id of selectedIds) {
      const dev = activeDevs.find(d => d.id === id);
      if (dev) {
        await db.upsert(config.collection as any, { ...dev, status: 'Gerado' });
      }
    }
    await fetchDeviations();
    setIsPrinting(true);
  };

  const currentFormStudy = studies.find(s => s.id === formData.studyId);
  const filteredPatients = patients.filter(p => p.studyId === formData.studyId).sort((a,b) => a.name.localeCompare(b.name));
  
  const selectedTableStudy = useMemo(() => {
    if (selectedIds.size === 0) return null;
    const firstSelectedId = Array.from(selectedIds)[0];
    const dev = deviations[activeTab].find(d => d.id === firstSelectedId);
    return dev ? studies.find(s => s.id === dev.studyId) : null;
  }, [selectedIds, deviations, activeTab, studies]);

  const bottomPiOptions = useMemo(() => {
    if (!selectedTableStudy) return [];
    
    if (piSelectionType === 'IP') {
        return pis.filter(p => {
            const piName = p.name.trim();
            const studyPiName = (selectedTableStudy.pi || '').replace(/Dr(a)?\.\s*/, '').trim();
            return piName.includes(studyPiName) || p.name === selectedTableStudy.pi;
        });
    } else {
        return pis.filter(p => p.name !== selectedTableStudy.pi && !p.name.includes(selectedTableStudy.pi));
    }
  }, [selectedTableStudy, pis, piSelectionType]);

  useEffect(() => {
    if (piSelectionType === 'IP' && bottomPiOptions.length > 0) {
      setBottomPiId(bottomPiOptions[0].id);
    } else if (piSelectionType === 'Sub') {
      setBottomPiId(''); 
    } else {
      setBottomPiId('');
    }
  }, [piSelectionType, bottomPiOptions]);

  const coords = team.filter(t => t.role?.toLowerCase().includes('coordenador')).sort((a,b) => a.name.localeCompare(b.name));
  const activeStudies = studies.filter(s => s.status === 'Active').sort((a,b) => a.name.localeCompare(b.name));

  const activeTabConfig = DEVIATION_TYPES.find(t => t.type === activeTab)!;
  const currentDeviations = deviations[activeTab];

  if (isPrinting) {
    const selectedDeviations = currentDeviations.filter(d => selectedIds.has(d.id));
    const pi = pis.find(p => p.id === bottomPiId);
    const coord = team.find(t => t.id === bottomCoordId);

    return (
      <div className="bg-white p-0 m-0 min-h-screen font-serif text-black flex justify-center">
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 15mm; }
            body { background: white; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .print-container { width: 210mm !important; min-height: 297mm !important; box-shadow: none !important; border: none !important; margin: 0 !important; }
          }
          .printable-a4 { width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; background: white; box-sizing: border-box; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        `}</style>
        
        <div className="printable-a4 relative">
            <div className="relative mb-8">
               <div className="flex justify-center w-full">
                  <div className="w-48">{LOGO_SVG}</div>
               </div>
               <div className="no-print absolute top-0 right-0 space-x-4">
                 <button onClick={() => setIsPrinting(false)} className="bg-gray-500 text-white px-6 py-2 rounded-xl font-bold uppercase text-xs">Voltar</button>
                 <button onClick={() => window.print()} className="bg-[#007b63] text-white px-8 py-2 rounded-xl font-bold uppercase text-xs">Imprimir</button>
               </div>
            </div>
            
            <div className="text-center font-bold text-lg uppercase mb-8 flex flex-col gap-4 items-center">
              <p className="text-justify leading-relaxed max-w-4xl mx-auto">
                A Coordenadora do Comitê de Ética em Pesquisa com Seres Humanos: Sra Maria Luiza Vieira e Vieira.<br/>
                Vimos por meio desta, encaminhar ao Comitê de Ética, os desvios abaixo descritos:
              </p>
            </div>

            <h2 className="text-center font-bold text-xl uppercase mb-6 border-b-2 border-black inline-block pb-1">{activeTabConfig.pdfTitle}</h2>

            <table className="w-full border-collapse border border-black mb-12 text-[11px] table-fixed">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 w-[12%]">Estudos</th>
                  <th className="border border-black p-2 w-[15%]">PI</th>
                  <th className="border border-black p-2 w-[10%]">N do Centro</th>
                  <th className="border border-black p-2 w-[12%]">N do Participante</th>
                  <th className="border border-black p-2 w-[11%]">Data ocorrência</th>
                  <th className="border border-black p-2 w-[11%]">Data do Desvio</th>
                  <th className="border border-black p-2 w-[29%]">Descrição</th>
                </tr>
              </thead>
              <tbody className="break-words">
                {selectedDeviations.map(d => (
                  <tr key={d.id}>
                    <td className="border border-black p-2 font-bold">{studies.find(s => s.id === d.studyId)?.name}</td>
                    <td className="border border-black p-2">{d.piName}</td>
                    <td className="border border-black p-2">{d.centerNumber}</td>
                    <td className="border border-black p-2">{d.patientNumber}</td>
                    <td className="border border-black p-2 text-center">{formatDatePTBR(d.occurrenceDate)}</td>
                    <td className="border border-black p-2 text-center">{formatDatePTBR(d.deviationDate)}</td>
                    <td className="border border-black p-2 italic">{d.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-around mt-24 gap-12">
              <div className="text-center w-80">
                <p className="mb-1 border-t border-black pt-1">
                  <span className="font-bold">{pi?.name}</span><br/>
                  <span className="text-[10px] uppercase">{piSelectionType === 'IP' ? 'Investigador Principal' : 'Sub-Investigador'}</span>
                </p>
              </div>
              <div className="text-center w-80">
                <p className="mb-1 border-t border-black pt-1">
                  <span className="font-bold">{coord?.honorific} {coord?.name}</span><br/>
                  <span className="text-[10px] uppercase">Coordenador(a) de Estudos</span>
                </p>
              </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-6 bg-white/90 rounded-3xl shadow-2xl border border-gray-100 overflow-y-auto max-h-full scrollbar-thin relative">
      <ConfirmationModal
         isOpen={modalConfig.isOpen}
         title={modalConfig.title}
         message={modalConfig.message}
         onConfirm={modalConfig.onConfirm}
         onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
      
      {/* CADASTRO DE DESVIO - DESABILITADO SE READONLY */}
      <div className={`p-6 bg-[#d1e7e4]/20 rounded-2xl border border-[#007b63]/10 flex-shrink-0 transition-opacity ${isReadOnly ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="text-[#007b63] font-black uppercase text-xs tracking-widest mb-6 border-b border-[#007b63]/20 pb-2">Registro de Desvios</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-[10px] uppercase font-bold text-gray-500">Desvio de...</label>
            <select 
              disabled={isReadOnly} 
              className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]" 
              value={selectedType} 
              onChange={e => {
                if (!formData.id) setSelectedType(e.target.value as DevType)
              }}
            >
              {DEVIATION_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-[10px] uppercase font-bold text-gray-500">Estudo</label>
            <select disabled={isReadOnly} className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]" value={formData.studyId || ''} 
              onChange={e => {
                const val = e.target.value;
                const study = studies.find(s => s.id === val);
                if (study) {
                  setFormData({...formData, studyId: val, piName: study.pi, centerNumber: study.regulatoryCenterNumber || study.centerNumber || ''});
                } else {
                  setFormData({...formData, studyId: val, piName: '', centerNumber: ''});
                }
              }}>
              <option value="">Selecione...</option>
              {activeStudies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-[10px] uppercase font-bold text-gray-500">PI</label>
            <input className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none" value={formData.piName || ''} readOnly />
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-[10px] uppercase font-bold text-gray-500">Nº do Centro</label>
            <input className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none" value={formData.centerNumber || ''} readOnly />
          </div>
          
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-[10px] uppercase font-bold text-gray-500">Participante</label>
            <select disabled={isReadOnly} className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]" value={formData.patientId || ''} onChange={e => setFormData({...formData, patientId: e.target.value})}>
              <option value="">Selecione...</option>
              {filteredPatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-[10px] uppercase font-bold text-gray-500">Nº Participante</label>
            <input className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none" value={formData.patientNumber || ''} readOnly />
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-[10px] uppercase font-bold text-gray-500">Data Ocorrência</label>
            <input disabled={isReadOnly} type="date" className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]" value={formData.occurrenceDate || ''} onChange={e => setFormData({...formData, occurrenceDate: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-[10px] uppercase font-bold text-gray-500">Data Desvio</label>
            <input disabled={isReadOnly} type="date" className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]" value={formData.deviationDate || ''} onChange={e => setFormData({...formData, deviationDate: e.target.value})} />
          </div>
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-gray-500">Descrição do Desvio (Máx 200 carac.)</label>
            <textarea disabled={isReadOnly} maxLength={200} rows={3} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none bg-white" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>
        {!isReadOnly && (
          <div className="mt-4 flex justify-end">
            <button onClick={handleRegister} className="bg-[#007b63] text-white px-8 py-2 rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-[#005a48] transition-colors">
              {formData.id ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
            {formData.id && (
              <button 
                onClick={() => {
                  setFormData({});
                }} 
                className="ml-4 bg-gray-400 text-white px-8 py-2 rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>

      {/* TABS E TABELA CENTRAL */}
      <div className="flex flex-col flex-shrink-0">
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          {DEVIATION_TYPES.map(t => (
            <button
              key={t.type}
              onClick={() => {
                setActiveTab(t.type);
                if (!formData.id) setSelectedType(t.type);
                setSelectedIds(new Set());
              }}
              className={`px-6 py-2 uppercase font-bold text-xs rounded-t-lg transition-colors ${activeTab === t.type ? 'bg-[#007b63] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        
        <div className="overflow-hidden border rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#007b63] text-white uppercase tracking-tighter sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 w-8">Sel.</th>
                  <th className="px-3 py-3">Estudo</th>
                  <th className="px-3 py-3">PI</th>
                  <th className="px-3 py-3">Part. No</th>
                  <th className="px-3 py-3">Data Ocorrência</th>
                  <th className="px-3 py-3">Descrição</th>
                  <th className="px-3 py-3">Situação</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-600">
                {currentDeviations.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-8 text-center italic text-gray-400">Nenhum registro cadastrado nesta aba.</td></tr>
                ) : (
                  currentDeviations.map(d => (
                    <tr key={d.id} className={`${selectedIds.has(d.id) ? 'bg-[#d1e7e4]/30' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-3 py-3"><input type="checkbox" className="cursor-pointer" checked={selectedIds.has(d.id)} onChange={() => toggleSelect(d.id, activeTab)} /></td>
                      <td className="px-3 py-3 font-bold text-gray-800">{studies.find(s => s.id === d.studyId)?.name}</td>
                      <td className="px-3 py-3">{d.piName}</td>
                      <td className="px-3 py-3">{d.patientNumber}</td>
                      <td className="px-3 py-3">{formatDatePTBR(d.occurrenceDate)}</td>
                      <td className="px-3 py-3 truncate max-w-[150px]">{d.description}</td>
                      <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === 'Gerado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span></td>
                      <td className="px-3 py-3 text-right flex justify-end gap-2">
                        {!isReadOnly && (
                          <>
                            <button onClick={() => handleEdit(d, activeTab)} className="p-1 hover:bg-blue-50 text-blue-500 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                            <button onClick={() => handleDelete(d.id, activeTab)} className="p-1 hover:bg-red-50 text-red-500 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SIGNATÁRIOS E GERAÇÃO PDF */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 flex-shrink-0">
        <div className="flex flex-col gap-4">
           <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
             Pesquisador Principal {selectedTableStudy ? `(${selectedTableStudy.name})` : ''}
           </h4>
           <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer text-gray-600 font-medium">
                <input type="radio" className="accent-[#007b63]" name="piType" checked={piSelectionType === 'IP'} onChange={() => setPiSelectionType('IP')} /> Investigador Principal
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer text-gray-600 font-medium">
                <input type="radio" className="accent-[#007b63]" name="piType" checked={piSelectionType === 'Sub'} onChange={() => setPiSelectionType('Sub')} /> Sub-Investigador
              </label>
           </div>
           <select 
             className="border border-gray-300 rounded px-2 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63] shadow-sm transition-all disabled:bg-gray-100 disabled:opacity-50" 
             value={bottomPiId} 
             onChange={e => setBottomPiId(e.target.value)}
             disabled={!selectedTableStudy}
           >
             <option value="">{selectedTableStudy ? "Selecione o PI..." : "Selecione um desvio na tabela..."}</option>
             {bottomPiOptions.sort((a,b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </div>
        <div className="flex flex-col gap-4">
           <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Coordenador(a) de estudos</h4>
           <div className="h-4 md:h-6"></div> 
           <select className="border border-gray-300 rounded px-2 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63] shadow-sm transition-all" value={bottomCoordId} onChange={e => setBottomCoordId(e.target.value)}>
             <option value="">Selecione o Coordenador...</option>
             {coords.map(c => <option key={c.id} value={c.id}>{c.honorific} {c.name}</option>)}
           </select>
        </div>
        <div className="md:col-span-2 flex justify-center mt-4">
           <button 
             disabled={selectedIds.size === 0 || !bottomPiId || !bottomCoordId}
             onClick={handleGeneratePDF}
             className="bg-[#007b63] disabled:opacity-50 disabled:cursor-not-allowed text-white px-12 py-3 rounded-2xl font-black uppercase text-xs shadow-xl tracking-widest hover:scale-105 transition-all"
           >
             Gerar (PDF A4)
           </button>
        </div>
      </div>
    </div>
  );
};
