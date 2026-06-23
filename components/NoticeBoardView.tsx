
import React, { useState, useEffect } from 'react';
import { Notice, UserProfile as UserProfileType, UserProfile } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';

interface NoticeBoardViewProps {
  userProfile?: UserProfileType;
}

export const NoticeBoardView: React.FC<NoticeBoardViewProps> = ({ userProfile }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState<Partial<Notice>>({
    title: '',
    message: '',
    color: 'bg-yellow-200',
    targetProfiles: Object.values(UserProfile).filter(p => typeof p === 'string') as string[]
  });

  useEffect(() => {
    fetchNotices();
  }, [userProfile]);

  const fetchNotices = async () => {
    const data = await db.getAll<Notice>('notices');
    // Filter notices based on userProfile if provided and not developer/admin
    let filteredData = data;
    if (userProfile && userProfile !== UserProfile.DEVELOPER && userProfile !== UserProfile.ADMIN) {
      filteredData = data.filter(n => !n.targetProfiles || n.targetProfiles.includes(userProfile));
    }
    // Ordenar por data (mais recente primeiro, ou lógica que preferir)
    setNotices(filteredData.reverse());
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

  const handleSaveNotice = async () => {
    if (!newNotice.title || !newNotice.message) return;
    
    const noticeToSave: Notice = {
      id: crypto.randomUUID(),
      title: newNotice.title,
      message: newNotice.message,
      sector: 'Geral', // Or a configurable sector
      date: new Date().toLocaleDateString('pt-BR'),
      color: newNotice.color || 'bg-yellow-200',
      targetProfiles: newNotice.targetProfiles || []
    };

    await db.upsert('notices', noticeToSave);
    await fetchNotices();
    setIsCreateModalOpen(false);
    setNewNotice({
      title: '',
      message: '',
      color: 'bg-yellow-200',
      targetProfiles: Object.values(UserProfile).filter(p => typeof p === 'string') as string[]
    });
  };

  const handleProfileToggle = (profile: string) => {
    setNewNotice(prev => {
      const targets = prev.targetProfiles || [];
      if (targets.includes(profile)) {
        return { ...prev, targetProfiles: targets.filter(p => p !== profile) };
      } else {
        return { ...prev, targetProfiles: [...targets, profile] };
      }
    });
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
        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#007b63] text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-[#005a48] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Novo Aviso
          </button>
        )}
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Novo Aviso</h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 px-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Exibir para (Perfis):</label>
                <div className="border border-gray-200 rounded-lg p-2 grid grid-cols-2 sm:grid-cols-3 gap-y-0.5 gap-x-2 bg-gray-50/50">
                  {Object.values(UserProfile).map(profile => (
                    <label key={profile} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-[#007b63] focus:ring-[#007b63]"
                        checked={(newNotice.targetProfiles || []).includes(profile)}
                        onChange={() => handleProfileToggle(profile)}
                      />
                      <span className="text-gray-700 truncate text-xs" title={profile}>{profile}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
                <input 
                  type="text" 
                  value={newNotice.title || ''}
                  onChange={(e) => setNewNotice(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007b63] focus:border-transparent outline-none transition-shadow box-border"
                  placeholder="Título do aviso"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mensagem</label>
                <textarea 
                  value={newNotice.message || ''}
                  onChange={(e) => setNewNotice(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007b63] focus:border-transparent outline-none transition-shadow resize-none h-32 box-border"
                  placeholder="Texto do aviso..."
                />
              </div>

              <div className="pb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cor do Post-it</label>
                <div className="flex gap-2 p-1">
                  {['bg-yellow-200', 'bg-blue-200', 'bg-green-200', 'bg-pink-200', 'bg-purple-200'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewNotice(prev => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded-full border-2 ${newNotice.color === color ? 'border-gray-800' : 'border-transparent'} ${color} shadow-sm hover:scale-110 transition-transform`}
                      title="Selecionar cor"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveNotice}
                disabled={!newNotice.title || !newNotice.message || (newNotice.targetProfiles || []).length === 0}
                className="px-4 py-2 bg-[#007b63] text-white rounded-lg font-bold shadow hover:bg-[#005a48] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

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
