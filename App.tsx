
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, User, UserProfile, Study, Sponsor, TeamMember, Patient, MonitorEntry, AppNotification, Calibration, FinancialTransaction } from './types';
import { Layout } from './components/Layout';
import { LoginView } from './components/LoginView';
import { db } from './database';

import { StudyForm } from './components/StudyForm';
import { SponsorForm } from './components/SponsorForm';
import { MonitorForm } from './components/MonitorForm';
import { ParticipantForm } from './components/ParticipantForm';
import { SuccessModal } from './components/SuccessModal';

import { NotepadView } from './components/NotepadView';
import { DashboardView } from './components/DashboardView';
import { NoticeBoardView } from './components/NoticeBoardView';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { UserListView } from './components/UserListView';
import { CreateProfileView } from './components/CreateProfileView';
import { ChangePasswordView } from './components/ChangePasswordView';
import { CreateNoticeView } from './components/CreateNoticeView';
import { RegulatoryLinksView } from './components/RegulatoryLinksView';
import { RegulatoryIndicesView } from './components/RegulatoryIndicesView';
import { PartialReportView } from './components/PartialReportView';
import { CEPMeetingView } from './components/CEPMeetingView';
import { CEPCalendarView } from './components/CEPCalendarView';
import { KitStockView } from './components/KitStockView';
import { ProtocolDeviationView } from './components/ProtocolDeviationView';
import { VisitControlView } from './components/VisitControlView';
import { ExamRequestView } from './components/ExamRequestView';
import { BirthdayFilterView } from './components/BirthdayFilterView';
import { InfusionControlView } from './components/InfusionControlView'; 
import { ReceptionView } from './components/ReceptionView'; // Import novo
import { TeamForm } from './components/TeamForm';
import { CalibrationView } from './components/CalibrationView';
import { AssociateListView } from './components/AssociateListView';
import { AssociateForm } from './components/AssociateForm';
import { FinanceDashboardView } from './components/FinanceDashboardView';
import { FinanceReportView } from './components/FinanceReportView';
import { ManageRolesView } from './components/ManageRolesView';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Associate } from './types';
import { NavigationContext } from './contexts/NavigationContext';

