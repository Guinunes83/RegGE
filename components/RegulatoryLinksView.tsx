
import React, { useState, useEffect } from 'react';
import { RegulatoryLinkEntry } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';

export const RegulatoryLinksView: React.FC = () => {
  const [links, setLinks] = useState<RegulatoryLinkEntry[]>([]);
  const [newLink, setNewLink] = useState<Partial<RegulatoryLinkEntry>>({});
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const data = await db.getAll<RegulatoryLinkEntry>('regulatoryLinks');
    setLinks(data.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleSaveLink = async () => {
    if (!newLink.name || !newLink.url) {
      alert("Nome da Plataforma e Link são obrigatórios.");
      return;
    }

    let formattedUrl = newLink.url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
    }

    const entry: RegulatoryLinkEntry = {
      id: newLink.id || Math.random().toString(36).substr(2, 9),
      name: newLink.name,
      notes: newLink.notes,
      url: formattedUrl
    };

    await db.upsert('regulatoryLinks', entry);
    setNewLink({});
    fetchLinks();
  };

  const handleEdit = (link: RegulatoryLinkEntry) => {
    setNewLink({ ...link });
  };

  const handleCancelEdit = () => {
    setNewLink({});
  };

  const confirmDelete = (id: string) => {
    setModalConfig({ isOpen: true, id });
  };

  const handleDelete = async () => {
    if (modalConfig.id) {
      await db.delete('regulatoryLinks', modalConfig.id);
      if (newLink.id === modalConfig.id) {
        setNewLink({});
      }
      fetchLinks();
    }
    setModalConfig({ isOpen: false, id: null });
  };

  const isEditing = !!newLink.id;

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-6 bg-white h-full">
      <div className="bg-[#d1e7e4]/20 border border-[#007b63]/10 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
         <h3 className="text-[#007b63] font-black uppercase text-xs tracking-widest border-b border-[#007b63]/20 pb-2">
            {isEditing ? 'Editar Cadastro' : 'Novo Cadastro'}
         </h3>
         <div className="flex flex-col md:flex-row gap-3 items-end">
           <div className="flex flex-col gap-1 w-full md:w-1/3">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Nome da Plataforma</label>
              <input 
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]"
                value={newLink.name || ''}
                onChange={e => setNewLink({ ...newLink, name: e.target.value })}
                placeholder="Ex: Plataforma Brasil"
              />
           </div>
           <div className="flex flex-col gap-1 w-full md:w-1/3">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Obs.:</label>
              <input 
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]"
                value={newLink.notes || ''}
                onChange={e => setNewLink({ ...newLink, notes: e.target.value })}
                placeholder="Ex: Utilizar login institucional"
              />
           </div>
           <div className="flex flex-col gap-1 w-full md:w-1/3">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Link</label>
              <input 
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#007b63]"
                value={newLink.url || ''}
                onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="www.exemplo.com.br"
              />
           </div>
           
           <div className="flex gap-2">
             {isEditing && (
               <button 
                 onClick={handleCancelEdit}
                 className="bg-gray-400 hover:bg-gray-500 text-white w-10 h-[38px] rounded flex items-center justify-center font-bold text-lg shadow-md transition-colors"
                 title="Cancelar Edição"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             )}
             <button 
               onClick={handleSaveLink}
               className={`text-white w-10 h-[38px] rounded flex items-center justify-center font-bold text-lg shadow-md transition-colors ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#007b63] hover:bg-[#005a48]'}`}
               title={isEditing ? "Salvar Alterações" : "Adicionar"}
             >
               {isEditing ? (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               ) : (
                 '+'
               )}
             </button>
           </div>
         </div>
      </div>

      <div className="flex-1 overflow-hidden border rounded-xl bg-white shadow-sm flex flex-col">
         <div className="bg-[#007b63] text-white uppercase tracking-tighter text-xs font-bold px-4 py-3 flex justify-between items-center sticky top-0 z-10">
           <span>Links Cadastrados</span>
           <span className="opacity-70 font-normal normal-case">{links.length} registros</span>
         </div>
         <div className="overflow-y-auto flex-1 p-0">
           {links.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-gray-400 italic text-sm">
               <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
               Nenhum link cadastrado.
             </div>
           ) : (
             <table className="w-full text-left text-sm border-collapse">
               <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                 <tr>
                   <th className="px-4 py-2 w-1/4">Plataforma</th>
                   <th className="px-4 py-2 w-1/3">Obs.</th>
                   <th className="px-4 py-2">Link</th>
                   <th className="px-4 py-2 text-right w-24">Ação</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {links.map(link => (
                   <tr key={link.id} className={`transition-colors group ${newLink.id === link.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                     <td className="px-4 py-3 font-bold text-gray-800">{link.name}</td>
                     <td className="px-4 py-3 text-gray-600 italic">{link.notes || '-'}</td>
                     <td className="px-4 py-3">
                       <a 
                         href={link.url} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 truncate max-w-[250px]"
                       >
                         <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                         {link.url}
                       </a>
                     </td>
                     <td className="px-4 py-3 text-right">
                       <div className="flex justify-end gap-2">
                         <button 
                           onClick={() => handleEdit(link)}
                           className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                           title="Editar"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                         </button>
                         <button 
                           onClick={() => confirmDelete(link.id)}
                           className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                           title="Excluir"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
      </div>

      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title="Excluir Link"
        message="Tem certeza que deseja remover este link da lista?"
        onConfirm={handleDelete}
        onCancel={() => setModalConfig({ isOpen: false, id: null })}
      />
    </div>
  );
};
