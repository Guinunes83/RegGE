
import React, { useState, useEffect } from 'react';
import { Notice, UserProfile } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';

interface NoticeBoardViewProps {
  userProfile?: UserProfile;
}

export const NoticeBoardView: React.FC<NoticeBoardViewProps> = ({ userProfile }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const data = await db.getAll<Notice>('notices');
    // Ordenar por data (mais recente primeiro, ou lógica que preferir)
    setNotices(data.reverse());
  };

  const handleDelete = async () => {
    if (modalConfig.id) {
      await db.delete('notices', modalConfig.id);
      await fetchNotices();
    }
    setModalConfig({ isOpen: false, id: null });
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalConfig({ isOpen: true, id });
  };

  const isAdmin = true; // userProfile === UserProfile.ADMIN || userProfile === UserProfile.DEVELOPER;

  return (
    <div className="flex flex-col h-full w-full p-8 bg-[#f8f5e6] shadow-inner overflow-hidden relative border border-gray-300 rounded-3xl">
      {/* Texture Background Effect (Corkboard or Wall) */}
      <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      <div className="flex justify-between items-center mb-8 relative z-10 border-b-2 border-dashed border-gray-400 pb-4">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-800" style={{ fontFamily: 'sans-serif' }}>Mural de Avisos</h2>
           <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Recados, Lembretes e Comunicados Internos</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 p-2">
        {notices.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 italic">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-sm font-bold opacity-60">Mural Vazio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {notices.map((notice) => (
              <div 
                key={notice.id} 
                className={`
                   relative p-6 shadow-lg transition-transform hover:scale-105 hover:rotate-0 duration-300
                   ${notice.color}
                   min-h-[200px] flex flex-col justify-between
                `}
                style={{ 
                   transform: `rotate(${Math.random() * 2 - 1}deg)`, // Leve rotação aleatória
                   borderRadius: '2px 2px 20px 2px',
                   boxShadow: '5px 5px 15px rgba(0,0,0,0.1)'
                }}
              >
                {/* Pin visual effect */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-800 shadow-md border-2 border-red-900 z-20"></div>

                <div>
                  <h3 className="text-xl font-bold leading-tight mb-1 break-words">{notice.title}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-4 border-b border-black/10 pb-1">
                    De: {notice.sector}
                  </p>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words text-justify">
                    {notice.message}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-black/5 flex justify-between items-end">
                  <span className="text-[10px] font-bold opacity-50">{notice.date}</span>
                  {isAdmin && (
                    <button 
                      onClick={(e) => confirmDelete(notice.id, e)}
                      className="p-1 hover:bg-black/10 rounded-full transition-colors text-black/40 hover:text-red-700"
                      title="Remover Aviso"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title="Remover Aviso"
        message="Deseja remover este aviso do mural?"
        onConfirm={handleDelete}
        onCancel={() => setModalConfig({ isOpen: false, id: null })}
      />
    </div>
  );
};
