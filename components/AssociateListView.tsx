import React, { useState, useEffect } from 'react';
import { Associate } from '../types';
import { db } from '../database';

interface AssociateListViewProps {
  onNavigate: (view: any, props?: any) => void;
  isReadOnly?: boolean;
}

export const AssociateListView: React.FC<AssociateListViewProps> = ({ onNavigate, isReadOnly }) => {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    loadAssociates();
  }, []);

  const loadAssociates = async () => {
    const data = await db.getAll<Associate>('associates');
    setAssociates(data);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getDynamicStatus = (a: Associate) => {
    if (a.status === 'Inativo' || a.status === 'Recadastro') return a.status;
    
    if (!a.paymentsJson) return 'ATIVO';
    try {
      const payments = JSON.parse(a.paymentsJson);
      const now = new Date();
      // Drop time to just compare date accurately
      now.setHours(0,0,0,0);
      
      const hasOverdue = payments.some((p: any) => {
        if (p.status !== 'Pendente') return false;
        if (!p.monthYear) return false;
        const parts = p.monthYear.split('/');
        if (parts.length === 3) {
          const dueDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
          return dueDate < now;
        }
        return false;
      });
      return hasOverdue ? 'Pendente' : 'ATIVO';
    } catch (e) {
      return a.status || 'ATIVO';
    }
  };

  const dynamicAssociates = associates.map(a => ({ ...a, computedStatus: getDynamicStatus(a) }));

  const getSortedData = () => {
    let data = dynamicAssociates;
    if (!sortConfig) return data;
    return [...data].sort((a: any, b: any) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';
      if (sortConfig.key === 'status') {
         valA = a.computedStatus;
         valB = b.computedStatus;
      }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const ativos = dynamicAssociates.filter(a => a.computedStatus === 'ATIVO').length;
  const inativos = dynamicAssociates.filter(a => a.computedStatus === 'Inativo').length;
  const recadastros = dynamicAssociates.filter(a => a.computedStatus === 'Recadastro').length;
  const pendentes = dynamicAssociates.filter(a => a.computedStatus === 'Pendente').length;

  const HeaderCell = ({ label, sortKey }: { label: string, sortKey?: string }) => (
    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors" onClick={() => sortKey && handleSort(sortKey)}>
      <div className="flex items-center gap-1">
        {label}
        {sortKey && <span className="opacity-50">⇅</span>}
      </div>
    </th>
  );

  return (
    <div className="flex flex-col gap-6 p-6 h-full w-full">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Controle de Sócios</h2>
        {!isReadOnly && (
          <button 
            onClick={() => onNavigate('Associates', { mode: 'edit' })} 
            className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase hover:bg-[#005a48] transition-colors"
          >
            + Novo Sócio
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#007b63] text-white p-4 rounded-xl shadow-md flex justify-between items-center">
          <span className="font-bold uppercase tracking-wider">Ativos</span>
          <span className="text-3xl font-black">{ativos}</span>
        </div>
        <div className="bg-red-500 text-white p-4 rounded-xl shadow-md flex justify-between items-center">
          <span className="font-bold uppercase tracking-wider">Pendentes</span>
          <span className="text-3xl font-black">{pendentes}</span>
        </div>
        <div className="bg-gray-600 text-white p-4 rounded-xl shadow-md flex justify-between items-center">
          <span className="font-bold uppercase tracking-wider">Inativos</span>
          <span className="text-3xl font-black">{inativos}</span>
        </div>
        <div className="bg-orange-500 text-white p-4 rounded-xl shadow-md flex justify-between items-center">
          <span className="font-bold uppercase tracking-wider">Recadastros</span>
          <span className="text-3xl font-black">{recadastros}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm flex-1 overflow-y-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-[#007b63] text-white sticky top-0 z-10">
            <tr>
              <HeaderCell label="Nome" sortKey="name" />
              <HeaderCell label="Tipo Associado" sortKey="associateType" />
              <HeaderCell label="Venc. Mens" sortKey="dueDay" />
              <HeaderCell label="Telefone" sortKey="phone1" />
              <HeaderCell label="Função" sortKey="role" />
              <HeaderCell label="Email" sortKey="email" />
              <HeaderCell label="Status" sortKey="status" />
              <HeaderCell label="Sócio Desde" sortKey="memberSince" />
              <HeaderCell label="CPF" sortKey="cpf" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {getSortedData().map((a: any) => (
              <tr 
                key={a.id} 
                onClick={() => onNavigate('Associates', { mode: 'view', associate: a })} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-sm font-bold text-blue-600">{a.name}</td>
                <td className="px-4 py-3 text-sm">{a.associateType}</td>
                <td className="px-4 py-3 text-sm">{a.dueDay}</td>
                <td className="px-4 py-3 text-sm">{a.phone1}</td>
                <td className="px-4 py-3 text-sm">{a.role}</td>
                <td className="px-4 py-3 text-sm">{a.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    a.computedStatus === 'ATIVO' ? 'bg-green-100 text-green-700' : 
                    a.computedStatus === 'Pendente' ? 'bg-red-100 text-red-700' : 
                    a.computedStatus === 'Inativo' ? 'bg-gray-200 text-gray-700' : 
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {a.computedStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{a.memberSince ? a.memberSince.split('-').reverse().join('/') : ''}</td>
                <td className="px-4 py-3 text-sm">{a.cpf}</td>
              </tr>
            ))}
            {associates.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Nenhum associado cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