const HeaderCell = ({ label, sortKey, onClick }: { label: string, sortKey?: string, onClick?: () => void }) => (
  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors" onClick={onClick}>
    <div className="flex items-center gap-1">
      {label}
      {sortKey && <span className="opacity-50">⇅</span>}
    </div>
  </th>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [activeView, setActiveView] = useState<ViewState>('Login');
  const [activeProps, setActiveProps] = useState<any>({});
  
  // Data state for lists
  const [studies, setStudies] = useState<Study[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [monitors, setMonitors] = useState<MonitorEntry[]>([]);

  // Modal state
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });
  const [deleteTeamMemberPhase, setDeleteTeamMemberPhase] = useState<{phase: number, id: string | null}>({ phase: 0, id: null });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([]);
  const [appConfig, setAppConfig] = useState({
    logo: localStorage.getItem('appCustomLogo'),
    text: localStorage.getItem('appCustomLogoText') || 'GRUPO ELORA'
  });

  const handleConfigUpdate = (logo: string | null, text: string) => {
    if (logo) {
      localStorage.setItem('appCustomLogo', logo);
    } else {
      localStorage.removeItem('appCustomLogo');
    }
    localStorage.setItem('appCustomLogoText', text);
    setAppConfig({ logo, text });
  };

  useEffect(() => {
    const loadPermissions = async () => {
      if (currentUser) {
        const customRoles = await db.getAll<{ id: string, name: string, permissions?: string[] }>('userProfiles');
        const role = customRoles.find(r => r.name === currentUser.profile);
        setCurrentUserPermissions(role?.permissions || []);
      }
    };
    loadPermissions();
  }, [currentUser?.profile]);

  useEffect(() => {
    // Load initial data
    refreshData();

    // Assign DEVELOPER profile and update password for Guilherme Nunes
    const assignDeveloper = async () => {
      const users = await db.getAll<User>('users');
      let guilherme = users.find(u => u.login === 'guilherme.nunes' || u.name.toLowerCase().includes('guilherme nunes'));
      
      if (!guilherme) {
        // Create user if it doesn't exist
        guilherme = {
          id: 'guilherme_nunes',
          name: 'Guilherme Nunes',
          login: 'guilherme.nunes',
          password: 'gui1234',
          profile: UserProfile.DEVELOPER,
          profiles: [UserProfile.DEVELOPER],
          active: true,
          cpf: '000.000.000-00',
          contact: '',
          jobTitle: 'Desenvolvedor'
        };
        await db.upsert('users', guilherme);
      } else {
        let updated = false;
        if (!guilherme.profiles?.includes(UserProfile.DEVELOPER)) {
          guilherme.profile = UserProfile.DEVELOPER;
          guilherme.profiles = [...(guilherme.profiles || []), UserProfile.DEVELOPER];
          updated = true;
        }
        if (guilherme.password !== 'gui1234') {
          guilherme.password = 'gui1234';
          updated = true;
        }
        if (guilherme.login !== 'guilherme.nunes') {
          guilherme.login = 'guilherme.nunes';
          updated = true;
        }
        if (!guilherme.active) {
          guilherme.active = true;
          updated = true;
        }
        
        if (updated) {
          await db.upsert('users', guilherme);
          // Update current user if it's him
          if (currentUser?.id === guilherme.id) {
            setCurrentUser(guilherme);
          }
        }
      }
    };
    assignDeveloper();
  }, [currentUser?.id]);

  // Check for Calibration Notifications
  useEffect(() => {
    const checkCalibrations = async () => {
      if (currentUser?.profile === UserProfile.PHARMACY) {
        const calibrations = await db.getAll<Calibration>('calibrations');
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        const newNotifications: AppNotification[] = [];

        for (const cal of calibrations) {
          if (!cal.nextCalibrationDate) continue;
          const nextDate = new Date(cal.nextCalibrationDate);
          
          // Check if within 30 days
          if (nextDate <= nextMonth && nextDate >= today) {
             // Logic to avoid spamming every refresh (simple simulation: check if notification exists)
             // In a real app, this would be backend job. Here we just add if not exists.
             const existingNotifs = await db.getAll<AppNotification>('notifications');
             const alreadyNotified = existingNotifs.some(n => n.title === `Calibração Próxima: ${cal.assetCode}` && !n.read);
             
              if (!alreadyNotified) {
                const notif: AppNotification = {
                  id: crypto.randomUUID(),
                  title: `Calibração Próxima: ${cal.assetCode}`,
                  message: `O equipamento ${cal.assetCode} (${cal.reference}) vence a calibração em ${cal.nextCalibrationDate.split('-').reverse().join('/')}.`,
                  date: new Date().toISOString().split('T')[0],
                  read: false,
                  targetProfiles: [UserProfile.PHARMACY],
                  linkTo: 'Calibrations'
                };
                await db.upsert('notifications', notif);
              }
          }
        }
      }
    };
    
    const checkDueDates = async () => {
      if (true) { // currentUser?.profile === UserProfile.ADMIN || currentUser?.profile === UserProfile.DEVELOPER || currentUser?.profile === UserProfile.FINANCE) {
        const transactions = await db.getAll<FinancialTransaction>('transactions');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (const t of transactions) {
          if (t.isCancelled) continue;
          
          const totalPaid = (t.payments || []).reduce((acc, p) => acc + p.amount, 0);
          if (totalPaid >= t.amount) continue; // PAID
          
          if (!t.dueDate) continue;
          
          const dueDate = new Date(t.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 3 || diffDays === 2 || diffDays === 0) {
            const daysText = diffDays === 0 ? 'hoje' : `em ${diffDays} dias`;
            const notifId = `due_alert_${t.id}_${diffDays}`;
            
            const existing = await db.getAll<AppNotification>('notifications');
            if (!existing.find(n => n.id === notifId)) {
              const notif: AppNotification = {
                id: notifId,
                title: 'Vencimento Próximo',
                message: `A NF ${t.invoiceNumber || t.description} vence ${daysText}.`,
                date: new Date().toISOString().split('T')[0],
                read: false,
                targetProfiles: [UserProfile.ADMIN, UserProfile.DEVELOPER, UserProfile.FINANCE],
                linkTo: 'FinanceTransactions'
              };
              await db.upsert('notifications', notif);
            }
          }
        }
      }
    };
    
    if (currentUser) {
      checkCalibrations();
      checkDueDates();
    }
  }, [currentUser, activeView]);

  const refreshData = async () => {
    setStudies(await db.getAll('studies'));
    setSponsors(await db.getAll('sponsors'));
    setTeam(await db.getAll('team-members'));
    setPatients(await db.getAll('patients'));
    setMonitors(await db.getAll('monitors'));
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveView('Dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(undefined);
    setActiveView('Login');
    setActiveProps({});
  };

  const handleDeleteSponsor = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este patrocinador?')) {
      await db.delete('sponsors', id);
      showSuccess('Excluído', 'Patrocinador excluído com sucesso.');
      refreshData();
    }
  };

  const handleToggleSponsorActive = async (id: string) => {
    await db.patch('sponsors', id, 'toggle-active');
    refreshData();
  };

  const navigationInterceptorRef = useRef<((view: string, props: any) => Promise<boolean>) | null>(null);

  const registerInterceptor = React.useCallback((interceptor: ((view: string, props: any) => Promise<boolean>) | null) => {
    navigationInterceptorRef.current = interceptor;
  }, []);

  const navigate = async (view: ViewState, props: any = {}) => {
    if (navigationInterceptorRef.current && !props.forceRouting) {
      const shouldProceed = await navigationInterceptorRef.current(view, props);
      if (!shouldProceed) {
        return;
      }
    }
    // Clear interceptor when successfully navigating
    navigationInterceptorRef.current = null;
    setActiveView(view);
    setActiveProps(props);
    setSortConfig(null); // Reset sort when changing views
    refreshData(); // Refresh data on navigation
  };

  const showSuccess = (title: string, message: string) => {
    setSuccessModal({ isOpen: true, title, message });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data: any[]) => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const isReadOnly = false; // currentUser?.profile === UserProfile.AUDIT;

  const hasPermission = (perm: string) => {
    return currentUser?.profile === UserProfile.DEVELOPER || currentUser?.profile === UserProfile.ADMIN || currentUserPermissions.includes(perm);
  };

  // Render Logic
  if (!currentUser || activeView === 'Login') {
    return <LoginView onLoginSuccess={handleLoginSuccess} onCancel={() => {}} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'Dashboard':
        return <DashboardView />;
      case 'NoticeBoard':
        return <NoticeBoardView userProfile={currentUser.profile} />;
      case 'CreateNotice':
        return <CreateNoticeView onCancel={() => navigate('Dashboard')} onSave={() => navigate('Dashboard')} userProfile={currentUser.profile} />;
      case 'Calendar':
        return <CalendarView studies={studies} patients={patients} canCreate={hasPermission('edit_agenda')} />;
      case 'Notepad':
        return <NotepadView />;
      case 'Settings':
        return <SettingsView currentLogo={appConfig.logo} currentText={appConfig.text} onConfigUpdate={handleConfigUpdate} />;
      case 'CreateProfile':
        return <CreateProfileView onCancel={() => navigate('Dashboard')} onSave={() => navigate('UserList')} userToEdit={activeProps.userToEdit} />;
      case 'ManageRoles':
        return <ManageRolesView onShowSuccess={showSuccess} currentUserProfile={currentUser.profile} />;
      case 'ChangeProfile':
        return null;
      case 'ChangePassword':
        return <ChangePasswordView currentUser={currentUser} onCancel={() => navigate('Dashboard')} onSuccess={() => navigate('Dashboard')} />;
      case 'UserList':
        return <UserListView onEditUser={(u) => navigate('CreateProfile', { userToEdit: u })} />;
      
      case 'PI': // Agora Team Member
        if (activeProps.mode === 'edit' || activeProps.mode === 'view') {
           return <TeamForm member={activeProps.pi} mode={activeProps.mode} onSave={async (data) => { await db.upsert('team-members', data); showSuccess('Salvo', 'Membro salvo com sucesso.'); navigate('PI'); }} onCancel={() => navigate('PI')} onEdit={() => navigate('PI', { mode: 'edit', pi: activeProps.pi })} isReadOnly={!hasPermission('edit_team')} />;
        }
        return (
          <div className="flex flex-col gap-6 p-6 h-full w-full">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Dados Equipe</h2>
              {hasPermission('create_team') && <button onClick={() => navigate('PI', { mode: 'edit' })} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase">+ Novo</button>}
            </div>
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-[#007b63] text-white sticky top-0">
                  <tr>
                    <HeaderCell label="Nome" sortKey="name" onClick={() => handleSort('name')} />
                    <HeaderCell label="Função" sortKey="role" onClick={() => handleSort('role')} />
                    <HeaderCell label="CPF" sortKey="cpf" onClick={() => handleSort('cpf')} />
                    <HeaderCell label="Celular" sortKey="cellphone" onClick={() => handleSort('cellphone')} />
                    <HeaderCell label="Status" sortKey="active" onClick={() => handleSort('active')} />
                    {hasPermission('delete_team') && <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Ação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getSortedData(team).map((t: TeamMember) => (
                    <tr key={t.id} onClick={() => navigate('PI', { mode: 'view', pi: t })} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                      <td className="px-6 py-1 text-sm font-bold text-blue-600 hover:underline">{t.name}</td>
                      <td className="px-6 py-1 text-sm text-gray-500">{t.role}</td>
                      <td className="px-6 py-1 text-sm">{t.cpf}</td>
                      <td className="px-6 py-1 text-sm text-gray-500">{t.cellphone || '-'}</td>
                      <td className="px-6 py-1 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.active !== false ? 'Ativo' : 'Desativado'}
                        </span>
                      </td>
                      {hasPermission('delete_team') && (
                        <td className="px-6 py-1 text-sm text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setDeleteTeamMemberPhase({ phase: 1, id: t.id! })}
                            className="text-red-500 hover:text-red-700 font-bold uppercase text-[10px] px-3 py-1 border border-red-200 hover:border-red-500 rounded bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            Excluir
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Studies':
        if (activeProps.mode === 'edit' || activeProps.mode === 'view') {
           return <StudyForm study={activeProps.study} mode={activeProps.mode} onSave={async (data) => { 
             const originalStudy = activeProps.study;
             const savedStudy = (await db.upsert('studies', data)) as Study; 
             const actualStudy = typeof savedStudy === 'string' ? data as Study : savedStudy;
             
             if (actualStudy.id) {
               const allTeam = await db.getAll<TeamMember>('team-members');

               // --- Handle PI Change ---
               // 1. Remove from old PI if changed
               if (originalStudy && originalStudy.pi && originalStudy.pi !== actualStudy.pi) {
                   const oldPiMember = allTeam.find(t => t.name.trim() === originalStudy.pi?.trim());
                   if (oldPiMember) {
                       const sIds = oldPiMember.studyIds || [];
                       await db.upsert('team-members', { ...oldPiMember, studyIds: sIds.filter(id => id !== actualStudy.id) });
                   }
               }
               // 2. Add to new PI
               if (actualStudy.pi) {
                   const piMember = allTeam.find(t => t.name.trim() === actualStudy.pi?.trim());
                   if (piMember) {
                     const sIds = piMember.studyIds || [];
                     if (!sIds.includes(actualStudy.id)) {
                       await db.upsert('team-members', { ...piMember, studyIds: [...sIds, actualStudy.id] });
                     }
                   }
               }

               // --- Handle Coordinator Change ---
               // 1. Remove from old Coordinator if changed
               if (originalStudy && originalStudy.coordinator && originalStudy.coordinator !== actualStudy.coordinator) {
                   const oldCoordMember = allTeam.find(t => t.name.trim() === originalStudy.coordinator?.trim());
                   if (oldCoordMember) {
                       const sIds = oldCoordMember.studyIds || [];
                       await db.upsert('team-members', { ...oldCoordMember, studyIds: sIds.filter(id => id !== actualStudy.id) });
                   }
               }
               // 2. Add to new Coordinator
               if (actualStudy.coordinator) {
                   const coordMember = allTeam.find(t => t.name.trim() === actualStudy.coordinator?.trim());
                   if (coordMember) {
                     const sIds = coordMember.studyIds || [];
                     if (!sIds.includes(actualStudy.id)) {
                       await db.upsert('team-members', { ...coordMember, studyIds: [...sIds, actualStudy.id] });
                     }
                   }
               }
             }

             showSuccess('Salvo', 'Estudo salvo.'); 
             navigate('Studies'); 
            }} onCancel={() => navigate('Studies')} onEdit={() => navigate('Studies', { mode: 'edit', study: activeProps.study })} isReadOnly={!hasPermission('edit_studies')} />;
        }
        return (
          <div className="flex flex-col gap-6 p-6 h-full w-full">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Estudos Clínicos</h2>
              {hasPermission('create_studies') && <button onClick={() => navigate('Studies', { mode: 'edit' })} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase">+ Novo</button>}
            </div>
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-[#007b63] text-white sticky top-0">
                  <tr>
                    <HeaderCell label="Nome" sortKey="name" onClick={() => handleSort('name')} />
                    <HeaderCell label="Protocolo" sortKey="protocol" onClick={() => handleSort('protocol')} />
                    <HeaderCell label="PI" sortKey="pi" onClick={() => handleSort('pi')} />
                    <HeaderCell label="Patrocinador" sortKey="sponsor" onClick={() => handleSort('sponsor')} />
                    <HeaderCell label="Status" sortKey="status" onClick={() => handleSort('status')} />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getSortedData(studies).map((s: Study) => (
                    <tr key={s.id} onClick={() => navigate('Studies', { mode: 'view', study: s })} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-1 text-sm font-bold text-blue-600 hover:underline">{s.name}</td>
                      <td className="px-6 py-1 text-sm">{s.protocol}</td>
                      <td className="px-6 py-1 text-sm">{s.pi}</td>
                      <td className="px-6 py-1 text-sm">{s.sponsor}</td>
                      <td className="px-6 py-1 text-sm"><span className={`px-2 py-0.5 rounded text-xs font-bold ${s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Sponsors':
        if (activeProps.mode === 'edit' || activeProps.mode === 'view') {
          return <SponsorForm sponsor={activeProps.sponsor} studies={studies} mode={activeProps.mode} onSave={async (data) => {
            const result = await db.upsert('sponsors', data);
            if (result && typeof result === 'string') {
              // This is likely an error message from the backend
              alert(result);
              return;
            }
            showSuccess('Salvo', 'Patrocinador salvo.');
            navigate('Sponsors');
          }} onCancel={() => navigate('Sponsors')} onEdit={() => navigate('Sponsors', { mode: 'edit', sponsor: activeProps.sponsor })} isReadOnly={!hasPermission('edit_sponsors')} />;
        }
        
        // Filter sponsors: Non-admins only see active sponsors
        const filteredSponsors = true // (currentUser?.profile === UserProfile.ADMIN || currentUser?.profile === UserProfile.DEVELOPER) 
          ? sponsors 
          : sponsors.filter(s => s.active !== false);

        return (
          <div className="flex flex-col gap-6 p-6 h-full w-full">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Patrocinadores</h2>
              {hasPermission('create_sponsors') && <button onClick={() => navigate('Sponsors', { mode: 'edit' })} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase">+ Novo</button>}
            </div>
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-[#007b63] text-white sticky top-0">
                  <tr>
                    <HeaderCell label="Nome" sortKey="name" onClick={() => handleSort('name')} />
                    <HeaderCell label="CRO" sortKey="cro" onClick={() => handleSort('cro')} />
                    <HeaderCell label="Status" sortKey="active" onClick={() => handleSort('active')} />
                    {true && <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getSortedData(filteredSponsors).map((s: Sponsor) => (
                    <tr key={s.id} onClick={() => navigate('Sponsors', { mode: 'view', sponsor: s })} className="hover:bg-gray-50 cursor-pointer group">
                      <td className="px-6 py-1 text-sm font-bold text-blue-600">{s.name}</td>
                      <td className="px-6 py-1 text-sm">{s.cro}</td>
                      <td className="px-6 py-1 text-sm">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.active !== false ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {true && (
                        <td className="px-6 py-1 text-sm" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleSponsorActive(s.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${s.active !== false ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                            >
                              {s.active !== false ? 'Inativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => handleDeleteSponsor(s.id)}
                              className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Participants':
         if (activeProps.mode === 'edit' || activeProps.mode === 'view') {
            return <ParticipantForm patient={activeProps.patient} studies={studies} mode={activeProps.mode} onSave={async (data) => { await db.upsert('patients', data); showSuccess('Salvo', 'Participante salvo.'); navigate('Participants'); }} onCancel={() => navigate('Participants')} onEdit={() => navigate('Participants', { mode: 'edit', patient: activeProps.patient })} isReadOnly={!hasPermission('edit_participants')} />;
         }
         return (
            <div className="flex flex-col gap-6 p-6 h-full w-full">
               <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                 <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Participantes</h2>
                 {hasPermission('create_participants') && <button onClick={() => navigate('Participants', { mode: 'edit' })} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase">+ Novo</button>}
               </div>
               <div className="overflow-hidden rounded-xl border bg-white shadow-sm flex-1 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#007b63] text-white sticky top-0"><tr><HeaderCell label="Nome" sortKey="name" onClick={() => handleSort('name')} /><HeaderCell label="Estudo" /><HeaderCell label="Status" /></tr></thead>
                    <tbody className="divide-y">{getSortedData(patients).map((p: Patient) => (<tr key={p.id} onClick={() => navigate('Participants', { mode: 'view', patient: p })} className="hover:bg-gray-50 cursor-pointer"><td className="px-6 py-1 text-sm font-bold text-blue-600">{p.name}</td><td className="px-6 py-1 text-sm">{studies.find(s=>s.id===p.studyId)?.name}</td><td className="px-6 py-1 text-sm">{p.status}</td></tr>))}</tbody>
                  </table>
               </div>
            </div>
         );
      
      case 'MonitoriaData':
         if (activeProps.mode === 'edit' || activeProps.mode === 'view') {
             return <MonitorForm monitor={activeProps.monitor} studies={studies} mode={activeProps.mode} onSave={async (data) => { await db.upsert('monitors', data); showSuccess('Salvo', 'Monitor salvo.'); navigate('MonitoriaData'); }} onCancel={() => navigate('MonitoriaData')} onEdit={() => navigate('MonitoriaData', { mode: 'edit', monitor: activeProps.monitor })} isReadOnly={!hasPermission('edit_monitoria')} />;
         }
         return (
             <div className="flex flex-col gap-6 p-6 h-full w-full">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Monitores</h2>
                  {hasPermission('create_monitoria') && <button onClick={() => navigate('MonitoriaData', { mode: 'edit' })} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase">+ Novo</button>}
                </div>
                <div className="overflow-hidden rounded-xl border bg-white shadow-sm flex-1 overflow-y-auto">
                   <table className="w-full text-left">
                     <thead className="bg-[#007b63] text-white sticky top-0"><tr><HeaderCell label="Nome" sortKey="name" onClick={() => handleSort('name')} /><HeaderCell label="Estudo(s)" /><HeaderCell label="CRO" /></tr></thead>
                     <tbody className="divide-y">{getSortedData(monitors).map((m: MonitorEntry) => {
                         const mStudies = m.studyIds && m.studyIds.length > 0 
                             ? m.studyIds.map(id => studies.find(s=>s.id===id)?.name).filter(Boolean).join(', ')
                             : studies.find(s=>s.id===m.studyId)?.name || '';
                         return (<tr key={m.id} onClick={() => navigate('MonitoriaData', { mode: 'view', monitor: m })} className="hover:bg-gray-50 cursor-pointer"><td className="px-6 py-1 text-sm font-bold text-blue-600">{m.name}</td><td className="px-6 py-1 text-sm">{mStudies}</td><td className="px-6 py-1 text-sm">{m.cro}</td></tr>);
                     })}</tbody>
                   </table>
                </div>
             </div>
         );

      case 'RegulatoryLinks': return <RegulatoryLinksView />;
      case 'RegulatoryIndices': return <RegulatoryIndicesView studies={studies} />;
      case 'RegulatoryPartialReport': return <PartialReportView studies={studies} isReadOnly={isReadOnly} onShowSuccess={showSuccess} />;
      case 'CEPMeeting': return <CEPMeetingView studies={studies} isReadOnly={isReadOnly} onShowSuccess={showSuccess} />;
      case 'CEPCalendar': return <CEPCalendarView />;
      case 'KitStock': return <KitStockView studies={studies} isReadOnly={isReadOnly} onShowSuccess={showSuccess} />;
      case 'ProtocolDeviation': return <ProtocolDeviationView studies={studies} pis={team} patients={patients} team={team} collectionKey="deviations" title="Desvio de Protocolo" pdfTitle="Desvio de Protocolo" isReadOnly={isReadOnly} onShowSuccess={showSuccess} />;
      case 'SAEDeviation': return <ProtocolDeviationView studies={studies} pis={team} patients={patients} team={team} collectionKey="saeDeviations" title="Desvio de SAE" pdfTitle="Relatório de Evento Adverso Grave (SAE)" isReadOnly={isReadOnly} onShowSuccess={showSuccess} />;
      case 'GCPDeviation': return <ProtocolDeviationView studies={studies} pis={team} patients={patients} team={team} collectionKey="gcpDeviations" title="Desvio de GCP" pdfTitle="Desvio de Boas Práticas Clínicas (GCP)" isReadOnly={isReadOnly} onShowSuccess={showSuccess} />;
      case 'VisitControl': return <VisitControlView />;
      case 'InfusionControl': return <InfusionControlView />; 
      case 'Reception': return <ReceptionView />; // Nova View de Recepção
      case 'ExamRequest': return <ExamRequestView patients={patients} studies={studies} />;
      case 'BirthdayFilter': return <BirthdayFilterView />;
      case 'Calibrations': return <CalibrationView userProfile={currentUser.profile} canCreate={hasPermission('create_calibrations')} canEdit={hasPermission('edit_calibrations')} />;
      case 'Finance': return <FinanceDashboardView onShowSuccess={showSuccess} />;
      case 'FinanceTransactions': return <FinanceDashboardView onShowSuccess={showSuccess} initialTab="TRANSACOES" hideTabs />;
      case 'FinanceAssets': return <FinanceDashboardView onShowSuccess={showSuccess} initialTab="PATRIMONIO" hideTabs />;
      case 'FinanceReport': return <FinanceReportView />;
      case 'VacationControl': return <FinanceDashboardView onShowSuccess={showSuccess} initialTab="FERIAS" hideTabs />;
      
      case 'Associates':
        if (activeProps.mode === 'edit' || activeProps.mode === 'view') {
          return <AssociateForm associate={activeProps.associate} mode={activeProps.mode} onSave={async (data) => { await db.upsert('associates', data); showSuccess('Salvo', 'Associado salvo.'); navigate('Associates'); }} onCancel={() => navigate('Associates')} onEdit={() => navigate('Associates', { mode: 'edit', associate: activeProps.associate })} isReadOnly={isReadOnly} />;
        }
        return <AssociateListView onNavigate={navigate} isReadOnly={isReadOnly} />;
      
      default:
        return <NoticeBoardView userProfile={currentUser.profile} />;
    }
  };

  const handleSwitchProfile = (newProfile: UserProfile) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, profile: newProfile });
    }
  };

  return (
    <NavigationContext.Provider value={{ registerInterceptor }}>
      <Layout 
        onNavigate={navigate} 
        onLogout={handleLogout} 
        onSwitchProfile={handleSwitchProfile}
        userProfile={currentUser.profile} 
        currentUser={currentUser} 
        currentUserPermissions={currentUserPermissions}
        customLogo={appConfig.logo}
        customLogoText={appConfig.text}
      >
        {renderContent()}
        <SuccessModal 
          isOpen={successModal.isOpen} 
          title={successModal.title} 
          message={successModal.message} 
          onConfirm={() => setSuccessModal({ ...successModal, isOpen: false })} 
        />
        <ConfirmationModal
          isOpen={deleteTeamMemberPhase.phase === 1}
          title="Exclusão de Membro da Equipe"
          message="Essa exclusão é permanente e irreversível. Você deseja mesmo fazer ela?"
          onConfirm={() => setDeleteTeamMemberPhase(prev => ({ ...prev, phase: 2 }))}
          onCancel={() => setDeleteTeamMemberPhase({ phase: 0, id: null })}
          confirmText="SIM"
          cancelText="NÃO"
        />
        <ConfirmationModal
          isOpen={deleteTeamMemberPhase.phase === 2}
          title="Confirmar Exclusão"
          message="Tem certeza disso?"
          onConfirm={async () => {
            if (deleteTeamMemberPhase.id) {
              await db.delete('team-members', deleteTeamMemberPhase.id);
              showSuccess('Excluído', 'Membro da equipe foi excluído permanentemente.');
              refreshData();
            }
            setDeleteTeamMemberPhase({ phase: 0, id: null });
          }}
          onCancel={() => setDeleteTeamMemberPhase({ phase: 0, id: null })}
          confirmText="OK"
          cancelText="CANCELAR"
        />
      </Layout>
    </NavigationContext.Provider>
  );
}
