
import React, { useState, useEffect, useMemo } from 'react';
import { PatientVisitSchedule, VisitRow, Study } from '../types';
import { db } from '../database';

export const VisitControlView: React.FC = () => {
  const [schedules, setSchedules] = useState<PatientVisitSchedule[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Estado de Edição (Célula específica)
  const [editingCell, setEditingCell] = useState<{ pId: string, vId: string, field: 'actualDate' | 'notes' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const [schedulesData, studiesData] = await Promise.all([
        db.getAll<PatientVisitSchedule>('visitSchedules'),
        db.getAll<Study>('studies')
      ]);
      setSchedules(schedulesData);
      setStudies(studiesData);
      
      // Selecionar primeiro estudo automaticamente se houver
      if (studiesData.length > 0) {
        setSelectedStudyId(studiesData[0].id);
      }
    };
    loadData();
  }, []);

  // Filtrar pacientes pelo estudo selecionado
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => s.studyId === selectedStudyId);
  }, [schedules, selectedStudyId]);

  const selectedSchedule = filteredSchedules.find(s => s.id === selectedPatientId);

  // Efeito para resetar seleção de paciente ao trocar estudo
  useEffect(() => {
    setSelectedPatientId(null);
  }, [selectedStudyId]);

  const getStatus = (scheduled: string, actual: string) => {
    if (actual) return { label: 'Realizado', color: 'bg-green-100 text-green-700 border-green-200' };
    
    if (!scheduled) return { label: 'A Programar', color: 'bg-gray-100 text-gray-500 border-gray-200' };

    const today = new Date();
    today.setHours(0,0,0,0);
    const schedDate = new Date(scheduled);
    
    // Diferença em dias
    const diffTime = schedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Atrasado', color: 'bg-red-100 text-red-700 border-red-200' };
    if (diffDays === 0) return { label: 'Hoje', color: 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' };
    if (diffDays <= 7) return { label: 'Próxima Semana', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    
    return { label: 'Programado', color: 'bg-white text-gray-600 border-gray-200' };
  };

  const handleSaveEdit = async (scheduleId: string, visitId: string, field: 'actualDate' | 'notes', newValue: string) => {
    const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
    if (scheduleIndex === -1) return;

    const updatedSchedules = [...schedules];
    const visitIndex = updatedSchedules[scheduleIndex].visits.findIndex(v => v.id === visitId);
    
    if (visitIndex !== -1) {
      if (field === 'actualDate') {
        updatedSchedules[scheduleIndex].visits[visitIndex].actualDate = newValue;
      } else {
        updatedSchedules[scheduleIndex].visits[visitIndex].notes = newValue;
      }
      
      await db.upsert('visitSchedules', updatedSchedules[scheduleIndex]);
      setSchedules(updatedSchedules);
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, scheduleId: string, visitId: string, field: 'actualDate' | 'notes') => {
    if (e.key === 'Enter') {
      handleSaveEdit(scheduleId, visitId, field, editValue);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const startEditing = (pId: string, vId: string, field: 'actualDate' | 'notes', currentValue: string) => {
    setEditingCell({ pId, vId, field });
    setEditValue(currentValue || '');
  };

  // Helper para formatar data BR
  const formatDate = (iso: string) => iso ? iso.split('-').reverse().join('/') : '-';

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden relative">
      
      {/* Header Compacto */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm z-10 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-[#007b63]">Controle de Visitas</h2>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Monitoramento Cronológico</p>
          </div>
        </div>
        
        {/* Seletor de Estudo */}
        <div className="w-full md:w-1/3">
           <select 
             className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-[#007b63]"
             value={selectedStudyId}
             onChange={(e) => setSelectedStudyId(e.target.value)}
           >
             <option value="">Selecione um estudo...</option>
             {studies.map(s => <option key={s.id} value={s.id}>{s.name} ({s.protocol})</option>)}
           </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar: Lista de Pacientes (Filtrada) */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          {filteredSchedules.length === 0 ? (
             <div className="p-4 text-center text-xs text-gray-400 italic">
               {selectedStudyId ? 'Nenhum paciente neste estudo.' : 'Selecione um estudo acima.'}
             </div>
          ) : (
            filteredSchedules.map(p => {
              const nextVisit = p.visits.find(v => !v.actualDate && v.scheduledDate && new Date(v.scheduledDate) >= new Date());
              const lateVisit = p.visits.find(v => !v.actualDate && v.scheduledDate && new Date(v.scheduledDate) < new Date());
              
              return (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${selectedPatientId === p.id ? 'bg-[#007b63]/5 border-l-4 border-l-[#007b63]' : 'border-l-4 border-l-transparent'}`}
                >
                  <h4 className="font-bold text-xs text-gray-800 truncate" title={p.patientName}>{p.patientName}</h4>
                  <p className="text-[9px] text-gray-500 mb-1">Pront.: {p.medicalRecord}</p>
                  
                  {lateVisit ? (
                     <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[8px] font-bold uppercase">
                       Atraso: {lateVisit.visitName} ({formatDate(lateVisit.scheduledDate)})
                     </span>
                  ) : nextVisit ? (
                     <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-bold uppercase">
                       Prox: {nextVisit.visitName} ({formatDate(nextVisit.scheduledDate)})
                     </span>
                  ) : (
                     <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[8px] font-bold uppercase">
                       Concluído
                     </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Área Principal: Tabela Detalhada */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#f8fafc]">
          {selectedSchedule ? (
            <div className="max-w-5xl mx-auto flex flex-col gap-4">
              
              {/* Resumo Compacto */}
              <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                 <div>
                    <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight">{selectedSchedule.patientName}</h1>
                    <div className="flex gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                       <span>DN: {selectedSchedule.birthDate}</span>
                       <span>•</span>
                       <span>Prontuário: {selectedSchedule.medicalRecord}</span>
                    </div>
                 </div>
                 <div className="flex gap-2 text-right">
                    <div className="bg-gray-50 px-3 py-1 rounded border border-gray-100">
                       <p className="text-[8px] text-gray-400 font-bold uppercase">TCLE</p>
                       <p className="font-bold text-xs text-gray-700">{formatDate(selectedSchedule.tcleDate || '')}</p>
                    </div>
                    <div className="bg-gray-50 px-3 py-1 rounded border border-gray-100">
                       <p className="text-[8px] text-gray-400 font-bold uppercase">Randomização</p>
                       <p className="font-bold text-xs text-[#007b63]">{formatDate(selectedSchedule.randomizationDate || '')}</p>
                    </div>
                 </div>
              </div>

              {/* Tabela de Visitas */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#007b63] text-white uppercase text-[10px] tracking-wider font-bold">
                      <th className="px-4 py-3">Visita</th>
                      <th className="px-4 py-3">Data Programada</th>
                      <th className="px-4 py-3">Data Real</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Obs / Imagens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedSchedule.visits.map((visit) => {
                      const status = getStatus(visit.scheduledDate, visit.actualDate);
                      const isEditingDate = editingCell?.pId === selectedSchedule.id && editingCell?.vId === visit.id && editingCell?.field === 'actualDate';
                      const isEditingNotes = editingCell?.pId === selectedSchedule.id && editingCell?.vId === visit.id && editingCell?.field === 'notes';

                      return (
                        <tr key={visit.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-4 py-2 font-bold text-gray-700">{visit.visitName}</td>
                          <td className="px-4 py-2 text-gray-500 font-medium">{formatDate(visit.scheduledDate)}</td>
                          
                          {/* Coluna Data Real (Editável) */}
                          <td className="px-4 py-2">
                            {isEditingDate ? (
                              <input 
                                type="date" 
                                className="border rounded px-1 py-0.5 text-xs w-full bg-white shadow-sm outline-none ring-1 ring-[#007b63]" 
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={() => handleSaveEdit(selectedSchedule.id, visit.id, 'actualDate', editValue)}
                                onKeyDown={(e) => handleKeyDown(e, selectedSchedule.id, visit.id, 'actualDate')}
                                autoFocus
                              />
                            ) : (
                              <div 
                                onClick={() => startEditing(selectedSchedule.id, visit.id, 'actualDate', visit.actualDate)}
                                className={`cursor-pointer flex items-center gap-2 font-bold hover:bg-gray-100 p-1 rounded -ml-1 ${visit.actualDate ? 'text-gray-800' : 'text-gray-300 italic'}`}
                                title="Clique para editar"
                              >
                                {visit.actualDate ? formatDate(visit.actualDate) : 'Informar Data'}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border ${status.color}`}>
                              {status.label}
                            </span>
                          </td>

                          {/* Coluna Obs (Editável) */}
                          <td className="px-4 py-2">
                             {isEditingNotes ? (
                               <input 
                                 type="text" 
                                 className="border rounded px-1 py-0.5 text-xs w-full bg-white shadow-sm outline-none ring-1 ring-[#007b63]" 
                                 value={editValue}
                                 onChange={e => setEditValue(e.target.value)}
                                 onBlur={() => handleSaveEdit(selectedSchedule.id, visit.id, 'notes', editValue)}
                                 onKeyDown={(e) => handleKeyDown(e, selectedSchedule.id, visit.id, 'notes')}
                                 autoFocus
                               />
                             ) : (
                               <div 
                                 onClick={() => startEditing(selectedSchedule.id, visit.id, 'notes', visit.notes || '')}
                                 className="cursor-pointer text-gray-500 italic hover:text-gray-800 hover:bg-gray-100 p-1 rounded -ml-1 min-h-[20px]"
                                 title="Clique para editar obs"
                               >
                                 {visit.notes || '-'}
                               </div>
                             )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
               <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
               <p className="text-xs font-bold uppercase tracking-widest">
                 {selectedStudyId ? 'Selecione um paciente ao lado' : 'Selecione um Estudo acima'}
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
