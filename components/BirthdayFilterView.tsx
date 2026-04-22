
import React, { useState, useEffect, useMemo } from 'react';
import { TeamMember } from '../types';
import { db } from '../database';

export const BirthdayFilterView: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      const data = await db.getAll<TeamMember>('team-members');
      setTeamMembers(data);
      
      // Extrair funções únicas
      const roles = Array.from(new Set(data.map(m => m.role).filter(Boolean)));
      setAvailableRoles(roles.sort());
    };
    fetchTeam();
  }, []);

  const toggleRole = (role: string) => {
    const next = new Set(selectedRoles);
    if (next.has(role)) next.delete(role);
    else next.add(role);
    setSelectedRoles(next);
  };

  const selectAll = () => setSelectedRoles(new Set(availableRoles));
  const clearAll = () => setSelectedRoles(new Set());

  // Lógica de Agrupamento e Ordenação
  const groupedMembers = useMemo(() => {
    const isFilterActive = selectedRoles.size > 0;
    
    let filtered = isFilterActive 
        ? teamMembers.filter(m => selectedRoles.has(m.role))
        : teamMembers;

    // Filtrar quem tem data de nascimento
    filtered = filtered.filter(m => m.birthDate);

    // Ordenar por Mês e depois Dia
    filtered.sort((a, b) => {
        const [, monthA, dayA] = a.birthDate.split('-').map(Number);
        const [, monthB, dayB] = b.birthDate.split('-').map(Number);

        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
    });

    // Agrupar por Mês
    const groups: { monthIndex: number; monthName: string; members: TeamMember[] }[] = [];
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    filtered.forEach(member => {
        const [, month] = member.birthDate.split('-').map(Number); // mês é 1-based vindo da string yyyy-mm-dd
        const monthIndex = month - 1; // 0-based para array
        
        let group = groups.find(g => g.monthIndex === monthIndex);
        if (!group) {
            group = { monthIndex, monthName: monthNames[monthIndex], members: [] };
            groups.push(group);
        }
        group.members.push(member);
    });

    return groups; 
  }, [teamMembers, selectedRoles]);

  const getFormattedDay = (dateStr: string) => {
      if (!dateStr) return '-';
      const [, , day] = dateStr.split('-');
      return day;
  };

  const totalCount = groupedMembers.reduce((acc, g) => acc + g.members.length, 0);

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-6 bg-white h-full">
      <div className="bg-[#007b63] p-6 text-white rounded-xl shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Aniversariantes da Equipe</h2>
          <p className="text-xs font-medium opacity-80 mt-1">Filtragem por Função</p>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded text-xs font-bold">
          {totalCount} Encontrados
        </div>
      </div>

      {/* Painel de Filtros */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-widest">Filtrar por Função (Multi-seleção)</h3>
            <div className="flex gap-2">
                <button onClick={selectAll} className="text-[10px] uppercase font-bold text-[#007b63] hover:underline">Selecionar Todos</button>
                <span className="text-gray-300">|</span>
                <button onClick={clearAll} className="text-[10px] uppercase font-bold text-red-500 hover:underline">Limpar</button>
            </div>
         </div>
         <div className="flex flex-wrap gap-2">
            {availableRoles.map(role => (
                <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`
                        px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                        ${selectedRoles.has(role) 
                            ? 'bg-[#007b63] text-white border-[#007b63] shadow-md transform scale-105' 
                            : 'bg-white text-gray-600 border-gray-300 hover:border-[#007b63] hover:text-[#007b63]'}
                    `}
                >
                    {role}
                </button>
            ))}
         </div>
      </div>

      {/* Lista de Resultados */}
      <div className="flex-1 overflow-hidden border rounded-xl bg-white shadow-sm flex flex-col">
         <div className="overflow-y-auto flex-1 p-0">
           {groupedMembers.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-gray-400 italic text-sm">
               Nenhum membro encontrado com os filtros selecionados.
             </div>
           ) : (
             <table className="w-full text-left text-sm border-collapse">
               <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200 sticky top-0 z-10">
                 <tr>
                   <th className="px-6 py-3 w-32">Dia</th>
                   <th className="px-6 py-3">Nome</th>
                   <th className="px-6 py-3">Função</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {groupedMembers.map(group => (
                   <React.Fragment key={group.monthIndex}>
                     {/* Cabeçalho do Mês */}
                     <tr className="bg-[#007b63]/10">
                       <td colSpan={3} className="px-6 py-2 font-bold text-[#007b63] uppercase text-xs tracking-widest border-y border-[#007b63]/20">
                         {group.monthName}
                       </td>
                     </tr>
                     {/* Membros */}
                     {group.members.map(member => (
                       <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-2 font-bold text-gray-500">
                            {getFormattedDay(member.birthDate)}
                         </td>
                         <td className="px-6 py-2 font-medium text-gray-800">
                            {member.name}
                         </td>
                         <td className="px-6 py-2 text-gray-600">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">
                                {member.role}
                            </span>
                         </td>
                       </tr>
                     ))}
                   </React.Fragment>
                 ))}
               </tbody>
             </table>
           )}
         </div>
      </div>
    </div>
  );
};
