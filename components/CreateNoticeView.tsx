
import React, { useState } from 'react';
import { Notice, UserProfile, AppNotification } from '../types';
import { db } from '../database';
import { POST_IT_COLORS } from '../constants';

interface CreateNoticeViewProps {
  onCancel: () => void;
  onSave: () => void;
  userProfile?: UserProfile;
}

const SECTORS = [
  'Administrativo', 'Coordenação', 'Enfermagem', 'Farmácia', 
  'Regulatório', 'Auditoria', 'Financeiro', 'Ensino', 'Diretoria'
];

export const CreateNoticeView: React.FC<CreateNoticeViewProps> = ({ onCancel, onSave, userProfile }) => {
  const [formData, setFormData] = useState<Partial<Notice>>({
    title: '',
    sector: SECTORS[0],
    message: '',
    color: POST_IT_COLORS[0]
  });

  const handleRegister = async () => {
    if (!formData.title || !formData.message || !formData.sector) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const today = new Date().toLocaleDateString('pt-BR');

    // 1. Criar o Aviso
    const newNotice: Notice = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title,
      sector: formData.sector,
      message: formData.message,
      color: formData.color || POST_IT_COLORS[0],
      date: today
    };

    await db.upsert('notices', newNotice);

    // 2. Criar Notificação Global para todos os usuários
    const notification: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Novo Aviso: ${formData.title}`,
      message: `O setor ${formData.sector} postou um novo recado no mural.`,
      date: today,
      read: false,
      linkTo: 'NoticeBoard', // Link para abrir o mural ao clicar
      targetProfiles: [] // Array vazio = todos os perfis (lógica tratada no Layout/App)
    };

    await db.upsert('notifications', notification);

    onSave();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto p-8 bg-white h-full border-r border-l border-gray-100 shadow-sm">
      <div className="border-b border-[#007b63]/20 pb-4 mb-2">
         <h3 className="text-[#007b63] font-black uppercase text-xl tracking-tighter">Novo Aviso</h3>
         <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Adicionar recado ao Mural</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Título (Destaque)</label>
              <input 
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Reunião Geral"
                maxLength={40}
              />
           </div>
           
           <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Setor (De:)</label>
              <select 
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#007b63] bg-white"
                value={formData.sector}
                onChange={e => setFormData({...formData, sector: e.target.value})}
              >
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
           </div>
        </div>

        <div className="flex flex-col gap-1">
           <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Mensagem</label>
           <textarea 
             className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#007b63] min-h-[120px]"
             value={formData.message}
             onChange={e => setFormData({...formData, message: e.target.value})}
             placeholder="Digite o conteúdo do recado..."
             maxLength={250}
           />
           <span className="text-[10px] text-gray-400 text-right">{formData.message?.length || 0}/250</span>
        </div>

        <div className="flex flex-col gap-2">
           <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Cor do Post-it</label>
           <div className="flex gap-3">
             {POST_IT_COLORS.map((colorClass, idx) => (
               <button
                 key={idx}
                 onClick={() => setFormData({...formData, color: colorClass})}
                 className={`
                   w-8 h-8 rounded-full border-2 shadow-sm transition-transform hover:scale-110
                   ${colorClass.split(' ')[0]} 
                   ${formData.color === colorClass ? 'border-gray-600 scale-110 ring-2 ring-offset-1 ring-gray-300' : 'border-transparent'}
                 `}
               ></button>
             ))}
           </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100 flex justify-end gap-3">
         <button onClick={onCancel} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-bold uppercase hover:bg-gray-50">Cancelar</button>
         <button onClick={handleRegister} className="px-8 py-2 bg-[#007b63] text-white rounded-lg text-sm font-bold uppercase shadow-lg hover:bg-[#005a48]">Publicar Aviso</button>
      </div>
    </div>
  );
};
