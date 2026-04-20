import React, { useState, useEffect } from 'react';
import { Calibration, UserProfile, CalibrationHistoryEntry } from '../types';
import { db } from '../database';

interface CalibrationViewProps {
  userProfile: UserProfile;
  canCreate?: boolean;
  canEdit?: boolean;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({ userProfile, canCreate = false, canEdit = false }) => {
  const [calibrations, setCalibrations] = useState<Calibration[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Calibration | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<CalibrationHistoryEntry[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<Partial<Calibration>>({
    assetCode: '',
    reference: '',
    calibrationDate: '',
    expirationPeriod: 1,
    expirationUnit: 'Years',
    responsible: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await db.getAll<Calibration>('calibrations');
    setCalibrations(data);
  };

  const calculateNextDate = (date: string, period: number, unit: string): string => {
    if (!date || !period) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    if (unit === 'Days') d.setDate(d.getDate() + period);
    if (unit === 'Months') d.setMonth(d.getMonth() + period);
    if (unit === 'Years') d.setFullYear(d.getFullYear() + period);

    return d.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!formData.assetCode || !formData.calibrationDate) return;

    const nextDate = calculateNextDate(
      formData.calibrationDate, 
      formData.expirationPeriod || 0, 
      formData.expirationUnit || 'Years'
    );

    let history = editingItem?.history || [];

    // If editing and date changed, add old date to history
    if (editingItem && editingItem.calibrationDate !== formData.calibrationDate) {
       history = [
         ...history,
         {
           date: editingItem.calibrationDate,
           responsible: editingItem.responsible,
           notes: 'Alteração de data'
         }
       ];
    } 
    // If new item, add initial date to history as well (optional, but good for tracking)
    else if (!editingItem) {
       history = [
         {
           date: formData.calibrationDate,
           responsible: formData.responsible || '',
           notes: 'Cadastro Inicial'
         }
       ];
    }

    const newItem: Calibration = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      assetCode: formData.assetCode || '',
      reference: formData.reference || '',
      calibrationDate: formData.calibrationDate,
      expirationPeriod: formData.expirationPeriod || 1,
      expirationUnit: (formData.expirationUnit as 'Days' | 'Months' | 'Years') || 'Years',
      nextCalibrationDate: nextDate,
      responsible: formData.responsible || '',
      history: history
    };

    await db.upsert('calibrations', newItem);
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      assetCode: '',
      reference: '',
      calibrationDate: '',
      expirationPeriod: 1,
      expirationUnit: 'Years',
      responsible: '',
    });
    loadData();
  };

  const handleEdit = (item: Calibration) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      await db.delete('calibrations', id);
      loadData();
    }
  };

  const openHistory = (item: Calibration) => {
    setSelectedHistory(item.history || []);
    setSelectedAsset(`${item.assetCode} - ${item.reference}`);
    setHistoryModalOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    // Handle YYYY-MM-DD format
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    // Fallback for other formats
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full w-full">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Calibrações</h2>
        {canCreate && (
          <button 
            onClick={() => {
              setEditingItem(null);
              setFormData({
                assetCode: '',
                reference: '',
                calibrationDate: '',
                expirationPeriod: 1,
                expirationUnit: 'Years',
                responsible: '',
              });
              setIsModalOpen(true);
            }} 
            className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase hover:bg-[#00604d] transition-colors"
          >
            + Nova Calibração
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm flex-1 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-[#007b63] text-white sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Patrimônio</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Referência</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Data Calibração</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Vencimento a cada</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Próxima Calibração</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Responsável</th>
              {canEdit && <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {calibrations.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.assetCode}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.reference}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(item.calibrationDate)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.expirationPeriod} {item.expirationUnit === 'Days' ? 'Dias' : item.expirationUnit === 'Months' ? 'Meses' : 'Anos'}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-[#007b63]">
                  {formatDate(item.nextCalibrationDate)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.responsible}</td>
                {canEdit && (
                  <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                    <button 
                      onClick={() => openHistory(item)} 
                      className="p-2 text-gray-500 hover:text-[#007b63] hover:bg-gray-100 rounded-lg transition-all"
                      title="Histórico"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleEdit(item)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {calibrations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm italic">
                  Nenhuma calibração registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Histórico */}
      {historyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#007b63] px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold text-lg">Histórico de Calibrações</h3>
                <p className="text-white/70 text-xs">{selectedAsset}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-0 max-h-[400px] overflow-y-auto">
              {selectedHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm italic">Nenhum histórico registrado.</div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Responsável</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Obs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedHistory.map((h, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{formatDate(h.date)}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">{h.responsible}</td>
                        <td className="px-6 py-3 text-sm text-gray-400 italic">{h.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-right">
              <button onClick={() => setHistoryModalOpen(false)} className="text-sm font-bold text-gray-500 hover:text-gray-700">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#007b63] px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">{editingItem ? 'Editar Calibração' : 'Nova Calibração'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cód. Patrimônio</label>
                  <input 
                    type="text" 
                    value={formData.assetCode} 
                    onChange={e => setFormData({...formData, assetCode: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#007b63] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Referência</label>
                  <input 
                    type="text" 
                    value={formData.reference} 
                    onChange={e => setFormData({...formData, reference: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#007b63] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Calibração</label>
                  <input 
                    type="date" 
                    value={formData.calibrationDate} 
                    onChange={e => setFormData({...formData, calibrationDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#007b63] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Responsável</label>
                  <input 
                    type="text" 
                    value={formData.responsible} 
                    onChange={e => setFormData({...formData, responsible: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#007b63] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Vencimento a cada</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    min="1"
                    value={formData.expirationPeriod} 
                    onChange={e => setFormData({...formData, expirationPeriod: parseInt(e.target.value) || 0})}
                    className="w-24 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#007b63] focus:border-transparent outline-none"
                  />
                  <select 
                    value={formData.expirationUnit}
                    onChange={e => setFormData({...formData, expirationUnit: e.target.value as any})}
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#007b63] focus:border-transparent outline-none"
                  >
                    <option value="Days">Dia(s)</option>
                    <option value="Months">Mês(es)</option>
                    <option value="Years">Ano(s)</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Próxima Calibração (Calculado)</label>
                <div className="text-lg font-black text-[#007b63]">
                  {formatDate(calculateNextDate(
                    formData.calibrationDate || '', 
                    formData.expirationPeriod || 0, 
                    formData.expirationUnit || 'Years'
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Este campo é calculado automaticamente e não pode ser alterado manualmente.</p>
              </div>

            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 text-sm font-bold text-white bg-[#007b63] hover:bg-[#00604d] rounded-lg shadow-md transition-all transform active:scale-95"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
