
import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, Study, Patient, Consultation, EventType } from '../types';
import { db } from '../database';
import { ConfirmationModal } from './ConfirmationModal';

interface CalendarViewProps {
  studies: Study[];
  patients: Patient[];
  canCreate?: boolean;
}

type ViewMode = 'Month' | 'Week' | 'WorkWeek' | 'Day';

export const CalendarView: React.FC<CalendarViewProps> = ({ studies, patients, canCreate = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  // Modal de Evento / Consulta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventFormData, setEventFormData] = useState<Partial<CalendarEvent>>({
    type: 'Internal Event',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Dados específicos da Consulta (para edição no modal)
  const [consultationFormData, setConsultationFormData] = useState<Partial<Consultation>>({});
  
  // Modal de Confirmação de Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [eventsData, consultationsData] = await Promise.all([
      db.getAll<CalendarEvent>('calendarEvents'),
      db.getAll<Consultation>('consultations')
    ]);
    setAllEvents(eventsData || []);
    setConsultations(consultationsData || []);
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeekFull = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const daysOfWeekShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // --- Lógica de Navegação e Datas ---

  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'Month') {
        newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'Week' || viewMode === 'WorkWeek') {
        newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewMode === 'Day') {
        newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const getDatesForView = useMemo(() => {
    const dates: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    if (viewMode === 'Month') {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const prevMonthDays = new Date(year, month, 0).getDate();

        // Dias do mês anterior
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const d = new Date(year, month - 1, prevMonthDays - i);
            dates.push({ date: d, isCurrentMonth: false, isToday: d.toDateString() === today.toDateString() });
        }
        // Dias do mês atual
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            dates.push({ date: d, isCurrentMonth: true, isToday: d.toDateString() === today.toDateString() });
        }
        // Dias do próximo mês (para completar 42 slots - 6 semanas)
        const remaining = 42 - dates.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(year, month + 1, i);
            dates.push({ date: d, isCurrentMonth: false, isToday: d.toDateString() === today.toDateString() });
        }
    } else if (viewMode === 'Week') {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Domingo
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push({ date: d, isCurrentMonth: d.getMonth() === month, isToday: d.toDateString() === today.toDateString() });
        }
    } else if (viewMode === 'WorkWeek') {
        const startOfWeek = new Date(currentDate);
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para segunda
        startOfWeek.setDate(diff); // Segunda-feira (ou próximo disso dependendo do fuso, mas lógica simplificada)
        
        // Garante que pegamos a segunda-feira da semana atual
        const monday = new Date(currentDate);
        monday.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        
        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push({ date: d, isCurrentMonth: d.getMonth() === month, isToday: d.toDateString() === today.toDateString() });
        }
    } else if (viewMode === 'Day') {
        dates.push({ date: new Date(currentDate), isCurrentMonth: true, isToday: currentDate.toDateString() === today.toDateString() });
    }

    return dates;
  }, [currentDate, viewMode]);

  const isSelected = (date: Date) => {
    return selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return allEvents.filter((e: any) => e.date === dateStr);
  };

  // --- Handlers do Modal ---

  const handleOpenNewEvent = () => {
    setEventFormData({
      type: 'Internal Event',
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      title: '',
      description: ''
    });
    setConsultationFormData({});
    setSelectedEventId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditEvent = (event: CalendarEvent) => {
    setSelectedEventId(event.id);
    setEventFormData({ ...event });

    // Se for consulta, carregar dados da consulta vinculada
    if (event.type === 'Consultation' && event.consultationId) {
        const linkedConsultation = consultations.find(c => c.id === event.consultationId);
        if (linkedConsultation) {
            setConsultationFormData({ ...linkedConsultation });
        }
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventFormData.title || !eventFormData.date) {
        alert("Título e Data são obrigatórios.");
        return;
    }

    const eventId = selectedEventId || Math.random().toString(36).substr(2, 9);
    
    if (eventFormData.type === 'Consultation' && eventFormData.consultationId) {
        const updatedConsultation: Consultation = {
            ...consultationFormData as Consultation,
            id: eventFormData.consultationId,
        };
        await db.upsert('consultations', updatedConsultation);
    }

    const eventToSave: CalendarEvent = {
        ...eventFormData as CalendarEvent,
        id: eventId
    };

    await db.upsert('calendarEvents', eventToSave);
    await fetchData();
    setIsModalOpen(false);
  };

  const handleDeleteEvent = async () => {
    if (selectedEventId) {
        await db.delete('calendarEvents', selectedEventId);
        await fetchData();
        setDeleteModalOpen(false);
        setIsModalOpen(false);
    }
  };

  const getEventTypeColor = (type: EventType) => {
      switch(type) {
          case 'Consultation': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'Birthday': return 'bg-pink-100 text-pink-800 border-pink-200';
          case 'Vacation': return 'bg-green-100 text-green-800 border-green-200';
          case 'MedicationDelivery': return 'bg-purple-100 text-purple-800 border-purple-200';
          case 'Monitor Visit': return 'bg-orange-100 text-orange-800 border-orange-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
  };

  // Helper para Ícones SVG
  const EventIcon = ({ type, className = "w-3 h-3" }: { type: EventType, className?: string }) => {
    switch (type) {
      case 'Consultation': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
      case 'Birthday': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>;
      case 'Vacation': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
      case 'MedicationDelivery': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
      case 'Monitor Visit': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
      case 'External Event': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
      default: return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
    }
  };

  const getHeaderTitle = () => {
    const month = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    if (viewMode === 'Month') return `${month} ${year}`;
    if (viewMode === 'Day') return `${currentDate.getDate()} de ${month} ${year}`;
    
    // Para semana, mostra o intervalo
    const start = getDatesForView[0].date;
    const end = getDatesForView[getDatesForView.length - 1].date;
    const startMonth = monthNames[start.getMonth()];
    const endMonth = monthNames[end.getMonth()];
    
    if (startMonth === endMonth) return `${start.getDate()} - ${end.getDate()} de ${startMonth} ${year}`;
    return `${start.getDate()} ${startMonth.substr(0,3)} - ${end.getDate()} ${endMonth.substr(0,3)} ${year}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full px-4 h-full overflow-hidden relative">
      
      {/* Modais (Detalhes e Confirmação) mantidos iguais... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* ... Header e Corpo do Modal igual ao anterior ... */}
                <div className={`p-6 text-white flex justify-between items-start ${eventFormData.type === 'Consultation' ? 'bg-[#007b63]' : 'bg-gray-700'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full">
                           <EventIcon type={eventFormData.type || 'Internal Event'} className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-wide">
                                {selectedEventId ? 'Detalhes do Evento' : 'Novo Evento'}
                            </h3>
                            <p className="text-xs opacity-80 mt-1 uppercase font-bold tracking-widest">{eventFormData.type}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Título</label>
                            <input 
                                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                                value={eventFormData.title || ''}
                                onChange={e => setEventFormData({...eventFormData, title: e.target.value})}
                                disabled={eventFormData.type === 'Consultation'} 
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Data</label>
                            <input 
                                type="date"
                                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                                value={eventFormData.date || ''}
                                onChange={e => setEventFormData({...eventFormData, date: e.target.value})}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Tipo de Evento</label>
                            <select 
                                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                                value={eventFormData.type}
                                onChange={e => setEventFormData({...eventFormData, type: e.target.value as EventType})}
                                disabled={!!selectedEventId && eventFormData.type === 'Consultation'} 
                            >
                                <option value="Internal Event">Evento Interno</option>
                                <option value="Birthday">Aniversário</option>
                                <option value="Vacation">Férias</option>
                                <option value="MedicationDelivery">Entrega de Medicação</option>
                                <option value="Monitor Visit">Visita de Monitoria</option>
                                <option value="Consultation">Consulta</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Descrição</label>
                        <textarea 
                            rows={3}
                            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                            value={eventFormData.description || ''}
                            onChange={e => setEventFormData({...eventFormData, description: e.target.value})}
                        />
                    </div>

                    {/* Sinais Vitais para Consulta */}
                    {eventFormData.type === 'Consultation' && eventFormData.consultationId && (
                        <div className="mt-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-[#007b63] font-bold text-xs uppercase mb-3 border-b border-gray-100 pb-2">
                                Sinais Vitais (Enfermagem)
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-400">Peso (kg)</label>
                                    <input type="number" className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#007b63]" value={consultationFormData.weight || ''} onChange={e => setConsultationFormData({...consultationFormData, weight: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-400">Altura (cm)</label>
                                    <input type="number" className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#007b63]" value={consultationFormData.height || ''} onChange={e => setConsultationFormData({...consultationFormData, height: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-400">PA Sistólica</label>
                                    <input type="number" className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#007b63]" value={consultationFormData.systolicPressure || ''} onChange={e => setConsultationFormData({...consultationFormData, systolicPressure: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-400">PA Diastólica</label>
                                    <input type="number" className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#007b63]" value={consultationFormData.diastolicPressure || ''} onChange={e => setConsultationFormData({...consultationFormData, diastolicPressure: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-400">Temp (°C)</label>
                                    <input type="number" className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#007b63]" value={consultationFormData.temperature || ''} onChange={e => setConsultationFormData({...consultationFormData, temperature: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-400">Freq. Card. (bpm)</label>
                                    <input type="number" className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#007b63]" value={consultationFormData.heartRate || ''} onChange={e => setConsultationFormData({...consultationFormData, heartRate: e.target.value})} />
                                </div>
                                <div className="col-span-2 flex flex-col gap-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-400">Observações Clínicas</label>
                                    <input className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#007b63]" value={consultationFormData.observations || ''} onChange={e => setConsultationFormData({...consultationFormData, observations: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-between">
                    {selectedEventId && (
                        <button onClick={() => setDeleteModalOpen(true)} className="text-red-500 font-bold uppercase text-xs hover:underline">Excluir Evento</button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold uppercase hover:bg-gray-200">Cancelar</button>
                        <button onClick={handleSaveEvent} className="px-6 py-2 bg-[#007b63] text-white rounded-lg text-xs font-bold uppercase shadow-md hover:bg-[#005a48]">Salvar</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteModalOpen}
        title="Excluir Evento"
        message="Tem certeza que deseja remover este evento da agenda?"
        onConfirm={handleDeleteEvent}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {/* Calendário Principal */}
      <div className="flex-1 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 bg-[#007b63] text-white flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {getHeaderTitle()}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Agenda Integrada</span>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            {/* View Mode Switcher */}
            <div className="bg-black/20 p-1 rounded-lg flex gap-1">
                <button onClick={() => setViewMode('Month')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'Month' ? 'bg-white text-[#007b63]' : 'text-white hover:bg-white/10'}`}>Mês</button>
                <button onClick={() => setViewMode('Week')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'Week' ? 'bg-white text-[#007b63]' : 'text-white hover:bg-white/10'}`}>Semana</button>
                <button onClick={() => setViewMode('WorkWeek')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'WorkWeek' ? 'bg-white text-[#007b63]' : 'text-white hover:bg-white/10'}`}>5 Dias</button>
                <button onClick={() => setViewMode('Day')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'Day' ? 'bg-white text-[#007b63]' : 'text-white hover:bg-white/10'}`}>Dia</button>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold uppercase transition-all">Hoje</button>
                <div className="flex bg-white/10 rounded-lg p-1">
                <button onClick={() => navigateDate(-1)} className="p-1 hover:bg-white/20 rounded-md transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => navigateDate(1)} className="p-1 hover:bg-white/20 rounded-md transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {viewMode === 'Month' ? (
                <div className="p-4 grid grid-cols-7 gap-1 h-full auto-rows-fr">
                    {daysOfWeekShort.map(day => (
                        <div key={day} className="text-center py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</div>
                    ))}
                    
                    {getDatesForView.map((dateObj, idx) => {
                        const dayEvents = getEventsForDay(dateObj.date);
                        const selected = isSelected(dateObj.date);
                        
                        return (
                        <div 
                            key={idx}
                            onClick={() => setSelectedDate(dateObj.date)}
                            className={`
                            min-h-[100px] p-2 border rounded-xl transition-all cursor-pointer relative group flex flex-col justify-between
                            ${dateObj.isCurrentMonth ? 'bg-white border-gray-100' : 'bg-gray-50 border-transparent text-gray-300'}
                            ${selected ? 'ring-2 ring-[#007b63] ring-inset border-[#007b63]' : 'hover:border-[#007b63]/30'}
                            `}
                        >
                            <div className="flex justify-between items-start">
                            <span className={`
                                text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors
                                ${dateObj.isToday ? 'bg-[#007b63] text-white' : ''}
                                ${!dateObj.isCurrentMonth ? 'opacity-50' : ''}
                            `}>
                                {dateObj.date.getDate()}
                            </span>
                            {dayEvents.length > 0 && (
                                <div className="flex -space-x-1">
                                {dayEvents.slice(0, 3).map((_, i) => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${e => {
                                        if (dayEvents[i].type === 'Consultation') return 'bg-blue-500';
                                        if (dayEvents[i].type === 'Birthday') return 'bg-pink-500';
                                        return 'bg-gray-400';
                                    }}`}></div>
                                ))}
                                </div>
                            )}
                            </div>
                            
                            <div className="mt-1 space-y-1 overflow-hidden">
                            {dayEvents.slice(0, 3).map((e, i) => {
                                let typeClass = '';
                                if (e.type === 'Consultation') typeClass = 'text-blue-600 bg-blue-50 border-l-blue-500';
                                else if (e.type === 'Birthday') typeClass = 'text-pink-600 bg-pink-50 border-l-pink-500';
                                else typeClass = 'text-gray-600 bg-gray-100 border-l-gray-500';

                                return (
                                    <div key={i} className={`text-[8px] truncate px-1 rounded font-medium border-l-2 ${typeClass} flex items-center gap-1`}>
                                    <span className="shrink-0"><EventIcon type={e.type} className="w-2 h-2" /></span>
                                    <span className="truncate">{e.title}</span>
                                    </div>
                                );
                            })}
                            {dayEvents.length > 3 && (
                                <div className="text-[8px] text-gray-400 font-bold pl-1">+{dayEvents.length - 3} mais</div>
                            )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            ) : (
                /* Layout para Semana, WorkWeek e Dia (Colunas) */
                <div className={`p-4 grid h-full gap-2 ${viewMode === 'Day' ? 'grid-cols-1' : viewMode === 'WorkWeek' ? 'grid-cols-5' : 'grid-cols-7'}`}>
                    {getDatesForView.map((dateObj, idx) => {
                        const dayEvents = getEventsForDay(dateObj.date);
                        const selected = isSelected(dateObj.date);
                        const isToday = dateObj.isToday;

                        return (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedDate(dateObj.date)}
                                className={`
                                    flex flex-col border rounded-xl overflow-hidden cursor-pointer transition-all
                                    ${selected ? 'ring-2 ring-[#007b63] border-[#007b63]' : 'border-gray-200 hover:border-gray-300'}
                                    ${isToday ? 'bg-[#007b63]/5' : 'bg-white'}
                                `}
                            >
                                {/* Header da Coluna */}
                                <div className={`p-2 text-center border-b border-gray-100 ${isToday ? 'bg-[#007b63] text-white' : 'bg-gray-50'}`}>
                                    <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80">
                                        {viewMode === 'Day' ? daysOfWeekFull[dateObj.date.getDay()] : daysOfWeekShort[dateObj.date.getDay()]}
                                    </span>
                                    <span className="text-lg font-black">{dateObj.date.getDate()}</span>
                                </div>

                                {/* Corpo da Coluna (Lista de Eventos) */}
                                <div className="flex-1 p-2 overflow-y-auto space-y-2">
                                    {dayEvents.map((e, i) => (
                                        <div 
                                            key={i} 
                                            onClick={(ev) => { ev.stopPropagation(); handleOpenEditEvent(e); }}
                                            className={`p-2 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-all ${getEventTypeColor(e.type)}`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="mt-0.5"><EventIcon type={e.type} className="w-3 h-3" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold truncate leading-tight">{e.title}</p>
                                                    {e.description && <p className="text-[9px] opacity-80 truncate mt-0.5">{e.description}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {dayEvents.length === 0 && (
                                        <div className="h-full flex items-center justify-center opacity-20">
                                            <span className="text-xl font-bold text-gray-400">+</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </div>

      {/* Painel Lateral de Detalhes */}
      <div className="w-full lg:w-80 bg-gray-50 rounded-3xl border border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detalhes do Dia</h3>
          <p className="text-xl font-bold text-gray-800">
            {selectedDate?.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
          </p>
        </div>

        {canCreate && (
          <button 
              onClick={handleOpenNewEvent}
              className="bg-[#007b63] text-white py-3 rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-[#005a48] transition-all flex items-center justify-center gap-2"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Novo Evento
          </button>
        )}

        <div className="flex-1 flex flex-col gap-4">
          <h4 className="text-[10px] font-bold text-[#007b63] uppercase tracking-tighter border-b border-[#007b63]/20 pb-1">Eventos Agendados</h4>
          
          {selectedDate && getEventsForDay(selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getEventsForDay(selectedDate).map((e: any) => (
                <div 
                    key={e.id} 
                    onClick={() => handleOpenEditEvent(e)}
                    className={`p-3 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${getEventTypeColor(e.type)}`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="p-1 bg-white/40 rounded-full shrink-0">
                             <EventIcon type={e.type} className="w-3 h-3" />
                          </div>
                          <p className="text-xs font-bold truncate">{e.title}</p>
                      </div>
                      {e.type === 'Consultation' && <span className="text-[8px] bg-white/50 px-1 rounded uppercase font-bold shrink-0">Cons</span>}
                  </div>
                  <p className="text-[10px] opacity-80 mt-1 italic truncate">{e.description || 'Sem descrição'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 py-10">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">Nenhum compromisso<br/>para este dia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
