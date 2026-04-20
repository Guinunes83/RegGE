
import React, { useState, useEffect, useMemo } from 'react';
import { Study, Patient, InfusionAppointment, PIEntry, InfusionStationType } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';

interface InfusionStation {
  id: string;
  name: string;
  type: InfusionStationType;
}

const STATIONS: InfusionStation[] = [
  { id: '1', name: 'Poltrona 01', type: 'Poltrona' },
  { id: '2', name: 'Poltrona 02', type: 'Poltrona' },
  { id: '3', name: 'Poltrona 03', type: 'Poltrona' },
  { id: '4', name: 'Poltrona 04', type: 'Poltrona' },
  { id: '5', name: 'Poltrona 05', type: 'Poltrona' },
  { id: '6', name: 'Maca 01', type: 'Maca' },
];

export const InfusionControlView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<InfusionAppointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [pis, setPis] = useState<PIEntry[]>([]);

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InfusionAppointment>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [appData, patData, studyData, piData] = await Promise.all([
      db.getAll<InfusionAppointment>('infusions'),
      db.getAll<Patient>('patients'),
      db.getAll<Study>('studies'),
      db.getAll<PIEntry>('pis')
    ]);
    setAppointments(appData);
    setPatients(patData);
    setStudies(studyData);
    setPis(piData);
  };

  // Filtrar agendamentos do dia selecionado
  const dailyAppointments = useMemo(() => {
    return appointments.filter(a => a.date === currentDate);
  }, [appointments, currentDate]);

  const handleSlotClick = (stationId: string, time: string) => {
    // Verifica se já existe algo neste slot
    const existing = dailyAppointments.find(a => 
      a.stationId === stationId && 
      time >= a.startTime && 
      time < addMinutes(a.startTime, a.durationMinutes)
    );

    if (existing) {
      setFormData(existing);
    } else {
      setFormData({
        stationId,
        date: currentDate,
        startTime: time,
        durationMinutes: 60, // Default 1h
        status: 'Agendado'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.patientId || !formData.startTime || !formData.durationMinutes) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    const study = studies.find(s => s.id === formData.studyId);
    
    // Validar conflito de horário
    const endTime = addMinutes(formData.startTime, formData.durationMinutes);
    const hasConflict = dailyAppointments.some(a => 
      a.id !== formData.id && // Não comparar consigo mesmo
      a.stationId === formData.stationId && 
      (
        (formData.startTime! >= a.startTime && formData.startTime! < addMinutes(a.startTime, a.durationMinutes)) ||
        (endTime > a.startTime && endTime <= addMinutes(a.startTime, a.durationMinutes)) ||
        (formData.startTime! <= a.startTime && endTime >= addMinutes(a.startTime, a.durationMinutes))
      )
    );

    if (hasConflict) {
      alert("Conflito de horário! Já existe um agendamento neste período para esta estação.");
      return;
    }

    const newApp: InfusionAppointment = {
      ...formData as InfusionAppointment,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      studyId: study ? study.id : (formData.studyId || ''), // Garante ID
    };

    await db.upsert('infusions', newApp);
    await loadData();
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (modalConfig.id) {
      await db.delete('infusions', modalConfig.id);
      await loadData();
      setIsModalOpen(false);
    }
    setModalConfig({ isOpen: false, id: '' });
  };

  // Helpers de Tempo
  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 18; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      if (h !== 18) slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  };

  const addMinutes = (time: string, minutes: number) => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Determinar status da estação visualmente
  const getStationStatus = (stationId: string) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    // Apenas se for hoje
    const isToday = currentDate === now.toISOString().split('T')[0];

    if (!isToday) return { status: 'Livre', patient: null };

    const activeApp = dailyAppointments.find(a => 
      a.stationId === stationId && 
      currentTime >= a.startTime && 
      currentTime < addMinutes(a.startTime, a.durationMinutes)
    );

    if (activeApp) {
      const p = patients.find(pat => pat.id === activeApp.patientId);
      return { status: 'Ocupado', patient: p?.name };
    }
    return { status: 'Livre', patient: null };
  };

  // Preenchimento automático de dados do paciente
  useEffect(() => {
    if (formData.patientId) {
      const p = patients.find(pat => pat.id === formData.patientId);
      if (p && !formData.studyId) {
        setFormData(prev => ({ ...prev, studyId: p.studyId }));
      }
    }
  }, [formData.patientId, patients]);

  const slots = generateTimeSlots();

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden relative">
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title="Cancelar Infusão"
        message="Deseja realmente remover este agendamento?"
        onConfirm={handleDelete}
        onCancel={() => setModalConfig({ isOpen: false, id: '' })}
      />

      {/* HEADER DE CONTROLE */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-[#007b63]">Central de Infusão</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Gestão de Poltronas e Medicações</p>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])} className="text-xs font-bold text-[#007b63] hover:underline">Hoje</button>
           <input 
             type="date" 
             className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none"
             value={currentDate}
             onChange={e => setCurrentDate(e.target.value)}
           />
        </div>
      </div>

      {/* PAINEL VISUAL DE STATUS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 bg-gray-100 border-b border-gray-200">
        {STATIONS.map(station => {
          const { status, patient } = getStationStatus(station.id);
          const isOccupied = status === 'Ocupado';
          
          return (
            <div key={station.id} className={`flex flex-col items-center p-3 rounded-xl border shadow-sm transition-all ${isOccupied ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
               <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isOccupied ? 'bg-red-100 text-red-600' : 'bg-[#007b63]/10 text-[#007b63]'}`}>
                  {station.type === 'Poltrona' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> // Icone genérico de poltrona
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6h18v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v6h18v-6a2 2 0 00-2-2m-2-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  )}
               </div>
               <span className="text-xs font-bold text-gray-700">{station.name}</span>
               <span className={`text-[10px] font-bold uppercase mt-1 ${isOccupied ? 'text-red-500' : 'text-green-600'}`}>
                 {isOccupied ? (patient ? patient.split(' ')[0] : 'Ocupado') : 'Livre'}
               </span>
            </div>
          );
        })}
      </div>

      {/* GRADE DE HORÁRIOS (SHEETS STYLE) */}
      <div className="flex-1 overflow-auto bg-white p-6">
        <div className="min-w-[800px] border border-gray-200 rounded-lg overflow-hidden">
          {/* Cabeçalho da Grade */}
          <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-[#007b63] text-white text-xs font-bold uppercase tracking-wider sticky top-0 z-20">
            <div className="p-3 text-center border-r border-white/20">Horário</div>
            {STATIONS.map(s => (
              <div key={s.id} className="p-3 text-center border-r border-white/20 last:border-r-0">
                {s.name}
              </div>
            ))}
          </div>

          {/* Corpo da Grade */}
          {slots.map((time, idx) => (
            <div key={time} className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-gray-100 text-xs hover:bg-gray-50 transition-colors">
              <div className="p-2 text-center text-gray-500 font-bold border-r border-gray-100 flex items-center justify-center bg-gray-50">
                {time}
              </div>
              {STATIONS.map(s => {
                // Verificar se este slot está ocupado por algum agendamento
                // Lógica simples: se o agendamento começa neste horário ou passa por ele
                // Para visualização limpa, renderizamos apenas no slot de início e usamos altura, 
                // OU repetimos o bloco (mais fácil para grid simples).
                // Aqui vamos usar a estratégia de renderizar um botão se houver match exato ou "continuação"
                
                const appointment = dailyAppointments.find(a => 
                  a.stationId === s.id && 
                  time >= a.startTime && 
                  time < addMinutes(a.startTime, a.durationMinutes)
                );

                const isStart = appointment && appointment.startTime === time;
                const patientName = appointment ? patients.find(p => p.id === appointment.patientId)?.name : '';

                return (
                  <div 
                    key={s.id} 
                    className="border-r border-gray-100 relative p-1 h-12"
                    onClick={() => handleSlotClick(s.id, time)}
                  >
                    {appointment && (
                      <div className={`
                        absolute inset-0 m-0.5 rounded flex flex-col justify-center px-2 cursor-pointer transition-all hover:brightness-95
                        ${isStart ? 'z-10 shadow-sm' : 'border-t-0'}
                        ${appointment.status === 'Concluído' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                      `}>
                        {isStart && (
                          <>
                            <span className="font-bold truncate">{patientName}</span>
                            <span className="text-[9px] opacity-80">{appointment.medicationName}</span>
                          </>
                        )}
                        {!isStart && <div className="w-1 h-full bg-black/5 absolute left-0 top-0"></div>}
                      </div>
                    )}
                    {!appointment && (
                      <div className="w-full h-full cursor-pointer hover:bg-gray-100 opacity-0 hover:opacity-100 flex items-center justify-center text-gray-400 text-xl font-light">
                        +
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE DETALHES / AGENDAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#007b63] p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wide">
                  {formData.id ? 'Detalhes da Infusão' : 'Novo Agendamento'}
                </h3>
                <p className="text-xs opacity-80 mt-1">
                  {STATIONS.find(s => s.id === formData.stationId)?.name} • {formData.date?.split('-').reverse().join('/')} às {formData.startTime}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-gray-500">Paciente</label>
                <select 
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#007b63]"
                  value={formData.patientId || ''}
                  onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                  disabled={!!formData.id} // Não troca paciente na edição para evitar erros
                >
                  <option value="">Selecione o paciente...</option>
                  {patients.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                    <option key={p.id} value={p.id}>{p.name} (CPF: {p.cpf})</option>
                  ))}
                </select>
              </div>

              {formData.patientId && (
                <>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2 grid grid-cols-2 gap-4">
                     <div>
                       <span className="block text-[9px] uppercase font-bold text-gray-400">Estudo</span>
                       <span className="text-sm font-bold text-gray-800">{studies.find(s => s.id === (formData.studyId || patients.find(p => p.id === formData.patientId)?.studyId))?.name || '-'}</span>
                     </div>
                     <div>
                       <span className="block text-[9px] uppercase font-bold text-gray-400">PI do Estudo</span>
                       <span className="text-sm font-bold text-gray-800">{studies.find(s => s.id === (formData.studyId || patients.find(p => p.id === formData.patientId)?.studyId))?.pi || '-'}</span>
                     </div>
                     <div>
                       <span className="block text-[9px] uppercase font-bold text-gray-400">Contato Paciente</span>
                       <span className="text-sm text-gray-800">{patients.find(p => p.id === formData.patientId)?.contact || '-'}</span>
                     </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Horário Início</label>
                    <input 
                      type="time" 
                      className="border border-gray-300 rounded px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#007b63]"
                      value={formData.startTime || ''}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Duração (Minutos)</label>
                    <select 
                      className="border border-gray-300 rounded px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#007b63]"
                      value={formData.durationMinutes || 60}
                      onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                    >
                      <option value="30">30 min</option>
                      <option value="60">1 hora</option>
                      <option value="90">1h 30min</option>
                      <option value="120">2 horas</option>
                      <option value="150">2h 30min</option>
                      <option value="180">3 horas</option>
                      <option value="240">4 horas</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <h4 className="text-[#007b63] font-bold text-xs uppercase mb-3">Protocolo de Medicação</h4>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="flex flex-col gap-1">
                         <label className="text-[10px] uppercase font-bold text-gray-500">Medicação (Vai Tomar)</label>
                         <input 
                           className="border border-gray-300 rounded px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#007b63]"
                           value={formData.medicationName || ''}
                           onChange={e => setFormData({ ...formData, medicationName: e.target.value })}
                           placeholder="Ex: Pembrolizumabe"
                         />
                       </div>
                       <div className="flex flex-col gap-1">
                         <label className="text-[10px] uppercase font-bold text-gray-500">Dose</label>
                         <input 
                           className="border border-gray-300 rounded px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#007b63]"
                           value={formData.medicationDose || ''}
                           onChange={e => setFormData({ ...formData, medicationDose: e.target.value })}
                           placeholder="Ex: 200mg"
                         />
                       </div>
                       <div className="flex flex-col gap-1 md:col-span-2">
                         <label className="text-[10px] uppercase font-bold text-gray-500">Ciclo / Info Adicional</label>
                         <input 
                           className="border border-gray-300 rounded px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#007b63]"
                           value={formData.cycleInfo || ''}
                           onChange={e => setFormData({ ...formData, cycleInfo: e.target.value })}
                           placeholder="Ex: C1D1 - Já tomou pré-medicação"
                         />
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Status</label>
                    <div className="flex gap-2">
                      {['Agendado', 'Em Andamento', 'Concluído', 'Cancelado'].map(s => (
                        <button
                          key={s}
                          onClick={() => setFormData({ ...formData, status: s as any })}
                          className={`flex-1 py-2 text-xs font-bold rounded border transition-colors ${formData.status === s ? 'bg-[#007b63] text-white border-[#007b63]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              {formData.id && (
                <button 
                  onClick={() => setModalConfig({ isOpen: true, id: formData.id! })}
                  className="text-red-500 font-bold text-xs uppercase hover:underline"
                >
                  Excluir Agendamento
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-bold uppercase hover:bg-gray-100">Cancelar</button>
                <button onClick={handleSave} className="px-6 py-2 bg-[#007b63] text-white rounded-lg text-xs font-bold uppercase shadow-lg hover:bg-[#005a48]">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
