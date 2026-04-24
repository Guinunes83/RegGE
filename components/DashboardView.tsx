import React, { useState, useEffect, useMemo } from 'react';
import { Study, Patient, TeamMember } from '../types';
import { db } from '../database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardView: React.FC = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedStudyForParticipants, setSelectedStudyForParticipants] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  useEffect(() => {
    Promise.all([
      db.getAll<Study>('studies'),
      db.getAll<Patient>('patients'),
      db.getAll<TeamMember>('team-members')
    ]).then(([studiesData, patientsData, teamData]) => {
      setStudies(studiesData);
      setPatients(patientsData);
      setTeam(teamData);
    });
  }, []);

  const studiesByYearData = useMemo(() => {
    const countsByYear: Record<string, number> = {};
    studies.forEach(study => {
      if (study.initialOpinionApprovalDate) {
        let year = '';
        if (study.initialOpinionApprovalDate.includes('-')) {
          year = study.initialOpinionApprovalDate.split('-')[0];
        } else if (study.initialOpinionApprovalDate.includes('/')) {
          const parts = study.initialOpinionApprovalDate.split('/');
          year = parts.length === 3 ? parts[2] : '';
        }
        
        if (year && year.length === 4) {
          countsByYear[year] = (countsByYear[year] || 0) + 1;
        }
      }
    });

    return Object.keys(countsByYear).sort().map(year => ({
      name: year,
      quantidade: countsByYear[year]
    }));
  }, [studies]);

  const activeParticipantsCount = useMemo(() => {
    let filteredPatients = patients;
    if (selectedStudyForParticipants !== 'all') {
      filteredPatients = filteredPatients.filter(p => p.studyId === selectedStudyForParticipants);
    }
    return filteredPatients.filter(p => p.status === 'Ativo').length;
  }, [patients, selectedStudyForParticipants]);

  const activeStudiesCount = useMemo(() => {
    return studies.filter(s => s.status === 'Active').length;
  }, [studies]);

  const activeOncologistsCount = useMemo(() => {
    return team.filter(t => t.active !== false && t.role?.toLowerCase() === 'oncologista').length;
  }, [team]);

  const activeHematologistsCount = useMemo(() => {
    return team.filter(t => t.active !== false && (t.role?.toLowerCase() === 'hematologista' || t.role?.toLowerCase() === 'hamatologista')).length;
  }, [team]);

  const birthdaysThisMonth = useMemo(() => {
    return team
      .filter(member => {
        if (!member.birthDate) return false;
        if (member.active === false) return false; // Ignora inativos

        let month = -1;
        // Lida com formato yyyy-mm-dd do input date ou dd/mm/yyyy
        let parsedDate: Date | null = null;
        if (member.birthDate.match(/^\d{4}-\d{2}-\d{2}/)) {
           const [y, m, d] = member.birthDate.split('T')[0].split('-');
           parsedDate = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
           month = parseInt(m, 10);
        } else if (member.birthDate.match(/^\d{2}\/\d{2}\/\d{4}/)) {
           const [d, m, y] = member.birthDate.split(' ')[0].split('/');
           parsedDate = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
           month = parseInt(m, 10);
        } else {
           const d = new Date(member.birthDate);
           if (!isNaN(d.getTime())) {
             month = d.getMonth() + 1;
             parsedDate = d;
           }
        }
        member.parsedBirthDate = parsedDate;
        return month === selectedMonth;
      })
      .map(member => {
        return { ...member, birthDay: member.parsedBirthDate ? member.parsedBirthDate.getDate() : 0 };
      })
      .sort((a, b) => a.birthDay - b.birthDay);
  }, [team, selectedMonth]);

  const kpis = [
    { 
      label: (
        <div className="flex flex-col items-center gap-1 w-full px-1">
          <span>Participantes Ativos</span>
          <select 
            className="text-[9px] border border-gray-200 rounded px-1 py-0.5 w-full bg-white text-gray-600 focus:outline-none focus:border-[#007b63]"
            value={selectedStudyForParticipants}
            onChange={e => setSelectedStudyForParticipants(e.target.value)}
          >
            <option value="all">Todos os Estudos</option>
            {studies.map(s => (
              <option key={s.id} value={s.id}>{s.name || 'Estudo Sem Nome'}</option>
            ))}
          </select>
        </div>
      ), 
      value: String(activeParticipantsCount).padStart(2, '0'), change: '', color: 'text-gray-400' 
    },
    { label: 'Estudos Ativos', value: String(activeStudiesCount).padStart(2, '0'), change: '', color: 'text-gray-400' },
    { label: 'Oncologistas Ativos', value: String(activeOncologistsCount).padStart(2, '0'), change: '', color: 'text-gray-400' },
    { label: 'Hematologistas Ativos', value: String(activeHematologistsCount).padStart(2, '0'), change: '', color: 'text-gray-400' },
  ];

  return (
    <div className="flex h-full w-full bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar Filters */}
      <div className="w-48 bg-[#005a48] text-white p-4 flex flex-col gap-6 shrink-0 border-r border-[#004a3b]">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-center tracking-widest uppercase mt-4">DashBoard</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4 shrink-0">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white p-3 rounded shadow-sm flex flex-col items-center justify-between border border-gray-200 h-24">
              <span className="text-[10px] font-bold text-gray-800 text-center">{kpi.label}</span>
              <span className="text-xl font-light text-gray-700">{kpi.value}</span>
              <span className={`text-[8px] font-medium text-center ${kpi.color}`}>{kpi.change}</span>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Left Column (Charts) */}
          <div className="col-span-7 flex flex-col gap-4">
            {/* Profit Trend (Studies by Year) */}
            <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 p-4 flex flex-col">
              <h3 className="text-xs font-bold text-center text-gray-800 mb-4">Estudos Iniciados / Ano (Parecer Inicial)</h3>
              <div className="flex-1 w-full min-h-[200px]">
                {studiesByYearData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studiesByYearData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ fontSize: '10px', borderRadius: '4px', border: '1px solid #E5E7EB' }}
                        itemStyle={{ color: '#005a48', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="quantidade" 
                        name="Quantidade"
                        stroke="#005a48" 
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#005a48', strokeWidth: 2 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full border border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs bg-gray-50/50">
                    Nenhum dado disponível.
                  </div>
                )}
              </div>
            </div>
            {/* Income & Expenses Trend */}
            <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 p-4 flex flex-col">
              <h3 className="text-xs font-bold text-center text-gray-800 mb-4">Income & Expenses Trend</h3>
              <div className="flex-1 border border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs bg-gray-50/50">
                [ Gráfico de Barras/Linha: Income & Expenses Trend ]
              </div>
            </div>
          </div>

          {/* Right Column (Tables/Bars) */}
          <div className="col-span-5 flex flex-col gap-4">
            {/* Aniversariantes do Mês */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 pointer-events-none">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2Z" fill="#007b63"/>
                  <path d="M12 12L12 22" stroke="#007b63" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14C15.3137 14 18 11.3137 18 8C18 4.68629 15.3137 2 12 2Z" stroke="#005a48" strokeWidth="2"/>
                </svg>
              </div>
              <div className="absolute bottom-4 left-4 opacity-[0.05] pointer-events-none transform -rotate-12">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 11V7" stroke="#005a48" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 11V7" stroke="#005a48" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M17 11V7" stroke="#005a48" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 11H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V11Z" fill="#007b63" stroke="#007b63" strokeWidth="2"/>
                  <path d="M4 15H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="absolute top-1/2 right-12 opacity-[0.04] pointer-events-none transform rotate-12">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#007b63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              <div className="flex justify-between items-center mb-6 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎂</span>
                  <h3 className="text-sm font-black text-[#005a48] uppercase tracking-wider">Aniversariantes</h3>
                </div>
                <select 
                  className="text-xs font-bold border-none bg-gray-50 text-[#007b63] rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#007b63] outline-none cursor-pointer"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                >
                  <option value={1}>Janeiro</option>
                  <option value={2}>Fevereiro</option>
                  <option value={3}>Março</option>
                  <option value={4}>Abril</option>
                  <option value={5}>Maio</option>
                  <option value={6}>Junho</option>
                  <option value={7}>Julho</option>
                  <option value={8}>Agosto</option>
                  <option value={9}>Setembro</option>
                  <option value={10}>Outubro</option>
                  <option value={11}>Novembro</option>
                  <option value={12}>Dezembro</option>
                </select>
              </div>
              
              <div className="flex-1 w-full overflow-y-auto pr-2 z-10 custom-scrollbar">
                {birthdaysThisMonth.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {birthdaysThisMonth.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#007b63]/10 text-[#007b63] flex items-center justify-center font-black text-sm uppercase">
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">{member.name}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400">{member.role || 'Membro'}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className="text-sm font-black text-[#007b63]">Dia {member.birthDay}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 text-xs text-center opacity-70">
                    <span className="text-3xl mb-2 grayscale opacity-50">🎈</span>
                    <p className="font-medium">Nenhum aniversariante<br/>neste mês.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom Right Empty Space (Kept as placeholder or generic box) */}
            <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 p-4 flex flex-col">
              <h3 className="text-xs font-bold text-gray-800 mb-4">Outros Indicadores</h3>
              <div className="flex-1 border border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs bg-gray-50/50">
                [ Espaço Livre ]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
