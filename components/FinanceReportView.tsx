import React, { useState, useEffect } from 'react';
import { FinancialTransaction, TransactionCategory } from '../types';
import { db } from '../database';

export const FinanceReportView: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  
  // Filters
  const [filterInvoice, setFilterInvoice] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDueStartDate, setFilterDueStartDate] = useState('');
  const [filterDueEndDate, setFilterDueEndDate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setTransactions(await db.getAll('transactions'));
      setCategories(await db.getAll('transaction_categories'));
    };
    loadData();
  }, []);

  const getTransactionStatus = (t: FinancialTransaction) => {
    if (t.isCancelled) return 'CANCELLED';
    const totalPaid = (t.payments || []).reduce((acc, p) => acc + p.amount, 0);
    if (totalPaid >= t.amount) return 'PAID';
    if (t.dueDate && new Date() > new Date(t.dueDate)) return 'OVERDUE';
    return 'PENDING';
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterInvoice && !t.invoiceNumber?.toLowerCase().includes(filterInvoice.toLowerCase())) return false;
    if (filterEntity && !t.entity?.toLowerCase().includes(filterEntity.toLowerCase())) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    
    const status = getTransactionStatus(t);
    if (filterStatus && status !== filterStatus) return false;
    
    if (filterStartDate && t.date < filterStartDate) return false;
    if (filterEndDate && t.date > filterEndDate) return false;
    
    if (filterDueStartDate && (!t.dueDate || t.dueDate < filterDueStartDate)) return false;
    if (filterDueEndDate && (!t.dueDate || t.dueDate > filterDueEndDate)) return false;
    
    return true;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h2 className="text-2xl font-black text-[#007b63] uppercase tracking-tighter">Relatório de Lançamentos</h2>
          <button onClick={handlePrint} className="bg-[#007b63] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-[#006b56] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Gerar PDF
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 print:hidden">
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">Número da NF</label>
              <input type="text" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={filterInvoice} onChange={e => setFilterInvoice(e.target.value)} placeholder="Ex: 1234" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">Fornecedor / Cliente</label>
              <input type="text" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={filterEntity} onChange={e => setFilterEntity(e.target.value)} placeholder="Nome" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">Categoria</label>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">Todas</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">Status</label>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="OVERDUE">Atrasado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">Data Lançamento (Início)</label>
              <input type="date" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">Data Lançamento (Fim)</label>
              <input type="date" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">Data Vencimento (Início)</label>
              <input type="date" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={filterDueStartDate} onChange={e => setFilterDueStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">Data Vencimento (Fim)</label>
              <input type="date" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={filterDueEndDate} onChange={e => setFilterDueEndDate(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => {
                setFilterInvoice(''); setFilterEntity(''); setFilterCategory(''); setFilterStatus('');
                setFilterStartDate(''); setFilterEndDate(''); setFilterDueStartDate(''); setFilterDueEndDate('');
              }}
              className="text-xs font-bold text-gray-500 hover:text-gray-700 underline"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8 text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter">GRUPO ELORA</h1>
          <h2 className="text-xl font-bold mt-2">Relatório Financeiro NF's</h2>
          <p className="text-sm text-gray-500 mt-1">Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">NF</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Fornecedor/Cliente</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Categoria</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Lançamento</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Vencimento</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => {
                const status = getTransactionStatus(t);
                return (
                  <tr key={t.id} className={t.isCancelled ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{t.invoiceNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.entity || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.date.split('-').reverse().join('/')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.dueDate ? t.dueDate.split('-').reverse().join('/') : '-'}</td>
                    <td className={`px-4 py-3 text-sm font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase print:border print:border-gray-300 ${
                        status === 'PAID' ? 'bg-green-100 text-green-700' : 
                        status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 
                        status === 'CANCELLED' ? 'bg-gray-200 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {status === 'PAID' ? 'Pago' : status === 'OVERDUE' ? 'Atrasado' : status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 text-sm">Nenhum lançamento encontrado com os filtros atuais.</td>
                </tr>
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-200 font-bold">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right text-sm text-gray-600 uppercase">Total Receitas:</td>
                  <td colSpan={2} className="px-4 py-3 text-sm text-green-600">
                    {formatCurrency(filteredTransactions.filter(t => t.type === 'INCOME' && getTransactionStatus(t) !== 'CANCELLED').reduce((acc, t) => acc + t.amount, 0))}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right text-sm text-gray-600 uppercase">Total Despesas:</td>
                  <td colSpan={2} className="px-4 py-3 text-sm text-red-600">
                    {formatCurrency(filteredTransactions.filter(t => t.type === 'EXPENSE' && getTransactionStatus(t) !== 'CANCELLED').reduce((acc, t) => acc + t.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block { visibility: visible; }
          .print\\:hidden { display: none !important; }
          .flex-1 { overflow: visible !important; }
          .bg-gray-50 { background-color: white !important; }
          .shadow-sm { box-shadow: none !important; border: none !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; visibility: visible; }
          th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          tfoot td { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};
