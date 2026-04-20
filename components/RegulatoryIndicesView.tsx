
import React, { useMemo } from 'react';
import { Study } from '../types';
import { LOGO_SVG, COLORS } from '../constants';

interface RegulatoryIndicesViewProps {
  studies: Study[];
}

// Definição das etapas sequenciais para o cálculo
const TIMELINE_STEPS = [
  { key: 'feasibilityReceptionDate', label: 'Rec. Feasibility' },
  { key: 'feasibilitySigningDate', label: 'Assin. Feasibility' },
  { key: 'centerSelectionNoticeDate', label: 'Aviso Seleção' },
  { key: 'contractReceptionDate', label: 'Rec. Contrato' },
  { key: 'contractSigningDate', label: 'Assin. Contrato' },
  { key: 'initialDossierReceptionDate', label: 'Rec. Dossiê Inicial' },
  { key: 'initialDossierSubmissionDate', label: 'Sub. Dossiê Inicial' },
  { key: 'cepAcceptanceDate', label: 'Aceite CEP' },
  { key: 'initialOpinionApprovalDate', label: 'Aprov. Parecer Inicial' },
  { key: 'centerActivationDate', label: 'Ativação Centro' },
  { key: 'firstParticipantDate', label: '1º Participante' },
  { key: 'firstRandomizedDate', label: '1º Randomizado' },
  { key: 'finalOpinionDate', label: 'Parecer Final' }
] as const;

