
import React, { useState } from 'react';
import { EXAM_LIST, LOGO_SVG } from '../constants';
import { Patient, Study } from '../types';

interface ExamRequestViewProps {
  patients: Patient[];
  studies: Study[];
}

export const ExamRequestView: React.FC<ExamRequestViewProps> = ({ patients, studies }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedExams, setSelectedExams] = useState<Set<string>>(new Set());
  const [clinicalData, setClinicalData] = useState('');
  const [studyName, setStudyName] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Auto-fill study name when patient is selected
  React.useEffect(() => {
    if (selectedPatient) {
      const study = studies.find(s => s.id === selectedPatient.studyId);
      if (study) setStudyName(study.name);
    } else {
      setStudyName('');
    }
  }, [selectedPatientId, patients, studies]);

  const toggleExam = (exam: string) => {
    const next = new Set(selectedExams);
    if (next.has(exam)) {
      next.delete(exam);
    } else {
      next.add(exam);
    }
    setSelectedExams(next);
  };

  const handlePrint = () => {
    if (!selectedPatientId) {
      alert("Selecione um paciente para gerar a solicitação.");
      return;
    }
    if (selectedExams.size === 0) {
      alert("Selecione ao menos um exame.");
      return;
    }
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (isPrinting) {
    // Determine age
    let age = '';
    if (selectedPatient?.birthDate) {
      const birth = new Date(selectedPatient.birthDate);
      const now = new Date();
      let diff = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        diff--;
      }
      age = diff.toString();
    }

    // Organizar exames selecionados por categoria para impressão
    const examsByCategory: Record<string, string[]> = {};
    
    // Iterar sobre as categorias originais para manter a ordem
    Object.keys(EXAM_LIST).forEach(category => {
      const categoryExams = EXAM_LIST[category as keyof typeof EXAM_LIST];
      const selectedInThisCategory = categoryExams.filter(exam => selectedExams.has(exam));
      
      if (selectedInThisCategory.length > 0) {
        examsByCategory[category] = selectedInThisCategory;
      }
    });

    return (
      <div className="bg-white min-h-screen w-full flex justify-center p-0 m-0 font-sans text-black">
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            body { background: white; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .print-container { width: 100% !important; height: auto !important; box-shadow: none !important; border: none !important; }
          }
          .print-container { width: 210mm; min-height: 297mm; padding: 10mm; background: white; margin: 0 auto; box-sizing: border-box; }
        `}</style>

        <div className="print-container relative">
          <div className="no-print absolute top-0 right-0 p-4">
            <button onClick={() => setIsPrinting(false)} className="bg-gray-500 text-white px-4 py-2 rounded mr-2 text-xs font-bold uppercase">Voltar</button>
            <button onClick={() => window.print()} className="bg-[#007b63] text-white px-4 py-2 rounded text-xs font-bold uppercase">Imprimir</button>
          </div>

          {/* Cabeçalho */}
          <div className="text-center border-b-2 border-[#007b63] pb-4 mb-8">
             <div className="flex justify-center mb-4">
               <div className="w-48">{LOGO_SVG}</div>
             </div>
             <h1 className="text-xl font-bold uppercase tracking-wider text-gray-800">Centro de Pesquisa e Ensino em Saúde de Santa Catarina</h1>
          </div>

          {/* Dados do Paciente - Modernizado e Limpo */}
          <div className="bg-gray-50 border-l-4 border-[#007b63] p-6 mb-8 rounded-r-xl shadow-sm">
             <div className="grid grid-cols-12 gap-6">
                
                {/* Nome - Maior destaque */}
                <div className="col-span-7 border-r border-gray-200 pr-6">
                   <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Nome do Paciente</label>
                   <div className="text-lg font-black text-gray-800 uppercase tracking-tight leading-tight">
                     {selectedPatient?.name}
                   </div>
                </div>

                {/* Prontuário */}
                <div className="col-span-2">
                   <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Prontuário</label>
                   <div className="text-base font-bold text-gray-700">
                     {selectedPatient?.participantNumber}
                   </div>
                </div>

                {/* Idade */}
                <div className="col-span-1">
                   <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Idade</label>
                   <div className="text-base font-bold text-gray-700">{age} <span className="text-[10px] font-normal text-gray-400">anos</span></div>
                </div>

                {/* Sexo */}
                <div className="col-span-2">
                   <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Sexo</label>
                   <div className="flex gap-2">
                      <div className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center text-[10px] font-bold ${selectedPatient?.sex === 'M' ? 'bg-[#007b63] text-white border-[#007b63]' : 'text-gray-400'}`}>M</div>
                      <div className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center text-[10px] font-bold ${selectedPatient?.sex === 'F' ? 'bg-[#007b63] text-white border-[#007b63]' : 'text-gray-400'}`}>F</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex gap-8 mb-10 px-2">
             <div className="flex-1">
               <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Dados Clínicos</span>
               <div className="border-b border-gray-300 pb-1 text-sm uppercase text-gray-800 min-h-[24px]">
                 {clinicalData}
               </div>
             </div>
             <div className="flex-1">
               <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Nome do Estudo</span>
               <div className="border-b border-gray-300 pb-1 text-sm uppercase text-gray-800 font-bold min-h-[24px]">
                 {studyName}
               </div>
             </div>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm font-black uppercase text-[#007b63] tracking-widest">Requisição de Exames</span>
            </div>
          </div>

          {/* Lista de Exames Selecionados */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-8 text-xs mb-8 px-2">
             {Object.entries(examsByCategory).map(([category, exams]) => (
               <div key={category}>
                 <h3 className="font-bold border-b-2 border-gray-800 mb-3 uppercase text-[10px] tracking-wider">{category}</h3>
                 <ul className="list-none space-y-2">
                   {exams.map(exam => (
                     <li key={exam} className="flex items-center gap-3">
                       <div className="w-4 h-4 border-2 border-black flex items-center justify-center">
                          <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                       </div>
                       <span className="uppercase font-medium text-gray-800">{exam}</span>
                     </li>
                   ))}
                 </ul>
               </div>
             ))}
          </div>

          {/* Campo para Outros */}
          <div className="mb-12 px-2">
            <h3 className="font-bold text-xs uppercase mb-3 text-gray-500">Outros Exames / Observações</h3>
            <div className="border-b border-gray-300 h-8 mb-2 border-dashed"></div>
            <div className="border-b border-gray-300 h-8 mb-2 border-dashed"></div>
            <div className="border-b border-gray-300 h-8 mb-2 border-dashed"></div>
          </div>

          {/* Rodapé */}
          <div className="flex justify-between items-end mt-20 pt-8 border-t-2 border-gray-800 px-2">
             <div className="text-xs">
                <div className="flex items-center gap-6 mb-4">
                   <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-black"></div> 
                      <span className="font-bold uppercase">Urgente</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-black"></div> 
                      <span className="font-bold uppercase">Rotina / Jejum</span>
                   </div>
                </div>
                <p className="font-medium">DATA: ______ / ______ / ___________</p>
             </div>
             <div className="text-center w-64">
                <div className="border-t border-black pt-2 mb-1"></div>
                <p className="text-xs font-bold uppercase text-gray-600">Ass. Médico / CRM</p>
             </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-6 h-full">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#007b63] p-6 text-white flex justify-between items-center shadow-md z-10">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Solicitação de Exames</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Geração de Pedidos Médicos</p>
          </div>
          
          <div className="flex gap-4 items-center">
             <div className="flex flex-col text-right mr-4">
               <span className="text-[10px] uppercase font-bold text-white/70">Itens Selecionados</span>
               <span className="text-xl font-black">{selectedExams.size}</span>
             </div>
             <button 
               onClick={handlePrint}
               className="bg-white text-[#007b63] px-6 py-2 rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-gray-100 transition-all flex items-center gap-2"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
               Gerar PDF
             </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="bg-gray-50 p-6 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Paciente</label>
              <select 
                className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">Selecione o paciente...</option>
                {patients.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
           </div>
           
           <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Nome do Estudo (Automático)</label>
              <input 
                className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-gray-100 outline-none text-gray-600"
                value={studyName}
                readOnly
              />
           </div>

           <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Dados Clínicos (Opcional)</label>
              <input 
                className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]"
                value={clinicalData}
                onChange={(e) => setClinicalData(e.target.value)}
                placeholder="Ex: Paciente em acompanhamento..."
              />
           </div>
        </div>

        {/* Exam Selection Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(EXAM_LIST).map(([category, exams]) => (
                <div key={category} className="border border-gray-100 rounded-xl bg-gray-50/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                   <h3 className="text-[#007b63] font-bold text-xs uppercase tracking-wider mb-4 border-b border-[#007b63]/10 pb-2">{category}</h3>
                   <div className="flex flex-col gap-2">
                     {exams.map(exam => (
                       <label key={exam} className="flex items-center gap-3 cursor-pointer group">
                         <div className="relative flex items-center justify-center">
                           <input 
                             type="checkbox" 
                             className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded checked:bg-[#007b63] checked:border-[#007b63] transition-all"
                             checked={selectedExams.has(exam)}
                             onChange={() => toggleExam(exam)}
                           />
                           <svg className="absolute w-3 h-3 text-white hidden peer-checked:block pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                         </div>
                         <span className={`text-xs group-hover:text-[#007b63] transition-colors ${selectedExams.has(exam) ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{exam}</span>
                       </label>
                     ))}
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};
