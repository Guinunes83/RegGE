import React, { useRef, useState } from 'react';

interface ImportCsvViewProps {
  onShowSuccess: (title: string, message: string) => void;
  onRefreshData: () => void;
}

export const ImportCsvView: React.FC<ImportCsvViewProps> = ({ onShowSuccess, onRefreshData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTarget, setImportTarget] = useState<'studies' | 'team' | 'participants' | 'monitors' | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const triggerImport = (target: 'studies' | 'team' | 'participants' | 'monitors') => {
    setImportTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importTarget) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Tenta enviar para o backend Java (Spring Boot)
      const response = await fetch(`http://localhost:8080/api/import/${importTarget}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(`Erro na importação: ${errorText || response.statusText}`);
      } else {
        const result = await response.json();
        onShowSuccess('Importação concluída', result.message || 'Arquivo importado com sucesso.');
        onRefreshData();
      }
    } catch (error: any) {
      // Fallback amigável caso o backend não esteja rodando
      alert(`Falha ao contactar o servidor (Java Backend). ${error.message}`);
    } finally {
      setIsImporting(false);
      setImportTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Importação de Dados (.CSV)</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Selecione o módulo para importar registros em massa via arquivo CSV.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        
        {/* Equipe */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-16 h-16 bg-[#007b63]/10 rounded-full flex items-center justify-center text-[#007b63] mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg uppercase">Equipe</h3>
            <p className="text-xs text-gray-500 mt-2">Importe usuários e perfis para o sistema.</p>
          </div>
          <button 
            onClick={() => triggerImport('team')} 
            disabled={isImporting}
            className="mt-2 w-full bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-sm font-bold text-xs uppercase hover:bg-[#005a48] transition-colors disabled:opacity-50"
          >
            Importar .CSV
          </button>
        </div>

        {/* Estudos */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-16 h-16 bg-[#007b63]/10 rounded-full flex items-center justify-center text-[#007b63] mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg uppercase">Estudos</h3>
            <p className="text-xs text-gray-500 mt-2">Importe protocolos e projetos de pesquisa.</p>
          </div>
          <button 
            onClick={() => triggerImport('studies')} 
            disabled={isImporting}
            className="mt-2 w-full bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-sm font-bold text-xs uppercase hover:bg-[#005a48] transition-colors disabled:opacity-50"
          >
            Importar .CSV
          </button>
        </div>

        {/* Participantes */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-16 h-16 bg-[#007b63]/10 rounded-full flex items-center justify-center text-[#007b63] mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg uppercase">Participantes</h3>
            <p className="text-xs text-gray-500 mt-2">Importe os pacientes alocados nos estudos.</p>
          </div>
          <button 
            onClick={() => triggerImport('participants')} 
            disabled={isImporting}
            className="mt-2 w-full bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-sm font-bold text-xs uppercase hover:bg-[#005a48] transition-colors disabled:opacity-50"
          >
            Importar .CSV
          </button>
        </div>

        {/* Monitores */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-16 h-16 bg-[#007b63]/10 rounded-full flex items-center justify-center text-[#007b63] mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg uppercase">Monitores</h3>
            <p className="text-xs text-gray-500 mt-2">Importe dados dos monitores dos estudos.</p>
          </div>
          <button 
            onClick={() => triggerImport('monitors')} 
            disabled={isImporting}
            className="mt-2 w-full bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-sm font-bold text-xs uppercase hover:bg-[#005a48] transition-colors disabled:opacity-50"
          >
            Importar .CSV
          </button>
        </div>

      </div>

      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
      />
    </div>
  );
};
