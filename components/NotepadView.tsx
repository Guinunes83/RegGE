
import React, { useState, useEffect } from 'react';
import { NoteItem } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';

export const NotepadView: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  // Fix: Await the async db.getAll call in useEffect
  useEffect(() => {
    const fetchNotes = async () => {
      const data = await db.getAll<NoteItem>('notes');
      setNotes(data);
    };
    fetchNotes();
  }, []);

  // Fix: Make addNote async and await db operations
  const addNote = async () => {
    const newNote: NoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      completed: false
    };
    await db.upsert('notes', newNote);
    const data = await db.getAll<NoteItem>('notes');
    setNotes(data);
  };

  // Fix: Make updateNote async and await db operations
  const updateNote = async (id: string, updates: Partial<NoteItem>) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      const updated = { ...note, ...updates };
      await db.upsert('notes', updated);
      const data = await db.getAll<NoteItem>('notes');
      setNotes(data);
    }
  };

  const confirmDelete = (id: string) => {
    setModalConfig({ isOpen: true, id });
  };

  // Fix: Make handleDelete async and await db operations
  const handleDelete = async () => {
    if (modalConfig.id) {
      await db.delete('notes', modalConfig.id);
      const data = await db.getAll<NoteItem>('notes');
      setNotes(data);
    }
    setModalConfig({ isOpen: false, id: null });
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-[#fdfcf0] shadow-2xl rounded-3xl overflow-hidden relative border border-gray-200">
      {/* Header Estilizado */}
      <div className="bg-[#007b63] p-6 text-white flex justify-between items-center shadow-md z-10">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Bloco de Notas</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Checklist e Lembretes Rápidos</p>
        </div>
        <div className="text-white/80 p-2 rounded-full cursor-default">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>

      {/* Área de Notas Pautada */}
      <div className="flex-1 overflow-y-auto p-0 relative custom-pauta bg-[#fdfcf0]">
        <div className="absolute left-12 top-0 bottom-0 w-[2px] bg-red-200"></div>
        
        <div className="flex flex-col w-full">
          {notes.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-gray-400 italic text-sm mt-10">
              Nenhuma nota adicionada. Clique no "+" para começar.
            </div>
          ) : (
            notes.map((note) => (
              <div 
                key={note.id} 
                className="flex items-center group h-[48px] border-b border-gray-200 transition-colors hover:bg-black/[0.02]"
              >
                {/* Botão de Exclusão */}
                <div className="w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => confirmDelete(note.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Excluir Linha"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Checkbox */}
                <div className="flex items-center px-2">
                  <input 
                    type="checkbox" 
                    checked={note.completed}
                    onChange={(e) => updateNote(note.id, { completed: e.target.checked })}
                    className="w-5 h-5 accent-[#007b63] cursor-pointer"
                  />
                </div>

                {/* Input de Texto */}
                <input 
                  type="text"
                  value={note.text}
                  onChange={(e) => updateNote(note.id, { text: e.target.value })}
                  placeholder="Escreva algo..."
                  className={`flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium h-full transition-all ${note.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Botão de Adicionar Flutuante */}
      <button 
        onClick={addNote}
        className="absolute bottom-8 right-8 w-14 h-14 bg-[#007b63] text-white rounded-full shadow-2xl hover:bg-[#005a48] hover:scale-110 active:scale-95 transition-all flex items-center justify-center group z-20"
      >
        <svg className="w-8 h-8 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title="Confirmar Exclusão"
        message="Deseja realmente excluir esta linha do bloco de notas?"
        onConfirm={handleDelete}
        onCancel={() => setModalConfig({ isOpen: false, id: null })}
      />

      <style>{`
        .custom-pauta {
          background-image: repeating-linear-gradient(transparent, transparent 47px, #e5e5e5 47px, #e5e5e5 48px);
          line-height: 48px;
        }
      `}</style>
    </div>
  );
};
