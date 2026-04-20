
import React, { useState, useEffect } from 'react';
import { CEPCalendarEntry } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';

export const CEPCalendarView: React.FC = () => {
  const [events, setEvents] = useState<CEPCalendarEntry[]>([]);
  const [formData, setFormData] = useState<Partial<CEPCalendarEntry>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const data = await db.getAll<CEPCalendarEntry>('cepCalendar');
    // Ordenar por data da reunião (mais recente primeiro)
    setEvents(data.sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)));
  };

  const handleSave = async () => {
    if (!formData.meetingDate || !formData.submissionDeadline) {
      alert("As datas de Reunião e Prazo de Submissão são obrigatórias.");
      return;
    }

    const entry: CEPCalendarEntry = {
      id: formData.id || Math.random().toString(36).substr(2, 9),
      month: formData.month || '', // Pode ser opcional, ou preenchido automaticamente
      meetingDate: formData.meetingDate,
      submissionDeadline: formData.submissionDeadline,
      notes: formData.notes
    };

    // Preencher Mês/Ano automaticamente se não inserido
    if (!entry.month) {
        const dateObj = new Date(entry.meetingDate);
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        entry.month = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }

    await db.upsert('cepCalendar', entry);
    setFormData({});
    setIsEditing(false);
    fetchEvents();
  };

  const handleEdit = (entry: CEPCalendarEntry) => {
    setFormData({ ...entry });
    setIsEditing(true);
  };

  const confirmDelete = (id: string) => {
    setModalConfig({ isOpen: true, id });
  };

  const handleDelete = async () => {
    if (modalConfig.id) {
      await db.delete('cepCalendar', modalConfig.id);
      if (formData.id === modalConfig.id) {
        setFormData({});
        setIsEditing(false);
      }
      fetchEvents();
    }
    setModalConfig({ isOpen: false, id: null });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return dateStr.split('-').reverse().join('/');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-6 bg-white h-full">
      {/* Formulário de Cadastro */}
      <div className="bg-[#d1e7e4]/20 border border-[#007b63]/10 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
         <h3 className="text-[#007b63] font-black uppercase text-xs tracking-widest border-b border-[#007b63]/20 pb-2">
            {isEditing ? 'Editar Data' : 'Agendar Nova Reunião'}
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
           <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Data da Reunião</label>
              <input 
                type="date"
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]"
                value={formData.meetingDate || ''}
                onChange={e => setFormData({ ...formData, meetingDate: e.target.value })}
              />
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Prazo Submissão</label>
              <input 
                type="date"
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]"
                value={formData.submissionDeadline || ''}
                onChange={e => setFormData({ ...formData, submissionDeadline: e.target.value })}
              />
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Obs (Opcional)</label>
              <input 
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]"
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ex: Última do ano"
              />
           </div>
           
           <div className="flex gap-2">
             {isEditing && (
               <button 
                 onClick={() => { setFormData({}); setIsEditing(false); }}
                 className="bg-gray-400 hover:bg-gray-500 text-white w-10 h-[38px] rounded flex items-center justify-center font-bold text-lg shadow-md transition-colors"
                 title="Cancelar"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             )}
             <button 
               onClick={handleSave}
               className={`text-white w-full h-[38px] rounded flex items-center justify-center font-bold text-xs uppercase shadow-md transition-colors ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#007b63] hover:bg-[#005a48]'}`}
             >
               {isEditing ? 'Atualizar' : 'Agendar'}
             </button>
           </div>
         </div>
      </div>

      {/* Listagem */}
      <div className="flex-1 overflow-hidden border rounded-xl bg-white shadow-sm flex flex-col">
         <div className="bg-[#007b63] text-white uppercase tracking-tighter text-xs font-bold px-4 py-3 flex justify-between items-center sticky top-0 z-10">
           <span>Calendário de Reuniões Mensais</span>
           <span className="opacity-70 font-normal normal-case">{events.length} agendamentos</span>
         </div>
         <div className="overflow-y-auto flex-1 p-0">
           {events.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-gray-400 italic text-sm">
               Nenhuma reunião agendada.
             </div>
           ) : (
             <table className="w-full text-left text-sm border-collapse">
               <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                 <tr>
                   <th className="px-4 py-2">Mês de Referência</th>
                   <th className="px-4 py-2">Data da Reunião</th>
                   <th className="px-4 py-2">Prazo Submissão</th>
                   <th className="px-4 py-2">Observações</th>
                   <th className="px-4 py-2 text-right">Ação</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {events.map(ev => {
                   const isPast = new Date(ev.meetingDate) < new Date();
                   return (
                     <tr key={ev.id} className={`transition-colors group ${formData.id === ev.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                       <td className="px-4 py-3 font-bold text-gray-800">{ev.month}</td>
                       <td className="px-4 py-3">
                         <span className={`px-2 py-1 rounded font-bold ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                           {formatDate(ev.meetingDate)}
                         </span>
                       </td>
                       <td className="px-4 py-3 font-medium text-red-600">{formatDate(ev.submissionDeadline)}</td>
                       <td className="px-4 py-3 text-gray-500 italic text-xs">{ev.notes || '-'}</td>
                       <td className="px-4 py-3 text-right">
                         <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => handleEdit(ev)}
                             className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                             title="Editar"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                           </button>
                           <button 
                             onClick={() => confirmDelete(ev.id)}
                             className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                             title="Excluir"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                         </div>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           )}
         </div>
      </div>

      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title="Excluir Agendamento"
        message="Tem certeza que deseja remover esta data do calendário?"
        onConfirm={handleDelete}
        onCancel={() => setModalConfig({ isOpen: false, id: null })}
      />
    </div>
  );
};
