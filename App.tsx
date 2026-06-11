
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
import { ChangePasswordModal } from './components/ChangePasswordModal';
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
import { ValidationModal } from './components/ValidationModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Associate } from './types';
import { NavigationContext } from './contexts/NavigationContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

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
  const [deleteStudyPhase, setDeleteStudyPhase] = useState<{phase: number, id: string | null}>({ phase: 0, id: null });
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // File import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTarget, setImportTarget] = useState<'studies'|'team'|'participants'|null>(null);

  const triggerImport = (target: 'studies'|'team'|'participants') => {
    setImportTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importTarget) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Tenta enviar para o backend Java (Spring Boot)
      const response = await fetch(`http://localhost:8080/api/import/${importTarget}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(`Erro na importação: ${errorText || response.statusText}`);
        return;
      }

      const result = await response.json();
      showSuccess('Importação concluída', result.message || 'Arquivo importado com sucesso.');
      refreshData();
    } catch (error: any) {
      // Fallback amigável caso o backend não esteja rodando
      alert(`Falha ao contactar o servidor (Java Backend). ${error.message}`);
    } finally {
      setImportTarget(null);
    }
  };

  // Visibility toggles
  const [showInactiveStudies, setShowInactiveStudies] = useState(false);
  const [showInactiveTeam, setShowInactiveTeam] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Mostrar popup nativo de confirmação
      e.preventDefault();
      e.returnValue = ''; 
    };

    const handleUnload = () => {
      // Ao fechar ou atualizar, tentamos matar o backend java para que não fique rodando no desktop em segundo plano.
      if (document.visibilityState === 'hidden' || true) {
         navigator.sendBeacon('http://localhost:8080/api/shutdown');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  useEffect(() => {
    const handleOpenPasswordModal = () => setIsChangePasswordModalOpen(true);
    window.addEventListener('openChangePasswordModal', handleOpenPasswordModal);
    return () => window.removeEventListener('openChangePasswordModal', handleOpenPasswordModal);
  }, []);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

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
    
    const checkDeviations = async () => {
      const customRoles = await db.getAll<{ id: string, name: string, permissions?: string[] }>('userProfiles');
      const targetProfiles: UserProfile[] = [];
      for (const role of customRoles) {
        if (role.permissions?.includes('notify_deviation_generated')) {
          targetProfiles.push(role.name as UserProfile);
        }
      }

      // Add ADMIN and DEVELOPER if they natively have permission or by default (they usually see everything anyway)
      
      const p1 = await db.getAll<any>('deviations');
      const p2 = await db.getAll<any>('gcpDeviations');
      const p3 = await db.getAll<any>('saeDeviations');
      
      const allDeviations = [...p1, ...p2, ...p3];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingNotifs = await db.getAll<AppNotification>('notifications');

      for (const dev of allDeviations) {
        if (dev.status === 'Pendente') {
          if (!dev.deviationDate) continue; 
          const devDate = new Date(dev.deviationDate + "T00:00:00");
          devDate.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - devDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0) {
            const notifId = `dev_alert_${dev.id}_${diffDays}`;
            if (!existingNotifs.find(n => n.id === notifId)) {
               let message = diffDays === 0 ? `O desvio do Participante ${dev.patientNumber || ''} foi gerado e está Pendente.` : `O desvio do Participante ${dev.patientNumber || ''} continua Pendente há ${diffDays} dia(s).`;
               
               const studyInfo = dev.studyId ? ` (Estudo: ${dev.studyId})` : '';
               const notif: AppNotification = {
                 id: notifId,
                 title: `Desvio Pendente${studyInfo}`,
                 message,
                 date: new Date().toISOString().split('T')[0],
                 read: false,
                 targetProfiles,
                 linkTo: 'ProtocolDeviation' as ViewState
               };
               await db.upsert('notifications', notif);
               existingNotifs.push(notif); // to prevent duplicates in the same run if any
            }
          }
        }
      }
    };

    if (currentUser) {
      checkCalibrations();
      checkDueDates();
      checkDeviations();
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

  const handleToggleStudyActive = async (s: Study) => {
    const updatedStatus = s.active !== false ? 'Closed' as const : 'Active' as const;
    const updated = {
      ...s,
      active: s.active !== false ? false : true,
      status: updatedStatus
    };
    await db.upsert('studies', updated);
    showSuccess(
      updated.active ? 'Ativado' : 'Desativado',
      `O estudo "${s.name}" foi ${updated.active ? 'ativado' : 'desativado'} com sucesso.`
    );
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
    setSortConfig({ key: 'name', direction: 'asc' }); // Reset sort when changing views
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
      case 'UserList':
        return <UserListView onEditUser={(u) => navigate('CreateProfile', { userToEdit: u })} onAddUser={() => navigate('CreateProfile')} />;
      
      case 'PI': // Agora Team Member
        if (activeProps.mode === 'edit' || activeProps.mode === 'view') {
           const handleSaveTeamMember = async (data: TeamMember) => {
             const savedMember = (await db.upsert('team-members', data)) as TeamMember;
             const actualMember = typeof savedMember === 'string' ? data : savedMember;
             
             // Two-way sync: update Studies' delegation if member is Sub-Investigador
             const allStudies = await db.getAll<Study>('studies');
             for (const study of allStudies) {
               const sr = actualMember.studyRoles || [];
               const hasRole = sr.some(s => s.studyId === study.id && s.role.toLowerCase().includes('sub-investigador'));
               const delegation = study.delegation || [];
               const isDelegated = delegation.some(d => d.memberId === actualMember.id);
               
               if (hasRole && !isDelegated) {
                 await db.upsert('studies', { ...study, delegation: [...delegation, { memberId: actualMember.id, memberName: actualMember.name, role: 'Sub-Investigador (SI)' }] });
               } else if (!hasRole && isDelegated) {
                 await db.upsert('studies', { ...study, delegation: delegation.filter(d => d.memberId !== actualMember.id) });
               }
             }
             
             refreshData();
             showSuccess('Salvo', 'Membro salvo com sucesso.');
             navigate('PI');
           };
           
           return <TeamForm currentUser={currentUser} member={activeProps.pi} mode={activeProps.mode} onSave={handleSaveTeamMember} onCancel={() => navigate('PI')} onEdit={() => navigate('PI', { mode: 'edit', pi: activeProps.pi })} isReadOnly={!hasPermission('edit_team')} />;
        }
        return (
          <div className="flex flex-col gap-6 p-6 h-full w-full">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Equipe</h2>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Exibir desativados:</span>
                  <button 
                    onClick={() => setShowInactiveTeam(!showInactiveTeam)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${showInactiveTeam ? 'bg-[#007b63]' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showInactiveTeam ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {hasPermission('create_team') && <button onClick={() => triggerImport('team')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 px-4 py-2 rounded-lg shadow-sm font-bold text-xs uppercase transition-colors">Importar CSV</button>}
                {hasPermission('create_team') && <button onClick={() => navigate('PI', { mode: 'edit' })} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase">+ Novo</button>}
              </div>
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
                  {getSortedData(showInactiveTeam ? team : team.filter(t => t.active !== false)).map((t: TeamMember) => (
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
               
               // --- Handle Sub-Investigators (Delegation) Sync ---
               const delegationMemIds = new Set((actualStudy.delegation || []).map(d => d.memberId));
               for (const member of allTeam) {
                 const isDelegated = delegationMemIds.has(member.id);
                 const sr = member.studyRoles || [];
                 const hasRole = sr.some(s => s.studyId === actualStudy.id && s.role.toLowerCase().includes('sub-investigador'));
                 
                 if (isDelegated && !hasRole) {
                   await db.upsert('team-members', { ...member, studyRoles: [...sr, { studyId: actualStudy.id, role: 'Sub-Investigador' }] });
                 } else if (!isDelegated && hasRole) {
                   await db.upsert('team-members', { ...member, studyRoles: sr.filter(s => !(s.studyId === actualStudy.id && s.role.toLowerCase().includes('sub-investigador'))) });
                 }
               }

               // --- Handle Monitor Sync ---
               const allMonitors = await db.getAll<MonitorEntry>('monitors');
               for (const m of allMonitors) {
                   const isLinkedToStudy = actualStudy.monitors?.some(sm => sm.id === m.id);
                   const hasStudyId = m.studyIds?.includes(actualStudy.id);
                   
                   let shouldUpdateMonitor = false;
                   if (isLinkedToStudy && !hasStudyId) {
                       m.studyIds = [...(m.studyIds || []), actualStudy.id];
                       shouldUpdateMonitor = true;
                   } else if (!isLinkedToStudy && hasStudyId) {
                       m.studyIds = m.studyIds!.filter(id => id !== actualStudy.id);
                       shouldUpdateMonitor = true;
                   }
                   if (shouldUpdateMonitor) await db.upsert('monitors', m);
               }
             }

             refreshData();
             showSuccess('Salvo', 'Estudo salvo.'); 
             navigate('Studies'); 
            }} onCancel={() => navigate('Studies')} onEdit={() => navigate('Studies', { mode: 'edit', study: activeProps.study })} isReadOnly={!hasPermission('edit_studies')} />;
        }
        return (
          <div className="flex flex-col gap-6 p-6 h-full w-full">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-[#007b63] uppercase tracking-tighter">Estudos</h2>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Exibir desativados:</span>
                  <button 
                    onClick={() => setShowInactiveStudies(!showInactiveStudies)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${showInactiveStudies ? 'bg-[#007b63]' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showInactiveStudies ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {hasPermission('create_studies') && <button onClick={() => triggerImport('studies')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 px-4 py-2 rounded-lg shadow-sm font-bold text-xs uppercase transition-colors">Importar CSV</button>}
                {hasPermission('create_studies') && <button onClick={() => navigate('Studies', { mode: 'edit' })} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase">+ Novo</button>}
              </div>
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
                    {(hasPermission('edit_studies') || hasPermission('delete_studies')) && (
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Ação</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getSortedData(showInactiveStudies ? studies : studies.filter(s => s.active !== false)).map((s: Study) => (
                    <tr key={s.id} onClick={() => navigate('Studies', { mode: 'view', study: s })} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                      <td className="px-6 py-1 text-sm font-bold text-blue-600 hover:underline">{s.name}</td>
                      <td className="px-6 py-1 text-sm">{s.protocol}</td>
                      <td className="px-6 py-1 text-sm">{s.pi}</td>
                      <td className="px-6 py-1 text-sm">{s.sponsor}</td>
                      <td className="px-6 py-1 text-sm"><span className={`px-2 py-0.5 rounded text-xs font-bold ${s.active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span></td>
                      {(hasPermission('edit_studies') || hasPermission('delete_studies')) && (
                        <td className="px-6 py-1 text-sm text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-end items-center">
                            {hasPermission('edit_studies') && (
                              <>
                                <button
                                  onClick={() => navigate('Studies', { mode: 'edit', study: s })}
                                  className="text-[#007b63] hover:text-[#006b56] font-bold uppercase text-[10px] px-2.5 py-1 border border-gray-200 hover:border-[#007b63] rounded bg-white transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleToggleStudyActive(s)}
                                  className={`font-bold uppercase text-[10px] px-2.5 py-1 border rounded transition-colors ${
                                    s.active !== false
                                      ? 'text-amber-600 hover:text-amber-800 border-amber-200 hover:border-amber-600 bg-amber-50'
                                      : 'text-emerald-600 hover:text-emerald-800 border-emerald-200 hover:border-emerald-600 bg-emerald-50'
                                  }`}
                                >
                                  {s.active !== false ? 'Desativar' : 'Ativar'}
                                </button>
                              </>
                            )}
                            {hasPermission('delete_studies') && (
                              <button
                                onClick={() => setDeleteStudyPhase({ phase: 1, id: s.id })}
                                className="text-red-500 hover:text-red-700 font-bold uppercase text-[10px] px-2.5 py-1 border border-red-200 hover:border-red-500 rounded bg-red-50 hover:bg-red-100 transition-colors"
                              >
                                Excluir
                              </button>
                            )}
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
                 <div className="flex gap-2">
                   {hasPermission('create_participants') && <button onClick={() => triggerImport('participants')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 px-4 py-2 rounded-lg shadow-sm font-bold text-xs uppercase transition-colors">Importar CSV</button>}
                   {hasPermission('create_participants') && <button onClick={() => navigate('Participants', { mode: 'edit' })} className="bg-[#007b63] text-white px-4 py-2 rounded-lg shadow-md font-bold text-xs uppercase">+ Novo</button>}
                 </div>
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
             return (
               <MonitorForm 
                 monitor={activeProps.monitor} 
                 studies={studies} 
                 mode={activeProps.mode} 
                 onSave={async (data) => { 
                   const savedMonitor = (await db.upsert('monitors', data)) as MonitorEntry; 
                   const actualMonitor = typeof savedMonitor === 'string' ? data as MonitorEntry : savedMonitor;

                   if (actualMonitor.id) {
                     const allStudies = await db.getAll<Study>('studies');
                     for (const s of allStudies) {
                         const monitorIndex = s.monitors?.findIndex(m => m.id === actualMonitor.id) ?? -1;
                         const includedInMonitor = actualMonitor.studyIds?.includes(s.id);
                         
                         let shouldUpdate = false;
                         if (includedInMonitor && monitorIndex === -1) {
                             s.monitors = [...(s.monitors || []), actualMonitor];
                             shouldUpdate = true;
                         } else if (!includedInMonitor && monitorIndex !== -1) {
                             s.monitors = s.monitors!.filter(m => m.id !== actualMonitor.id);
                             shouldUpdate = true;
                         } else if (includedInMonitor && monitorIndex !== -1) {
                             s.monitors![monitorIndex] = actualMonitor; // keep it fresh
                             shouldUpdate = true;
                         }
                         if (shouldUpdate) await db.upsert('studies', s);
                     }
                   }

                   refreshData();
                   showSuccess('Salvo', 'Monitor salvo.'); 
                   navigate('MonitoriaData'); 
                 }} 
                 onCancel={() => navigate('MonitoriaData')} 
                 onEdit={() => navigate('MonitoriaData', { mode: 'edit', monitor: activeProps.monitor })} 
                 isReadOnly={!hasPermission('edit_monitoria')} 
               />
             );
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
      case 'CEPMeeting': return <CEPMeetingView studies={studies} isReadOnly={isReadOnly} hasDeletePermission={hasPermission('delete_cep_meeting')} onShowSuccess={showSuccess} onNavigate={navigate} />;
      case 'CEPCalendar': return <CEPCalendarView />;
      case 'KitStock': return <KitStockView studies={studies} isReadOnly={isReadOnly} onShowSuccess={showSuccess} />;
      case 'ProtocolDeviation': return <ProtocolDeviationView studies={studies} pis={team} patients={patients} team={team} isReadOnly={isReadOnly} onShowSuccess={showSuccess} />;
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
    // @ts-ignore
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
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
          <ConfirmationModal
            isOpen={deleteStudyPhase.phase === 1}
            title="Exclusão de Estudo"
            message="Esta exclusão é permanente e irreversível. Você deseja mesmo excluir este estudo?"
            onConfirm={() => setDeleteStudyPhase(prev => ({ ...prev, phase: 2 }))}
            onCancel={() => setDeleteStudyPhase({ phase: 0, id: null })}
            confirmText="SIM"
            cancelText="NÃO"
          />
          <ConfirmationModal
            isOpen={deleteStudyPhase.phase === 2}
            title="Confirmar Exclusão de Estudo"
            message="Tem certeza disso? Todos os dados vinculados ao estudo continuarão salvos, mas o estudo será permanentemente excluído."
            onConfirm={async () => {
              if (deleteStudyPhase.id) {
                await db.delete('studies', deleteStudyPhase.id);
                showSuccess('Excluído', 'O estudo foi excluído permanentemente.');
                refreshData();
              }
              setDeleteStudyPhase({ phase: 0, id: null });
            }}
            onCancel={() => setDeleteStudyPhase({ phase: 0, id: null })}
            confirmText="SIM, EXCLUIR"
            cancelText="CANCELAR"
          />
          {isChangePasswordModalOpen && (
            <ChangePasswordModal
              currentUser={currentUser}
              onClose={() => setIsChangePasswordModalOpen(false)}
              onSuccess={() => {
                setIsChangePasswordModalOpen(false);
                showSuccess('Senha Alterada', 'Sua senha foi atualizada com sucesso.');
              }}
            />
          )}
          <ValidationModal />
          <input 
            type="file" 
            accept=".csv"
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </Layout>
      </NavigationContext.Provider>
    </GoogleOAuthProvider>
  );
}
