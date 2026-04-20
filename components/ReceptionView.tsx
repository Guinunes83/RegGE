
import React, { useState, useEffect, useMemo } from 'react';
import { Patient, Study, Consultation, CalendarEvent } from '../types';
import { db } from '../database';

export const ReceptionView: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  
  const [formData, setFormData] = useState<Partial<Consultation>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    visitName: '',
    doctorName: '',
    height: '',
    weight: '',
    systolicPressure: '',
    diastolicPressure: '',
    temperature: '',
    heartRate: '',
    observations: ''
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [pat, stu] = await Promise.all([
      db.getAll<Patient>('patients'),
      db.getAll<Study>('studies')
    ]);
    setPatients(pat);
    setStudies(stu);
  };

  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find(pat => pat.id === selectedPatientId);
      if (p) {
        setFormData(prev => ({ ...prev, patientId: p.id, studyId: p.studyId }));
      }
    } else {
        setFormData(prev => ({ ...prev, patientId: '', studyId: '' }));
    }
  }, [selectedPatientId, patients]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedStudy = studies.find(s => s.id === (selectedPatient?.studyId || formData.studyId));

  // Calcular lista de médicos baseada no estudo (PI + Delegados com função médica)
  const availableDoctors = useMemo(() => {
    if (!selectedStudy) return [];
    
    const doctors = new Set<string>();
    
    // Adiciona o PI do estudo
    if (selectedStudy.pi) {
        doctors.add(selectedStudy.pi);
    }

    // Adiciona membros delegados que tenham funções médicas comuns
    if (selectedStudy.delegation) {
        const medicalRoles = [
            'Sub-Investigador', 
            'Oncologista', 
            'Hematologista', 
            'Cardiologista', 
            'Pneumologista', 
            'Oftalmologista',
            'Médico'
        ];
        
        selectedStudy.delegation.forEach(member => {
            if (medicalRoles.some(role => member.role.includes(role))) {
                doctors.add(member.memberName);
            }
        });
    }

    return Array.from(doctors).sort();
  }, [selectedStudy]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Retirada a obrigatoriedade dos sinais vitais
    if (!selectedPatientId || !formData.date || !formData.visitName) {
        alert("Preencha os campos obrigatórios (Paciente, Data, Nome da Visita).");
        return;
    }

    const consultationId = Math.random().toString(36).substr(2, 9);

    // 1. Salvar Consulta
    const newConsultation: Consultation = {
        ...formData as Consultation,
        id: consultationId,
    };

    await db.upsert('consultations', newConsultation);

    // 2. Criar Evento na Agenda com Vínculo
    const newEvent: CalendarEvent = {
        id: Math.random().toString(36).substr(2, 9),
        title: `${selectedPatient?.name} - ${formData.visitName}`,
        date: formData.date!, // Garantido pelo check acima
        type: 'Consultation',
        description: `Médico: ${formData.doctorName || 'Não informado'} | Obs: ${formData.observations || ''}`,
        patientId: selectedPatientId,
        studyId: selectedStudy?.id,
        consultationId: consultationId // Vínculo importante
    };

    await db.upsert('calendarEvents', newEvent);
    
    // Feedback visual
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);

    // Resetar campos de formulário, manter data para facilitar múltiplos cadastros
    setFormData(prev => ({
        ...prev,
        visitName: '',
        doctorName: '',
        height: '',
        weight: '',
        systolicPressure: '',
        diastolicPressure: '',
        temperature: '',
        heartRate: '',
        observations: ''
    }));
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-6 bg-white h-full">
      <div className="bg-[#007b63] p-6 text-white rounded-xl shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Nova consulta</h2>
          <p className="text-xs font-medium opacity-80 mt-1">Registro de Consulta e Triagem</p>
        </div>
      </div>

      {isSuccess && (
        <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-lg text-sm font-bold text-center animate-in fade-in slide-in-from-top-2">
            Consulta registrada e agendada com sucesso!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Identificação */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col gap-4">
            <h3 className="text-[#007b63] font-bold text-xs uppercase tracking-widest border-b border-gray-200 pb-2 mb-2">Identificação</h3>
            
            <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Paciente *</label>
                <select 
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                >
                    <option value="">Selecione o paciente...</option>
                    {patients.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                        <option key={p.id} value={p.id}>{p.name} (CPF: {p.cpf})</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Estudo Vinculado</label>
                <input 
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-600 outline-none"
                    value={selectedStudy?.name || '-'}
                    readOnly
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Médico da Consulta</label>
                <select 
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                    name="doctorName"
                    value={formData.doctorName}
                    onChange={handleChange}
                    disabled={!selectedStudy}
                >
                    <option value="">Selecione o médico...</option>
                    {availableDoctors.map(doc => (
                        <option key={doc} value={doc}>{doc}</option>
                    ))}
                </select>
                {!selectedStudy && <span className="text-[9px] text-gray-400 ml-1">Selecione um paciente vinculado a um estudo para ver os médicos.</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Data *</label>
                    <input 
                        type="date"
                        name="date"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                        value={formData.date}
                        onChange={handleChange}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Hora</label>
                    <input 
                        type="time"
                        name="time"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                        value={formData.time}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Nome da Visita / Motivo *</label>
                <input 
                    type="text"
                    name="visitName"
                    placeholder="Ex: Visita C1D1, Triagem, Retorno..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                    value={formData.visitName}
                    onChange={handleChange}
                />
            </div>
        </div>

        {/* Sinais Vitais */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
            <h3 className="text-[#007b63] font-bold text-xs uppercase tracking-widest border-b border-gray-200 pb-2 mb-2">Sinais Vitais (Opcional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Peso (kg)</label>
                    <input 
                        type="number"
                        name="weight"
                        placeholder="0.00"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                        value={formData.weight}
                        onChange={handleChange}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Altura (cm)</label>
                    <input 
                        type="number"
                        name="height"
                        placeholder="000"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                        value={formData.height}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Pressão Arterial (mmHg)</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="number"
                        name="systolicPressure"
                        placeholder="PAS (Ex: 120)"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63] w-full"
                        value={formData.systolicPressure}
                        onChange={handleChange}
                    />
                    <span className="text-gray-400">/</span>
                    <input 
                        type="number"
                        name="diastolicPressure"
                        placeholder="PAD (Ex: 80)"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63] w-full"
                        value={formData.diastolicPressure}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Temp. (°C)</label>
                    <input 
                        type="number"
                        name="temperature"
                        placeholder="36.5"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                        value={formData.temperature}
                        onChange={handleChange}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Freq. Card. (bpm)</label>
                    <input 
                        type="number"
                        name="heartRate"
                        placeholder="80"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                        value={formData.heartRate}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Observações da Triagem</label>
                <textarea 
                    name="observations"
                    rows={3}
                    placeholder="Paciente relatou..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                    value={formData.observations}
                    onChange={handleChange}
                />
            </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-100">
         <button 
            onClick={handleSave}
            className="bg-[#007b63] text-white px-8 py-3 rounded-xl font-bold uppercase text-sm shadow-lg hover:bg-[#005a48] transition-all transform hover:scale-105"
         >
            Registrar e Agendar
         </button>
      </div>
    </div>
  );
};
