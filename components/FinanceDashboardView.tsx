import React, { useState, useEffect } from 'react';
import { FinancialTransaction, CompanyAsset, VacationRecord, TeamMember, TransactionCategory, InventoryItem } from '../types';
import { db } from '../database';

interface FinanceDashboardViewProps {
  onShowSuccess: (title: string, message: string) => void;
  initialTab?: Tab;
  hideTabs?: boolean;
}

export type Tab = 'RESUMO' | 'TRANSACOES' | 'PATRIMONIO' | 'FERIAS';

export const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({ onShowSuccess, initialTab = 'RESUMO', hideTabs = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [vacations, setVacations] = useState<VacationRecord[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);

  // Modals state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);

  // Form states
  const [transactionForm, setTransactionForm] = useState<Partial<FinancialTransaction>>({ type: 'EXPENSE', status: 'PENDING' });
  const [assetForm, setAssetForm] = useState<Partial<CompanyAsset>>({ status: 'ACTIVE' });
  const [vacationForm, setVacationForm] = useState<Partial<VacationRecord>>({ status: 'PLANNED' });
  
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadData = async () => {
    setTransactions(await db.getAll('transactions'));
    setAssets(await db.getAll('assets'));
    setVacations(await db.getAll('vacations'));
    setTeam(await db.getAll('team-members'));
    
    let cats = await db.getAll<TransactionCategory>('transaction_categories');
    if (cats.length === 0) {
      const defaultCats = [
        { id: 'cat_1', name: 'Medicamento' },
        { id: 'cat_2', name: 'Material hospitalar' },
        { id: 'cat_3', name: 'Material Geral' }
      ];
      for (const c of defaultCats) {
        await db.upsert('transaction_categories', c);
      }
      cats = defaultCats;
    }
    setCategories(cats);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newCat: TransactionCategory = { id: Math.random().toString(36).substr(2, 9), name: newCategoryName.trim() };
    await db.upsert('transaction_categories', newCat);
    setCategories([...categories, newCat]);
    setTransactionForm({...transactionForm, category: newCat.name});
    setNewCategoryName('');
    setShowNewCategoryInput(false);
  };

  const handleSaveTransaction = async () => {
    if (!transactionForm.description || !transactionForm.amount || !transactionForm.date) return;
    
    // Ensure ID exists
    const txToSave = {
      ...transactionForm,
      id: transactionForm.id || Math.random().toString(36).substr(2, 9)
    };
    
    await db.upsert('transactions', txToSave);
    
    // Save items to inventory if they exist
    if (txToSave.items && txToSave.items.length > 0) {
      for (const item of txToSave.items) {
        const invItem: InventoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          description: item.description,
          quantity: item.quantity,
          value: item.value,
          invoiceNumber: txToSave.invoiceNumber,
          transactionId: txToSave.id,
          category: txToSave.category || 'Material Geral',
          status: 'ACTIVE'
        };
        await db.upsert('estoque_geral', invItem);
      }
    }
    
    onShowSuccess('Salvo', 'Transação salva com sucesso.');
    setShowTransactionModal(false);
    setTransactionForm({ type: 'EXPENSE', status: 'PENDING' });
    loadData();
  };

  const handleCancelTransaction = async (t: FinancialTransaction) => {
    if (window.confirm('Deseja realmente cancelar esta NF? Os itens do estoque darão saída automaticamente.')) {
      const updatedTx = { ...t, isCancelled: true };
      await db.upsert('transactions', updatedTx);
      
      // Cancel inventory items
      const allInventory = await db.getAll<InventoryItem>('estoque_geral');
      const txItems = allInventory.filter(i => i.transactionId === t.id && i.status === 'ACTIVE');
      
      for (const item of txItems) {
        await db.upsert('estoque_geral', {
          ...item,
          status: 'CANCELLED',
          obs: 'Saída por motivo de cancelamento da NF'
        });
      }
      
      onShowSuccess('Cancelado', 'NF cancelada e itens removidos do estoque.');
      loadData();
    }
  };

  const getTransactionStatus = (t: FinancialTransaction) => {
    if (t.isCancelled) return 'CANCELLED';
    
    const totalPaid = (t.payments || []).reduce((acc, p) => acc + p.amount, 0);
    if (totalPaid >= t.amount) return 'PAID';
    
    if (t.dueDate && new Date() > new Date(t.dueDate)) return 'OVERDUE';
    
    return 'PENDING';
  };

  const handleSaveAsset = async () => {
    if (!assetForm.name || !assetForm.code || !assetForm.purchaseValue) return;
    await db.upsert('assets', assetForm);
    onShowSuccess('Salvo', 'Bem patrimonial salvo com sucesso.');
    setShowAssetModal(false);
    setAssetForm({ status: 'ACTIVE' });
    loadData();
  };

  const handleSaveVacation = async () => {
    if (!vacationForm.employeeId || !vacationForm.startDate || !vacationForm.endDate) return;
    await db.upsert('vacations', vacationForm);
    onShowSuccess('Salvo', 'Férias salvas com sucesso.');
    setShowVacationModal(false);
    setVacationForm({ status: 'PLANNED' });
    loadData();
  };

  const handleDelete = async (collection: string, id: string) => {
    if (window.confirm('Deseja realmente excluir este registro?')) {
      await db.delete(collection, id);
      onShowSuccess('Excluído', 'Registro excluído com sucesso.');
      loadData();
    }
  };

  // --- Resumo Calculations ---
  const totalReceitas = transactions.filter(t => t.type === 'INCOME' && getTransactionStatus(t) === 'PAID').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalDespesas = transactions.filter(t => t.type === 'EXPENSE' && getTransactionStatus(t) === 'PAID').reduce((acc, t) => acc + Number(t.amount), 0);
  const saldoAtual = totalReceitas - totalDespesas;
  
  const aReceber = transactions.filter(t => t.type === 'INCOME' && getTransactionStatus(t) === 'PENDING').reduce((acc, t) => acc + Number(t.amount), 0);
  const aPagar = transactions.filter(t => t.type === 'EXPENSE' && getTransactionStatus(t) === 'PENDING').reduce((acc, t) => acc + Number(t.amount), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getTitle = () => {
    if (!hideTabs) return 'Painel Financeiro';
    switch (activeTab) {
      case 'TRANSACOES': return 'Lançamentos & NFs';
      case 'PATRIMONIO': return 'Controle Patrimonial';
      case 'FERIAS': return 'Controle de Férias';
      default: return 'Painel Financeiro';
    }
  };

  const getSubtitle = () => {
    if (!hideTabs) return 'Gestão de fluxo de caixa, patrimônio e RH';
    switch (activeTab) {
      case 'TRANSACOES': return 'Gestão de fluxo de caixa e notas fiscais';
      case 'PATRIMONIO': return 'Gestão de bens e ativos da empresa';
      case 'FERIAS': return 'Gestão de períodos de descanso da equipe';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-[#007b63] text-white p-6 shadow-md z-10">
        <h1 className="text-2xl font-bold tracking-tight">{getTitle()}</h1>
        <p className="text-white/80 text-sm mt-1">{getSubtitle()}</p>
      </div>

      {/* Tabs */}
      {!hideTabs && (
        <div className="flex border-b border-gray-200 bg-white px-6">
          {[
            { id: 'RESUMO', label: 'Resumo' },
            { id: 'TRANSACOES', label: 'Lançamentos & NFs' },
            { id: 'PATRIMONIO', label: 'Patrimônio' },
            { id: 'FERIAS', label: 'Controle de Férias' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === tab.id 
                  ? 'border-[#007b63] text-[#007b63]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* TAB: RESUMO */}
        {activeTab === 'RESUMO' && (
          <div className="flex flex-col gap-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-2">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Saldo Atual</span>
                <span className={`text-3xl font-black ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(saldoAtual)}
                </span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-2">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">A Receber</span>
                <span className="text-3xl font-black text-blue-600">{formatCurrency(aReceber)}</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-2">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">A Pagar</span>
                <span className="text-3xl font-black text-orange-600">{formatCurrency(aPagar)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Últimas Transações</h3>
                <div className="flex flex-col gap-3">
                  {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-800">{t.description}</span>
                        <span className="text-xs text-gray-500">{t.date.split('-').reverse().join('/')} • {t.category}</span>
                      </div>
                      <span className={`font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">Nenhuma transação registrada.</p>}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Próximas Férias</h3>
                <div className="flex flex-col gap-3">
                  {vacations.filter(v => v.status === 'PLANNED').sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 5).map(v => {
                    const employee = team.find(t => t.id === v.employeeId);
                    return (
                      <div key={v.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-800">{employee?.name || 'Desconhecido'}</span>
                          <span className="text-xs text-gray-500">{employee?.role || '-'}</span>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className="font-bold text-sm text-[#007b63]">{v.startDate.split('-').reverse().join('/')}</span>
                          <span className="text-xs text-gray-500">até {v.endDate.split('-').reverse().join('/')}</span>
                        </div>
                      </div>
                    );
                  })}
                  {vacations.filter(v => v.status === 'PLANNED').length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">Nenhuma férias programada.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: TRANSACOES */}
        {activeTab === 'TRANSACOES' && (
          <div className="flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Lançamentos Financeiros</h2>
              <button onClick={() => { setTransactionForm({ type: 'EXPENSE', status: 'PENDING' }); setShowTransactionModal(true); }} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase hover:bg-[#005a48] transition-colors">
                + Novo Lançamento
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">NF</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => {
                    const displayStatus = getTransactionStatus(t);
                    
                    return (
                      <tr key={t.id} className={`hover:bg-gray-50 ${t.isCancelled ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.date.split('-').reverse().join('/')}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{t.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.invoiceNumber || '-'}</td>
                        <td className={`px-4 py-3 text-sm font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span 
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                              displayStatus === 'PAID' ? 'bg-green-100 text-green-700' : 
                              displayStatus === 'OVERDUE' ? 'bg-red-100 text-red-700' : 
                              displayStatus === 'CANCELLED' ? 'bg-gray-200 text-gray-600' :
                              'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {displayStatus === 'PAID' ? 'Pago' : displayStatus === 'OVERDUE' ? 'Atrasado' : displayStatus === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <button onClick={() => { setTransactionForm(t); setShowTransactionModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3 font-medium text-xs" disabled={t.isCancelled}>Editar</button>
                          {!t.isCancelled && (
                            <button onClick={() => handleCancelTransaction(t)} className="text-red-600 hover:text-red-800 font-medium text-xs">Cancelar</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500 text-sm">Nenhum lançamento encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PATRIMONIO */}
        {activeTab === 'PATRIMONIO' && (
          <div className="flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Controle Patrimonial</h2>
              <button onClick={() => { setAssetForm({ status: 'ACTIVE' }); setShowAssetModal(true); }} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase hover:bg-[#005a48] transition-colors">
                + Novo Bem
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Nome/Descrição</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Data Compra</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Valor Compra</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Localização</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assets.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{a.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{a.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.purchaseDate.split('-').reverse().join('/')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(a.purchaseValue)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.location}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                          a.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {a.status === 'ACTIVE' ? 'Ativo' : a.status === 'MAINTENANCE' ? 'Manutenção' : 'Baixado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <button onClick={() => { setAssetForm(a); setShowAssetModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3 font-medium text-xs">Editar</button>
                        <button onClick={() => handleDelete('assets', a.id)} className="text-red-600 hover:text-red-800 font-medium text-xs">Excluir</button>
                      </td>
                    </tr>
                  ))}
                  {assets.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500 text-sm">Nenhum bem patrimonial encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: FERIAS */}
        {activeTab === 'FERIAS' && (
          <div className="flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Controle de Férias</h2>
              <button onClick={() => { setVacationForm({ status: 'PLANNED' }); setShowVacationModal(true); }} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase hover:bg-[#005a48] transition-colors">
                + Nova Solicitação
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Funcionário</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Função</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Início</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Fim</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Dias</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vacations.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(v => {
                    const employee = team.find(t => t.id === v.employeeId);
                    const days = Math.ceil((new Date(v.endDate).getTime() - new Date(v.startDate).getTime()) / (1000 * 3600 * 24)) + 1;
                    return (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{employee?.name || 'Desconhecido'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{employee?.role || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{v.startDate.split('-').reverse().join('/')}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{v.endDate.split('-').reverse().join('/')}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{days} dias</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            v.status === 'TAKEN' ? 'bg-green-100 text-green-700' : 
                            v.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {v.status === 'TAKEN' ? 'Gozadas' : v.status === 'CANCELLED' ? 'Canceladas' : 'Programadas'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <button onClick={() => { setVacationForm(v); setShowVacationModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3 font-medium text-xs">Editar</button>
                          <button onClick={() => handleDelete('vacations', v.id)} className="text-red-600 hover:text-red-800 font-medium text-xs">Excluir</button>
                        </td>
                      </tr>
                    );
                  })}
                  {vacations.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500 text-sm">Nenhuma férias encontrada.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODALS */}
      
      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-[#007b63] text-white py-3 px-6 flex justify-between items-center">
              <h3 className="font-bold">{transactionForm.id ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button onClick={() => setShowTransactionModal(false)} className="text-white/80 hover:text-white">&times;</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Tipo</label>
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={transactionForm.type} onChange={e => setTransactionForm({...transactionForm, type: e.target.value as any})}>
                    <option value="INCOME">Receita (Entrada)</option>
                    <option value="EXPENSE">Despesa (Saída)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Status</label>
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={transactionForm.status} onChange={e => setTransactionForm({...transactionForm, status: e.target.value as any})}>
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago/Recebido</option>
                    <option value="OVERDUE">Atrasado</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Data</label>
                  <input type="date" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={transactionForm.date || ''} onChange={e => setTransactionForm({...transactionForm, date: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Valor (R$)</label>
                  <input type="number" step="0.01" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={transactionForm.amount || ''} onChange={e => setTransactionForm({...transactionForm, amount: Number(e.target.value)})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Data de Vencimento</label>
                  <input type="date" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={transactionForm.dueDate || ''} onChange={e => setTransactionForm({...transactionForm, dueDate: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Descrição</label>
                  <input type="text" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={transactionForm.description || ''} onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Categoria</label>
                    <button onClick={() => setShowNewCategoryInput(!showNewCategoryInput)} className="text-[#007b63] hover:text-[#006b56] font-bold text-xs" title="Adicionar Categoria">+</button>
                  </div>
                  {showNewCategoryInput ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Nova categoria" 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1" 
                        value={newCategoryName} 
                        onChange={e => setNewCategoryName(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                      />
                      <button onClick={handleAddCategory} className="bg-[#007b63] text-white px-3 py-2 rounded-md text-sm font-bold">OK</button>
                    </div>
                  ) : (
                    <select 
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm" 
                      value={transactionForm.category || ''} 
                      onChange={e => setTransactionForm({...transactionForm, category: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Número da NF</label>
                  <input type="text" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={transactionForm.invoiceNumber || ''} onChange={e => setTransactionForm({...transactionForm, invoiceNumber: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Fornecedor / Cliente</label>
                  <input type="text" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={transactionForm.entity || ''} onChange={e => setTransactionForm({...transactionForm, entity: e.target.value})} />
                </div>
                
                {/* Itens da NF */}
                <div className="col-span-2 mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Itens da NF</label>
                    <button 
                      onClick={() => {
                        const currentItems = transactionForm.items || [];
                        setTransactionForm({
                          ...transactionForm, 
                          items: [...currentItems, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, value: 0 }]
                        });
                      }}
                      className="text-xs font-bold text-[#007b63] hover:underline"
                    >
                      + Adicionar Item
                    </button>
                  </div>
                  
                  {transactionForm.items && transactionForm.items.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {transactionForm.items.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-100">
                          <input 
                            type="text" 
                            placeholder="Descrição" 
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm flex-1" 
                            value={item.description} 
                            onChange={e => {
                              const newItems = [...(transactionForm.items || [])];
                              newItems[index].description = e.target.value;
                              setTransactionForm({...transactionForm, items: newItems});
                            }} 
                          />
                          <input 
                            type="number" 
                            placeholder="Qtd" 
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm w-20" 
                            value={item.quantity} 
                            onChange={e => {
                              const newItems = [...(transactionForm.items || [])];
                              newItems[index].quantity = Number(e.target.value);
                              setTransactionForm({...transactionForm, items: newItems});
                            }} 
                          />
                          <input 
                            type="number" 
                            step="0.01" 
                            placeholder="Valor" 
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm w-24" 
                            value={item.value} 
                            onChange={e => {
                              const newItems = [...(transactionForm.items || [])];
                              newItems[index].value = Number(e.target.value);
                              setTransactionForm({...transactionForm, items: newItems});
                            }} 
                          />
                          <button 
                            onClick={() => {
                              const newItems = transactionForm.items?.filter((_, i) => i !== index);
                              setTransactionForm({...transactionForm, items: newItems});
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">Nenhum item adicionado.</div>
                  )}
                </div>
                
                {/* Pagamentos */}
                <div className="col-span-2 mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Lançamento de Pagamento</label>
                    <button 
                      onClick={() => {
                        const currentPayments = transactionForm.payments || [];
                        setTransactionForm({
                          ...transactionForm, 
                          payments: [...currentPayments, { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString().split('T')[0], amount: 0, method: '' }]
                        });
                      }}
                      className="text-xs font-bold text-[#007b63] hover:underline"
                    >
                      + Adicionar Pagamento
                    </button>
                  </div>
                  
                  {transactionForm.payments && transactionForm.payments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {transactionForm.payments.map((payment, index) => (
                        <div key={payment.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-100">
                          <input 
                            type="date" 
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm w-32" 
                            value={payment.date} 
                            onChange={e => {
                              const newPayments = [...(transactionForm.payments || [])];
                              newPayments[index].date = e.target.value;
                              setTransactionForm({...transactionForm, payments: newPayments});
                            }} 
                          />
                          <input 
                            type="number" 
                            step="0.01" 
                            placeholder="Valor" 
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm w-24" 
                            value={payment.amount} 
                            onChange={e => {
                              const newPayments = [...(transactionForm.payments || [])];
                              newPayments[index].amount = Number(e.target.value);
                              setTransactionForm({...transactionForm, payments: newPayments});
                            }} 
                          />
                          <input 
                            type="text" 
                            placeholder="Método (ex: PIX, Boleto)" 
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm flex-1" 
                            value={payment.method || ''} 
                            onChange={e => {
                              const newPayments = [...(transactionForm.payments || [])];
                              newPayments[index].method = e.target.value;
                              setTransactionForm({...transactionForm, payments: newPayments});
                            }} 
                          />
                          <button 
                            onClick={() => {
                              const newPayments = transactionForm.payments?.filter((_, i) => i !== index);
                              setTransactionForm({...transactionForm, payments: newPayments});
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      <div className="text-right text-xs font-bold text-gray-600 mt-1">
                        Total Pago: {formatCurrency(transactionForm.payments.reduce((acc, p) => acc + p.amount, 0))} / {formatCurrency(transactionForm.amount || 0)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">Nenhum pagamento registrado.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-200">
              <button onClick={() => setShowTransactionModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={handleSaveTransaction} className="px-4 py-2 text-sm font-bold text-white bg-[#007b63] hover:bg-[#005a48] rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-[#007b63] text-white py-3 px-6 flex justify-between items-center">
              <h3 className="font-bold">{assetForm.id ? 'Editar Bem' : 'Novo Bem Patrimonial'}</h3>
              <button onClick={() => setShowAssetModal(false)} className="text-white/80 hover:text-white">&times;</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Código (Placa)</label>
                  <input type="text" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={assetForm.code || ''} onChange={e => setAssetForm({...assetForm, code: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Status</label>
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={assetForm.status} onChange={e => setAssetForm({...assetForm, status: e.target.value as any})}>
                    <option value="ACTIVE">Ativo</option>
                    <option value="MAINTENANCE">Em Manutenção</option>
                    <option value="DISPOSED">Baixado/Descartado</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Nome / Descrição</label>
                  <input type="text" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={assetForm.name || ''} onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Data da Compra</label>
                  <input type="date" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={assetForm.purchaseDate || ''} onChange={e => setAssetForm({...assetForm, purchaseDate: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Valor de Compra (R$)</label>
                  <input type="number" step="0.01" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={assetForm.purchaseValue || ''} onChange={e => setAssetForm({...assetForm, purchaseValue: Number(e.target.value)})} />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Localização</label>
                  <input type="text" placeholder="Ex: Sala 01, Recepção" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={assetForm.location || ''} onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-200">
              <button onClick={() => setShowAssetModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={handleSaveAsset} className="px-4 py-2 text-sm font-bold text-white bg-[#007b63] hover:bg-[#005a48] rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Vacation Modal */}
      {showVacationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-[#007b63] text-white py-3 px-6 flex justify-between items-center">
              <h3 className="font-bold">{vacationForm.id ? 'Editar Férias' : 'Nova Solicitação de Férias'}</h3>
              <button onClick={() => setShowVacationModal(false)} className="text-white/80 hover:text-white">&times;</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Funcionário</label>
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={vacationForm.employeeId || ''} onChange={e => setVacationForm({...vacationForm, employeeId: e.target.value})}>
                    <option value="">Selecione um funcionário...</option>
                    {team.filter(t => t.contractType === 'CLT').map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.role || 'Sem cargo'})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Data de Início</label>
                  <input type="date" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={vacationForm.startDate || ''} onChange={e => setVacationForm({...vacationForm, startDate: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Data de Fim</label>
                  <input type="date" className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={vacationForm.endDate || ''} onChange={e => setVacationForm({...vacationForm, endDate: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Status</label>
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={vacationForm.status} onChange={e => setVacationForm({...vacationForm, status: e.target.value as any})}>
                    <option value="PLANNED">Programadas</option>
                    <option value="TAKEN">Gozadas</option>
                    <option value="CANCELLED">Canceladas</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Observações</label>
                  <textarea className="border border-gray-300 rounded-md px-3 py-2 text-sm resize-none h-20" value={vacationForm.notes || ''} onChange={e => setVacationForm({...vacationForm, notes: e.target.value})}></textarea>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-200">
              <button onClick={() => setShowVacationModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={handleSaveVacation} className="px-4 py-2 text-sm font-bold text-white bg-[#007b63] hover:bg-[#005a48] rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