export const RegulatoryIndicesView: React.FC<RegulatoryIndicesViewProps> = ({ studies }) => {

  // Lógica de processamento de dados para o gráfico
  const chartData = useMemo(() => {
    const intervals: { label: string; totalDays: number; count: number; color: string }[] = [];
    
    // Cores para as fatias
    const sliceColors = [
      '#007b63', '#009e80', '#2ba894', '#4db2a1', 
      '#6ecbc0', '#8be5da', '#e55a5a', '#f28b82', 
      '#fcd0b6', '#fce2c2', '#d1e7e4', '#a8d5cf'
    ];

    // Iterar sobre os passos para criar intervalos (Passo Atual -> Próximo Passo)
    for (let i = 0; i < TIMELINE_STEPS.length - 1; i++) {
      const startStep = TIMELINE_STEPS[i];
      const endStep = TIMELINE_STEPS[i+1];
      
      let sumDays = 0;
      let validStudiesCount = 0;

      studies.forEach(study => {
        const startStr = study[startStep.key as keyof Study] as string;
        const endStr = study[endStep.key as keyof Study] as string;

        if (startStr && endStr) {
          const start = new Date(startStr);
          const end = new Date(endStr);
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Consideramos apenas intervalos positivos ou zero (cronologia correta)
          if (diffDays >= 0) {
            sumDays += diffDays;
            validStudiesCount++;
          }
        }
      });

      if (validStudiesCount > 0) {
        intervals.push({
          label: `${startStep.label} ➝ ${endStep.label}`,
          totalDays: sumDays,
          count: validStudiesCount,
          color: sliceColors[i % sliceColors.length]
        });
      }
    }

    // Calcular médias
    return intervals.map(interval => ({
      ...interval,
      avgDays: interval.totalDays / interval.count
    }));
  }, [studies]);

  // Componente SVG Pie Chart Interno
  const PieChart = ({ data }: { data: typeof chartData }) => {
    const totalAvgDays = data.reduce((acc, cur) => acc + cur.avgDays, 0);
    
    if (totalAvgDays === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400 italic">
          Dados insuficientes para gerar o gráfico temporal.
        </div>
      );
    }

    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    return (
      <div className="flex flex-row items-center gap-8 h-full">
        {/* Gráfico */}
        <div className="w-64 h-64 relative flex-shrink-0">
          <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
            {data.map((slice, idx) => {
              const percent = slice.avgDays / totalAvgDays;
              const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
              cumulativePercent += percent;
              const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
              
              const largeArcFlag = percent > 0.5 ? 1 : 0;
              
              const pathData = [
                `M 0 0`,
                `L ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                `Z`
              ].join(' ');

              return (
                <path 
                  key={idx} 
                  d={pathData} 
                  fill={slice.color} 
                  stroke="white" 
                  strokeWidth="0.01"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <title>{`${slice.label}: ${slice.avgDays.toFixed(1)} dias (média)`}</title>
                </path>
              );
            })}
          </svg>
        </div>

        {/* Legenda */}
        <div className="flex-1 overflow-y-auto max-h-80 pr-2 custom-scrollbar">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1 text-gray-500 font-bold uppercase">Intervalo</th>
                <th className="text-right py-1 text-gray-500 font-bold uppercase">Média (Dias)</th>
                <th className="text-right py-1 text-gray-500 font-bold uppercase">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((slice, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></span>
                    <span className="font-medium text-gray-700">{slice.label}</span>
                  </td>
                  <td className="py-2 text-right font-bold">{slice.avgDays.toFixed(1)}</td>
                  <td className="py-2 text-right text-gray-500">{((slice.avgDays / totalAvgDays) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="bg-gray-50 border-t border-gray-300">
                 <td className="py-2 font-black text-[#007b63] uppercase">Tempo Total Médio</td>
                 <td className="py-2 text-right font-black text-[#007b63]">{totalAvgDays.toFixed(1)}</td>
                 <td className="py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 w-full h-full overflow-y-auto p-8 flex justify-center">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-container { box-shadow: none !important; border: none !important; width: 297mm !important; height: 210mm !important; margin: 0 !important; padding: 10mm !important; }
        }
        .print-container { width: 297mm; min-height: 210mm; margin: 0 auto; background: white; padding: 10mm; box-sizing: border-box; }
      `}</style>
      
      {/* Container A4 Paisagem Simulado (Aspect Ratio aprox 297mm x 210mm) */}
      <div className="print-container bg-white shadow-2xl border border-gray-200 relative flex flex-col">
        
        {/* Botão de Impressão (Flutuante) */}
        <button 
          onClick={handlePrint}
          className="no-print absolute top-8 right-8 bg-[#007b63] text-white p-3 rounded-full shadow-lg hover:bg-[#005a48] transition-all z-10"
          title="Imprimir"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
        </button>

        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-10 border-b-2 border-[#007b63] pb-6">
          <div className="w-48 mb-4">
            {LOGO_SVG}
          </div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-[#007b63]">Índice Regulatório</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
             Análise de tempos médios entre etapas regulatórias do centro de pesquisa
          </p>
        </div>

        {/* Conteúdo - Grid de Gráficos */}
        <div className="flex-1 grid grid-cols-1 gap-8">
          
          {/* Quadro 1: Gráfico Principal */}
          <div className="border border-gray-200 rounded-2xl p-6 shadow-sm bg-white flex flex-col">
            <div className="mb-6 flex justify-between items-end border-b border-gray-100 pb-2">
               <div>
                 <h2 className="text-lg font-bold text-gray-800 uppercase">Tempo Médio - Ciclo de Vida do Estudo</h2>
                 <p className="text-[10px] text-gray-500 uppercase">Do Recebimento do Feasibility ao Parecer Final</p>
               </div>
               <div className="text-[10px] font-bold bg-[#d1e7e4] text-[#007b63] px-2 py-1 rounded">
                 Base: {studies.length} Estudos Cadastrados
               </div>
            </div>
            
            <div className="flex-1">
               <PieChart data={chartData} />
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="mt-12 text-center border-t border-gray-100 pt-4">
          <p className="text-[10px] text-gray-400 uppercase font-bold">Documento Gerado Automaticamente pelo Sistema Regge</p>
          <p className="text-[9px] text-gray-300">{new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
};
