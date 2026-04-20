
import React, { useState, useEffect } from 'react';
import { User, UserProfile } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';

interface UserListViewProps {
  onEditUser?: (user: User) => void;
}

export const UserListView: React.FC<UserListViewProps> = ({ onEditUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const data = await db.getAll<User>('users');
    setUsers(data.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleDelete = async () => {
    if (modalConfig.id) {
      await db.delete('users', modalConfig.id);
      await fetchUsers();
    }
    setModalConfig({ isOpen: false, id: null });
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita acionar a edição da linha
    setModalConfig({ isOpen: true, id });
  };

  const getProfileLabel = (p: UserProfile) => {
    return p;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-6 bg-white h-full">
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title="Excluir Usuário"
        message="Tem certeza que deseja excluir este usuário? Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setModalConfig({ isOpen: false, id: null })}
      />

      <div className="bg-[#007b63] p-6 text-white rounded-xl shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Relação de Usuários</h2>
          <p className="text-xs font-medium opacity-80 mt-1">Gerenciamento de credenciais do sistema</p>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded text-xs font-bold">
          {users.length} Registros
        </div>
      </div>

      <div className="flex-1 overflow-hidden border rounded-xl bg-white shadow-sm flex flex-col">
         <div className="overflow-y-auto flex-1 p-0">
           {users.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-gray-400 italic text-sm">
               Nenhum usuário encontrado.
             </div>
           ) : (
             <table className="w-full text-left text-sm border-collapse">
               <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200 sticky top-0 z-10">
                 <tr>
                   <th className="px-6 py-3">Nome</th>
                   <th className="px-6 py-3">Login</th>
                   <th className="px-6 py-3">Função</th>
                   <th className="px-6 py-3">Perfil</th>
                   <th className="px-6 py-3">Status</th>
                   <th className="px-6 py-3 text-right">Ação</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {users.map(user => (
                   <tr 
                     key={user.id} 
                     className="hover:bg-gray-50 transition-colors cursor-pointer group"
                     onClick={() => onEditUser && onEditUser(user)}
                     title="Clique para editar"
                   >
                     <td className="px-6 py-4 font-bold text-gray-800 group-hover:text-[#007b63] transition-colors">{user.name}</td>
                     <td className="px-6 py-4 text-gray-600">{user.login}</td>
                     <td className="px-6 py-4 text-gray-600">{user.jobTitle}</td>
                     <td className="px-6 py-4">
                       <span className="bg-[#d1e7e4] text-[#007b63] px-2 py-1 rounded text-[10px] font-bold uppercase border border-[#007b63]/20">
                         {getProfileLabel(user.profile)}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <button 
                         onClick={(e) => confirmDelete(user.id, e)}
                         className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                         title="Excluir Usuário"
                         disabled={user.login === 'admin'} // Protect primary admin if needed
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
      </div>
    </div>
  );
};
