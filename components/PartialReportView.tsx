
import React, { useState, useEffect, useMemo } from 'react';
import { Study, PartialReportEntry } from '../types';
import { db } from '../database';

interface PartialReportViewProps {
  studies: Study[];
  isReadOnly?: boolean;
  onShowSuccess: (title: string, message: string) => void;
}

type SortConfig = {
  key: 'name' | 'expected';
  direction: 'asc' | 'desc';
} | null;

const RowSubmissionInput = ({ value, onChange, disabled }: { value: string, onChange: (v: string) => void, disabled?: boolean }) => (
  <input 
    type="date" 
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#007b63] bg-white w-full ${disabled ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''}`}
    disabled={disabled}
  />
);

export const PartialReportView: React.FC<PartialReportViewProps> = ({ studies, isReadOnly = false, onShowSuccess }) => {
  const [activeStudies, setActiveStudies] = useState<Study[]>([]);
  const [selectedStudyForHistory, setSelectedStudyForHistory] = useState<Study | null>(null);
  const [submissionDates, setSubmissionDates] = useState<Record<string, string>>({});
  const [rowFinalMode, setRowFinalMode] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  useEffect(() => {
    setActiveStudies(studies.filter(s => s.status === 'Active'));
  }, [studies]);

  const calculateNextReport = (study: Study) => {
    const reports = study.partialReports || [];
    const nextSeq = reports.length + 1;
    
    if (!study.initialOpinionApprovalDate) return { seq: nextSeq, expected: null };

    const baseDate = new Date(study.initialOpinionApprovalDate);
    const expectedDate = new Date(baseDate.getTime());
    expectedDate.setDate(baseDate.getDate() + (365 * nextSeq));
    
    return {
      seq: nextSeq,
      expected: expectedDate.toISOString().split('T')[0]
    };
  };

  const toggleRowMode = (studyId: string) => {
    setRowFinalMode(prev => ({
      ...prev,
      [studyId]: !prev[studyId]
    }));
  };

  const handleSaveReport = (study: Study) => {
    if (isReadOnly) return;
    const submissionDate = submissionDates[study.id];
    const isFinal = !!rowFinalMode[study.id];

    if (!submissionDate) {
      alert("Por favor, insira a data de submissão.");
      return;
    }

    if (!study.initialOpinionApprovalDate) {
      alert("Este estudo não possui 'Data Aprovação do Parecer Inicial' cadastrada nos Índices.");
      return;
    }

    const { seq, expected } = calculateNextReport(study);
    const label = isFinal ? "Relatório Final" : `Relatório Parcial ${String(seq).padStart(2, '0')}`;
    
    const newReport: PartialReportEntry = {
      id: Math.random().toString(36).substr(2, 9),
      sequence: isFinal ? 999 : seq,
      expectedDate: expected || '',
      submissionDate: submissionDate
    };

    const updatedStudy = {
      ...study,
      partialReports: [...(study.partialReports || []), newReport]
    };

    db.upsert('studies', updatedStudy);
    
    setSubmissionDates(prev => {
      const next = { ...prev };
      delete next[study.id];
      return next;
    });

    setActiveStudies(prev => prev.map(s => s.id === study.id ? updatedStudy : s));
    if (selectedStudyForHistory?.id === study.id) setSelectedStudyForHistory(updatedStudy);
    
    onShowSuccess('Salvo com Sucesso!', `${label} submetido.`);
  };

  const requestSort = (key: 'name' | 'expected') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStudies = useMemo(() => {
    let sortableItems = [...activeStudies];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'name') {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        } else if (sortConfig.key === 'expected') {
          const { expected: expA } = calculateNextReport(a);
          const { expected: expB } = calculateNextReport(b);
          if (!expA && !expB) return 0;
          if (!expA) return 1;
          if (!expB) return -1;
          if (expA < expB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (expA > expB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [activeStudies, sortConfig]);

  const getSortIcon = (key: 'name' | 'expected') => {
    if (!sortConfig || sortConfig.key !== key) return (
      <svg className="w-3 h-3 ml-1 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
    );
    return sortConfig.direction === 'asc' ? (
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
    ) : (
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
        <div className="border-b border-[#007b63]/20 pb-4 mb-6">
          <h2 className="text-2xl font-black text-[#007b63] uppercase tracking-tighter">Relatórios Parciais</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Relatórios submetidos anualmente com base na data de aprovação do dossiê Inicial pelo CEP</p>
        </div>

        <div className="overflow-hidden border rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#007b63] text-white uppercase tracking-tighter">
              <tr>
                <th 
                  className="px-4 py-4 cursor-pointer hover:bg-[#005a48] transition-colors"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Nome / Estudo
                    {getSortIcon('name')}
                  </div>
                </th>
                <th className="px-4 py-4">Tipo de Relatório</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th 
                  className="px-4 py-4 cursor-pointer hover:bg-[#005a48] transition-colors"
                  onClick={() => requestSort('expected')}
                >
                  <div className="flex items-center">
                    Data Prevista
                    {getSortIcon('expected')}
                  </div>
                </th>
                <th className="px-4 py-4">Data Submissão</th>
                <th className="px-4 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-600">
              {sortedStudies.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center italic text-gray-400">Nenhum estudo ativo encontrado.</td></tr>
              ) : (
                sortedStudies.map(study => {
                  const { seq, expected } = calculateNextReport(study);
                  const isFinal = !!rowFinalMode[study.id];
                  
                  return (
                    <tr 
                      key={study.id} 
                      className="hover:bg-gray-50 transition-all group cursor-pointer"
                    >
                      <td 
                        className="px-4 py-4 font-bold text-gray-800 group-hover:text-[#007b63]"
                        onClick={() => setSelectedStudyForHistory(study)}
                      >
                        <div className="flex flex-col">
                          <span>{study.name}</span>
                          <span className="text-[9px] text-gray-400 font-normal">Protocolo: {study.protocol || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 w-32">
                         <div className="flex items-center gap-2">
                           <span className={`text-[8px] font-bold ${!isFinal ? 'text-[#007b63]' : 'text-gray-400'}`}>Parcial</span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); toggleRowMode(study.id); }}
                             disabled={isReadOnly}
                             className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isFinal ? 'bg-[#007b63]' : 'bg-gray-300'}`}
                           >
                             <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-sm ${isFinal ? 'left-4.5' : 'left-0.5'}`}></div>
                           </button>
                           <span className={`text-[8px] font-bold ${isFinal ? 'text-[#007b63]' : 'text-gray-400'}`}>Final</span>
                         </div>
                      </td>
                      <td className="px-4 py-4 text-center" onClick={() => setSelectedStudyForHistory(study)}>
                        {isFinal ? (
                          <span className="bg-red-50 text-red-600 px-2 py-1 rounded font-bold uppercase text-[9px]">Aguardando Final</span>
                        ) : (
                          <span className="bg-gray-100 px-2 py-1 rounded font-bold">Parcial {String(seq).padStart(2, '0')}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center" onClick={() => setSelectedStudyForHistory(study)}>
                        {expected ? (
                          <span className="font-medium">{expected.split('-').reverse().join('/')}</span>
                        ) : (
                          <span className="text-red-400 italic font-bold">Sem Parecer Inicial</span>
                        )}
                      </td>
                      <td className="px-4 py-4 w-40">
                        <RowSubmissionInput 
                          value={submissionDates[study.id] || ''} 
                          onChange={(v) => setSubmissionDates({ ...submissionDates, [study.id]: v })} 
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        {!isReadOnly && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSaveReport(study); }}
                            className={`${isFinal ? 'bg-red-500 hover:bg-red-600' : 'bg-[#007b63] hover:bg-[#005a48]'} text-white px-4 py-1.5 rounded-lg font-bold uppercase text-[10px] shadow-md transition-all`}
                          >
                            Salvar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudyForHistory && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-white/20">
            <div className="bg-[#007b63] text-white p-6 relative">
              <button 
                onClick={() => setSelectedStudyForHistory(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-xl font-black uppercase tracking-tight pr-12">{selectedStudyForHistory.name}</h3>
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Histórico de Relatórios • Protocolo {selectedStudyForHistory.protocol}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <table className="w-full text-left text-xs border-collapse bg-white shadow-sm rounded-xl overflow-hidden">
                <thead className="bg-gray-100 text-gray-500 uppercase font-bold border-b">
                  <tr>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Data Prevista</th>
                    <th className="px-6 py-4">Data Submetido</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!selectedStudyForHistory.partialReports || selectedStudyForHistory.partialReports.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center italic text-gray-400">Nenhum relatório foi submetido anteriormente para este estudo.</td></tr>
                  ) : (
                    selectedStudyForHistory.partialReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-2 font-bold text-[#007b63]">
                           {report.sequence === 999 ? "RELATÓRIO FINAL" : `Relatório Parcial ${String(report.sequence).padStart(2, '0')}`}
                        </td>
                        <td className="px-6 py-2 text-gray-500">{report.expectedDate ? report.expectedDate.split('-').reverse().join('/') : '-'}</td>
                        <td className="px-6 py-2 font-black text-gray-800">{report.submissionDate ? report.submissionDate.split('-').reverse().join('/') : '-'}</td>
                        <td className="px-6 py-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${report.sequence === 999 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Submetido</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedStudyForHistory(null)}
                className="px-8 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold uppercase text-xs transition-colors"
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
