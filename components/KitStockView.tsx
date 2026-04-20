
import React, { useState, useEffect, useMemo } from 'react';
import { Study, KitStockEntry, KitHistoryEntry } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';
import { LOGO_SVG } from '../constants';

interface KitStockViewProps {
  studies: Study[];
  isReadOnly?: boolean;
  onShowSuccess: (title: string, message: string) => void;
}

const InputField = ({ label, value, onChange, type = "text", readOnly }: any) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">{label}</label>
    <input 
      type={type} 
      className={`border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#007b63] ${readOnly ? 'bg-gray-100' : 'bg-white'}`}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      readOnly={readOnly}
    />
  </div>
);

export const KitStockView: React.FC<KitStockViewProps> = ({ studies, isReadOnly = false, onShowSuccess }) => {
  const [kits, setKits] = useState<KitStockEntry[]>([]);
  const [isPrintingReport, setIsPrintingReport] = useState(false);
  
  const [reportType, setReportType] = useState<'none' | 'expiry' | 'study' | 'quantity'>('none');
  const [reportValue, setReportValue] = useState<string>('');

  // Estado para ordenação
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [formData, setFormData] = useState<{
    id?: string;
    studyId: string;
    kitName: string;
    expirationDate: string;
    inputQuantity: string; 
  }>({
    studyId: '',
    kitName: '',
    expirationDate: '',
    inputQuantity: ''
  });

  const [editingKit, setEditingKit] = useState<KitStockEntry | null>(null);
  const [viewingHistoryKit, setViewingHistoryKit] = useState<KitStockEntry | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    const fetchKits = async () => {
      const data = await db.getAll<KitStockEntry>('kitStock');
      setKits(data);
    };
    fetchKits();
  }, []);

  const getDaysRemaining = (dateString: string) => {
    if (!dateString) return 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    const exp = new Date(dateString);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  // Lógica de Ordenação
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtragem e Ordenação dos dados
  const processedKits = useMemo(() => {
    // 1. Filtragem
    let result = kits.filter(k => {
      if (formData.studyId && k.studyId !== formData.studyId) return false;
      const days = getDaysRemaining(k.expirationDate);
      // Opcional: esconder vencidos e zerados se desejar, mas mantendo a lógica original:
      if (days < 0 && k.quantity === 0) return false;
      return true;
    });

    // 2. Ordenação
    if (sortConfig) {
      result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortConfig.key === 'studyName') {
          valA = studies.find(s => s.id === a.studyId)?.name || '';
          valB = studies.find(s => s.id === b.studyId)?.name || '';
        } else if (sortConfig.key === 'kitName') {
          valA = a.kitName;
          valB = b.kitName;
        } else if (sortConfig.key === 'expirationDate') {
          valA = a.expirationDate;
          valB = b.expirationDate;
        } else if (sortConfig.key === 'quantity') {
          valA = a.quantity;
          valB = b.quantity;
        } else if (sortConfig.key === 'daysRemaining') {
          valA = getDaysRemaining(a.expirationDate);
          valB = getDaysRemaining(b.expirationDate);
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [kits, formData.studyId, sortConfig, studies]);

  const getRowStyle = (dateString: string) => {
    const days = getDaysRemaining(dateString);
    if (days < 0) return "bg-red-200 text-red-900"; 
    if (days <= 10) return "bg-red-100 text-red-800"; 
    if (days <= 20) return "bg-orange-100 text-orange-800"; 
    if (days <= 30) return "bg-yellow-100 text-yellow-800"; 
    return "hover:bg-gray-50"; 
  };

  const handleTransaction = async (operation: 'add' | 'subtract') => {
    if (isReadOnly) return;
    if (!formData.studyId || !formData.kitName || !formData.expirationDate || !formData.inputQuantity) {
      alert("Preencha todos os campos.");
      return;
    }

    const transactionQty = parseInt(formData.inputQuantity);
    if (isNaN(transactionQty) || transactionQty < 0) {
      alert("Quantidade inválida.");
      return;
    }

    const now = new Date().toLocaleString('pt-BR');
    let isUpdate = false;

    if (editingKit) {
      isUpdate = true;
      let newTotal = editingKit.quantity;
      if (operation === 'add') newTotal += transactionQty;
      else newTotal -= transactionQty;

      if (newTotal < 0) {
        alert("A quantidade em estoque não pode ser negativa.");
        return;
      }

      const newHistory: KitHistoryEntry = {
        date: now,
        action: operation === 'add' ? 'Entrada' : 'Saída',
        amount: transactionQty,
        balance: newTotal
      };

      const updatedKitEntry: KitStockEntry = {
        ...editingKit,
        studyId: formData.studyId,
        kitName: formData.kitName,
        expirationDate: formData.expirationDate,
        quantity: newTotal,
        history: [...(editingKit.history || []), newHistory]
      };
      
      await db.upsert('kitStock', updatedKitEntry);
    } else {
      const existingMatch = kits.find(k => 
        k.studyId === formData.studyId && 
        k.kitName.trim().toLowerCase() === formData.kitName.trim().toLowerCase() &&
        k.expirationDate === formData.expirationDate
      );

      if (existingMatch) {
        isUpdate = true;
        let newTotal = existingMatch.quantity;
        if (operation === 'add') newTotal += transactionQty;
        else newTotal -= transactionQty;

        if (newTotal < 0) {
          alert("A quantidade em estoque não pode ser negativa.");
          return;
        }

        const mergeHistory: KitHistoryEntry = {
          date: now,
          action: operation === 'add' ? 'Entrada' : 'Saída',
          amount: transactionQty,
          balance: newTotal
        };

        const updatedEntry: KitStockEntry = { 
          ...existingMatch, 
          quantity: newTotal,
          history: [...(existingMatch.history || []), mergeHistory]
        };
        await db.upsert('kitStock', updatedEntry);
      } else {
        const initialQty = operation === 'add' ? transactionQty : -transactionQty; 
        if (initialQty < 0) {
           alert("Não é possível criar um novo registro com estoque negativo.");
           return;
        }
        const initialHistory: KitHistoryEntry = {
          date: now,
          action: 'Criação',
          amount: initialQty,
          balance: initialQty
        };
        const newKitEntry: KitStockEntry = {
          id: Math.random().toString(36).substr(2, 9),
          studyId: formData.studyId,
          kitName: formData.kitName,
          expirationDate: formData.expirationDate,
          quantity: initialQty,
          history: [initialHistory]
        };
        await db.upsert('kitStock', newKitEntry);
      }
    }
    const data = await db.getAll<KitStockEntry>('kitStock');
    setKits(data);
    setFormData({ ...formData, kitName: '', expirationDate: '', inputQuantity: '', id: undefined });
    setEditingKit(null);
    onShowSuccess(isUpdate ? 'Salvo com Sucesso!' : 'Cadastrado com Sucesso!', 'Operação de estoque realizada.');
  };

  const handleEdit = (kit: KitStockEntry) => {
    if(isReadOnly) return;
    setEditingKit(kit);
    setFormData({
      id: kit.id,
      studyId: kit.studyId,
      kitName: kit.kitName,
      expirationDate: kit.expirationDate,
      inputQuantity: '' 
    });
  };

  const handleDelete = (id: string) => {
    if(isReadOnly) return;
    setModalConfig({
      isOpen: true,
      title: 'Excluir Kit',
      message: 'Tem certeza que deseja excluir este Kit? Todo o histórico será perdido.',
      onConfirm: async () => {
        await db.delete('kitStock', id);
        const data = await db.getAll<KitStockEntry>('kitStock');
        setKits(data);
        if (editingKit?.id === id) {
          setEditingKit(null);
          setFormData({ ...formData, kitName: '', expirationDate: '', inputQuantity: '' });
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        onShowSuccess('Removido com Sucesso!', 'Kit removido do estoque.');
      }
    });
  };

  const getFilteredReportKits = () => {
    switch (reportType) {
      case 'expiry':
        const daysLimit = parseInt(reportValue) || 30;
        return kits.filter(k => {
          const days = getDaysRemaining(k.expirationDate);
          return days >= 0 && days <= daysLimit && k.quantity > 0;
        });
      case 'study':
        return kits.filter(k => k.studyId === reportValue && (k.quantity > 0 || getDaysRemaining(k.expirationDate) >= 0));
      case 'quantity':
        const minQty = parseInt(reportValue) || 0;
        return kits.filter(k => k.quantity <= minQty);
      default:
        return [];
    }
  };

  // Alteração: Mostrar todos os estudos, independente do status, para permitir gestão de estoque de estudos fechados
  const allStudiesSorted = studies.sort((a,b) => a.name.localeCompare(b.name));

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortConfig?.key !== colKey) return <span className="opacity-30 ml-1">⇅</span>;
    return <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  if (isPrintingReport) {
    const reportKits = getFilteredReportKits();
    return (
      <div className="bg-white p-0 m-0 min-h-screen font-serif text-black flex justify-center">
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            body { background: white; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .print-container { width: 100% !important; height: auto !important; box-shadow: none !important; border: none !important; }
          }
          .printable-portrait { width: 210mm; min-height: 297mm; padding: 10mm; margin: 0 auto; background: white; box-sizing: border-box; }
        `}</style>
        
        <div className="printable-portrait relative">
            <div className="flex justify-between items-start mb-8 border-b-2 border-[#007b63] pb-4">
               <div className="w-48">{LOGO_SVG}</div>
               <div className="text-right">
                 <h1 className="text-xl font-bold uppercase text-[#007b63]">Relatório de Estoque de Kits</h1>
                 <p className="text-xs text-gray-500 uppercase font-bold mt-1">
                   {reportType === 'expiry' && `Filtro: Vencendo em até ${reportValue || 30} dias`}
                   {reportType === 'study' && `Filtro: Por Estudo (${studies.find(s => s.id === reportValue)?.name})`}
                   {reportType === 'quantity' && `Filtro: Quantidade igual ou inferior a ${reportValue || 0}`}
                 </p>
                 <p className="text-[10px] text-gray-400 mt-1">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
               </div>
            </div>

            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">ESTUDO</th>
                  <th className="border border-gray-300 p-2 text-left">KIT</th>
                  <th className="border border-gray-300 p-2 text-center">VALIDADE</th>
                  <th className="border border-gray-300 p-2 text-center">DIAS REST.</th>
                  <th className="border border-gray-300 p-2 text-right">QUANTIDADE</th>
                </tr>
              </thead>
              <tbody>
                {reportKits.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center italic text-gray-400">Nenhum kit encontrado com os filtros selecionados.</td></tr>
                ) : (
                  reportKits.sort((a,b) => a.expirationDate.localeCompare(b.expirationDate)).map(k => (
                    <tr key={k.id}>
                      <td className="border border-gray-300 p-2">{studies.find(s => s.id === k.studyId)?.name}</td>
                      <td className="border border-gray-300 p-2 font-bold">{k.kitName}</td>
                      <td className="border border-gray-300 p-2 text-center">{k.expirationDate.split('-').reverse().join('/')}</td>
                      <td className="border border-gray-300 p-2 text-center">{getDaysRemaining(k.expirationDate)}</td>
                      <td className="border border-gray-300 p-2 text-right font-bold">{k.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="mt-20 border-t border-gray-200 pt-4 flex justify-between items-end">
              <div className="text-[10px] text-gray-400 italic">
                Este documento é uma representação do estado atual do banco de dados do sistema.
              </div>
              <div className="text-center w-64 border-t border-black pt-2">
                <p className="text-xs font-bold uppercase">Responsável pelo Estoque</p>
              </div>
            </div>

            <div className="mt-12 no-print flex justify-center gap-4">
              <button onClick={() => setIsPrintingReport(false)} className="bg-gray-500 text-white px-8 py-2 rounded-xl font-bold uppercase text-xs">Voltar</button>
              <button onClick={() => window.print()} className="bg-[#007b63] text-white px-10 py-2 rounded-xl font-bold uppercase text-xs">Imprimir / Salvar PDF</button>
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

      {viewingHistoryKit && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-[#007b63] text-white p-6 flex justify-between items-start">
               <div>
                 <h3 className="text-xl font-bold uppercase tracking-wide">Histórico de Movimentação</h3>
                 <p className="text-xs opacity-80 mt-1">{studies.find(s => s.id === viewingHistoryKit.studyId)?.name} • {viewingHistoryKit.kitName}</p>
               </div>
               <button onClick={() => setViewingHistoryKit(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
               <table className="w-full text-left text-xs border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
                 <thead className="bg-gray-200 text-gray-700 uppercase font-bold">
                   <tr><th className="px-4 py-3">Data / Hora</th><th className="px-4 py-3">Ação</th><th className="px-4 py-3">Quantidade</th><th className="px-4 py-3 text-right">Saldo</th></tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {[...(viewingHistoryKit.history || [])].reverse().map((h, idx) => (
                     <tr key={idx} className="hover:bg-gray-50">
                       <td className="px-4 py-3 text-gray-600">{h.date}</td>
                       <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${h.action === 'Entrada' || h.action === 'Criação' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.action}</span></td>
                       <td className="px-4 py-3 font-medium">{h.action === 'Saída' ? '-' : '+'}{h.amount}</td>
                       <td className="px-4 py-3 text-right font-bold text-gray-800">{h.balance}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             <div className="p-4 border-t bg-gray-100 text-right"><button onClick={() => setViewingHistoryKit(null)} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-bold uppercase text-xs">Fechar</button></div>
          </div>
        </div>
      )}

      {/* FORMULÁRIO DE CADASTRO */}
      <div className={`p-6 bg-[#d1e7e4]/20 rounded-2xl border border-[#007b63]/10 flex-shrink-0 transition-opacity ${isReadOnly ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="text-[#007b63] font-black uppercase text-xs tracking-widest mb-6 border-b border-[#007b63]/20 pb-2">
          {editingKit ? 'Editar / Movimentar Estoque' : 'Cadastro de Estoque de Kits'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Estudo</label>
            <select disabled={isReadOnly} className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]" value={formData.studyId} onChange={e => setFormData({...formData, studyId: e.target.value})}>
              <option value="">Selecione um Estudo...</option>
              {allStudiesSorted.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <InputField label="Kit" value={formData.kitName} onChange={(v: string) => setFormData({...formData, kitName: v})} readOnly={isReadOnly} />
          <InputField label="Data Validade" type="date" value={formData.expirationDate} onChange={(v: string) => setFormData({...formData, expirationDate: v})} readOnly={isReadOnly} />
          <div className="flex flex-col gap-1 w-full">
             <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">{editingKit ? 'Qtd. a Mover' : 'Quantidade'}</label>
             <input disabled={isReadOnly} type="number" className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-white" value={formData.inputQuantity} onChange={e => setFormData({...formData, inputQuantity: e.target.value})} placeholder="0" />
          </div>
          {!isReadOnly && (
            <div className="flex gap-2 h-[34px]">
              <button onClick={() => handleTransaction('add')} className="flex-1 bg-[#007b63] text-white rounded font-bold hover:bg-[#005a48] transition-colors flex items-center justify-center shadow-md"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
              {editingKit && <button onClick={() => handleTransaction('subtract')} className="flex-1 bg-red-500 text-white rounded font-bold hover:bg-red-600 transition-colors flex items-center justify-center shadow-md"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg></button>}
            </div>
          )}
        </div>
      </div>

      {/* TABELA DE LISTAGEM */}
      <div className="overflow-hidden border rounded-2xl bg-white shadow-sm flex-shrink-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#007b63] text-white uppercase tracking-tighter sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 cursor-pointer hover:bg-[#00604d]" onClick={() => requestSort('studyName')}>Estudo <SortIcon colKey="studyName"/></th>
                <th className="px-3 py-3 cursor-pointer hover:bg-[#00604d]" onClick={() => requestSort('kitName')}>Kit <SortIcon colKey="kitName"/></th>
                <th className="px-3 py-3 cursor-pointer hover:bg-[#00604d]" onClick={() => requestSort('expirationDate')}>Data Validade <SortIcon colKey="expirationDate"/></th>
                <th className="px-3 py-3 cursor-pointer hover:bg-[#00604d]" onClick={() => requestSort('quantity')}>Quantidade <SortIcon colKey="quantity"/></th>
                <th className="px-3 py-3 cursor-pointer hover:bg-[#00604d]" onClick={() => requestSort('daysRemaining')}>Dias p/ Vencimento <SortIcon colKey="daysRemaining"/></th>
                <th className="px-3 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-600">
              {processedKits.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center italic text-gray-400">Nenhum kit encontrado.</td></tr>
              ) : (
                processedKits.map(k => (
                  <tr 
                    key={k.id} 
                    className={`${getRowStyle(k.expirationDate)} transition-colors border-b border-gray-100 cursor-pointer`}
                    onClick={() => setViewingHistoryKit(k)}
                    title="Clique para ver histórico"
                  >
                    <td className="px-3 py-3 font-bold text-gray-800">{studies.find(s => s.id === k.studyId)?.name || 'N/A'}</td>
                    <td className="px-3 py-3 font-medium">{k.kitName}</td>
                    <td className="px-3 py-3">{k.expirationDate.split('-').reverse().join('/')}</td>
                    <td className="px-3 py-3 font-bold text-lg">{k.quantity}</td>
                    <td className="px-3 py-3 font-bold">{getDaysRemaining(k.expirationDate) < 0 ? 'VENCIDO' : `${getDaysRemaining(k.expirationDate)} dias`}</td>
                    <td className="px-3 py-3 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setViewingHistoryKit(k)} className="text-gray-600 font-bold hover:underline uppercase text-[10px] bg-white/50 px-2 py-1 rounded">Visualizar</button>
                      {!isReadOnly && (
                        <>
                          <button onClick={() => handleEdit(k)} className="text-blue-600 font-bold hover:underline uppercase text-[10px] bg-white/50 px-2 py-1 rounded">Editar</button>
                          <button onClick={() => handleDelete(k.id)} className="text-red-600 font-bold hover:underline uppercase text-[10px] bg-white/50 px-2 py-1 rounded">Excluir</button>
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

      {/* SEÇÃO DE RELATÓRIO - AGORA NA PARTE INFERIOR */}
      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 flex-shrink-0">
        <h3 className="text-gray-400 font-black uppercase text-xs tracking-widest mb-4">Módulo de Relatórios</h3>
        <div className="flex flex-col md:flex-row items-end gap-6">
           <div className="flex flex-col gap-1 w-full md:w-64">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Relatório</label>
              <select 
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63] shadow-sm"
                value={reportType}
                onChange={e => { setReportType(e.target.value as any); setReportValue(''); }}
              >
                <option value="none">Selecione um tipo...</option>
                <option value="expiry">Vencendo em X dias</option>
                <option value="study">Por estudo</option>
                <option value="quantity">Por quantidade</option>
              </select>
           </div>

           {reportType === 'expiry' && (
              <div className="flex flex-col gap-1 w-full md:w-48 animate-in fade-in slide-in-from-left-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Dias para o Vencimento</label>
                <input 
                  type="number" 
                  className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-white shadow-sm" 
                  placeholder="Ex: 30"
                  value={reportValue}
                  onChange={e => setReportValue(e.target.value)}
                />
              </div>
           )}

           {reportType === 'study' && (
              <div className="flex flex-col gap-1 w-full md:w-64 animate-in fade-in slide-in-from-left-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Selecionar Estudo</label>
                <select 
                  className="border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63] shadow-sm"
                  value={reportValue}
                  onChange={e => setReportValue(e.target.value)}
                >
                  <option value="">Selecione um estudo...</option>
                  {allStudiesSorted.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
           )}

           {reportType === 'quantity' && (
              <div className="flex flex-col gap-1 w-full md:w-48 animate-in fade-in slide-in-from-left-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Quantidade Mínima</label>
                <input 
                  type="number" 
                  className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-white shadow-sm" 
                  placeholder="Ex: 5"
                  value={reportValue}
                  onChange={e => setReportValue(e.target.value)}
                />
              </div>
           )}

           <div className="ml-auto">
              <button 
                disabled={reportType === 'none' || !reportValue}
                onClick={() => setIsPrintingReport(true)}
                className="bg-[#007b63] disabled:opacity-30 disabled:cursor-not-allowed text-white px-8 py-2 rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-[#005a48] transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Gerar PDF
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
