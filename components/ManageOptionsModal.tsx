import React, { useState } from 'react';
import { db } from '../database';

interface ManageOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  collection: string; // The database collection to manage
  onUpdate: () => void; // Triggered when an option is added, edited, or deleted
  options: { id: string, name: string }[];
}

export const ManageOptionsModal: React.FC<ManageOptionsModalProps> = ({ isOpen, onClose, title, collection, onUpdate, options }) => {
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (newValue.trim()) {
      const value = newValue.trim();
      const id = Math.random().toString(36).substr(2, 9);
      await db.upsert(collection, { id, name: value });
      setNewValue('');
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    await db.delete(collection, id);
    onUpdate();
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const handleSaveEdit = async () => {
    if (editingId && editValue.trim()) {
      await db.upsert(collection, { id: editingId, name: editValue.trim() });
      setEditingId(null);
      setEditValue('');
      onUpdate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[80vh] overflow-hidden">
        <div className="bg-[#007b63] px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">Gerenciar {title}</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {/* Add New */}
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder={`Nova ${title}...`}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button 
              onClick={handleAdd}
              className="bg-[#007b63] text-white px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-[#005a48] transition-colors"
            >
              Adicionar
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-2">{title}s Cadastradas</h4>
            {options.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">Nenhuma {title.toLowerCase()} listada.</p>
            ) : (
              options.map(opt => (
                <div key={opt.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 group hover:shadow-sm transition-shadow">
                  {editingId === opt.id ? (
                    <div className="flex gap-2 flex-1 mr-2">
                      <input 
                        type="text" 
                        className="flex-1 border border-[#007b63] rounded px-2 py-1 text-sm outline-none"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                        autoFocus
                      />
                      <button onClick={handleSaveEdit} className="text-[#007b63] p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-700">{opt.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(opt.id, opt.name)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Editar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(opt.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Excluir">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
