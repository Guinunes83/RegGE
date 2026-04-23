
import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile, User, AppNotification } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { db } from '../database';

interface LayoutProps {
  onNavigate: (view: ViewState, props?: any) => void;
  onLogout: () => void;
  onSwitchProfile?: (profile: UserProfile) => void;
  userProfile: UserProfile;
  currentUser?: User;
  currentUserPermissions?: string[];
  children: React.ReactNode; 
  customLogo: string | null;
  customLogoText: string;
}

type MenuItem = {
  label: string;
  view?: ViewState;
  children?: MenuItem[];
  roles?: UserProfile[];
  excludedRoles?: UserProfile[];
  icon?: React.ReactNode;
  permission?: string;
  action?: string;
};

export const Layout: React.FC<LayoutProps> = ({ onNavigate, onLogout, onSwitchProfile, userProfile, currentUser, currentUserPermissions = [], children, customLogo, customLogoText }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  
  // Controle do Menu Lateral - Inicia vazio (retraído)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]); 
  const [activeViewLabel, setActiveViewLabel] = useState<string>('Início');

  useEffect(() => {
    const loadNotifications = async () => {
      const data = await db.getAll<AppNotification>('notifications');
      const userNotifications = data.filter(n => 
        !n.targetProfiles || 
        n.targetProfiles.length === 0 || 
        n.targetProfiles.includes(userProfile) ||
        userProfile === UserProfile.ADMIN ||
        userProfile === UserProfile.DEVELOPER
      );
      setNotifications(userNotifications.reverse());
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [userProfile]);

  // Helper para Ícones
  const Icons = {
    Home: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    Data: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
    Filter: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
    Sector: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Tools: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  };

  const menuStructure: MenuItem[] = [
    { 
      label: 'Início', 
      icon: Icons.Home,
      children: [
        { label: 'Agenda', view: 'Calendar', permission: 'access_agenda' },
        { label: 'Configurações', view: 'Settings', permission: 'access_settings' },
        { label: 'Dashboard', view: 'Dashboard', permission: 'access_dashboard' },
        { label: 'Mural de Avisos', view: 'NoticeBoard' },
        { label: 'Notas', view: 'Notepad' },
        { 
          label: 'Perfil de Usuário', 
          children: [
            { label: 'Relação de Perfis', view: 'ManageRoles', permission: 'access_manage_roles' },
            { label: 'Relação de Usuário', view: 'UserList', permission: 'manage_users' },
            { label: 'Alterar Senha', action: 'openChangePassword' },
          ]
        },
        { label: 'Sair', view: 'Exit' },
      ]
    },
    { 
      label: 'Dados', 
      icon: Icons.Data,
      children: [
        { label: 'Calibrações', view: 'Calibrations', permission: 'access_calibrations' },
        { label: 'Equipe', view: 'PI', permission: 'access_team' },
        { label: 'Estudos', view: 'Studies', permission: 'access_studies' },
        { 
          label: 'Índices', 
          children: [
            { label: 'Regulatórios', view: 'RegulatoryIndices', permission: 'access_indices' }
          ]
        },
        { label: 'Monitoria', view: 'MonitoriaData', permission: 'access_monitoria' },
        { label: 'Participantes', view: 'Participants', permission: 'access_participants' },
        { label: 'Patrocinador', view: 'Sponsors', permission: 'access_sponsors' },
      ]
    },
    { 
      label: 'Setor', 
      icon: Icons.Sector,
      children: [
        { 
          label: 'Adm', 
          children: [
            { label: 'Aniversários', view: 'BirthdayFilter', permission: 'access_birthday' },
            { label: 'Associados', view: 'Associates', permission: 'access_associates' },
            { label: 'Geral', view: 'Admin', permission: 'access_adm_general' },
            { label: 'Patrimônio', view: 'FinanceAssets', permission: 'access_assets' },
            { 
              label: 'RH', 
              children: [
                { label: 'Controle de Férias', view: 'VacationControl', permission: 'access_hr' },
              ]
            },
          ],
          permission: 'access_adm'
        },
        { label: 'Auditoria', view: 'Audit', permission: 'access_audit' },
        { 
          label: 'Coordenação', 
          children: [
            { label: 'Controle de Visitas', view: 'VisitControl', permission: 'access_visit_control' },
            { label: 'Desvio de GCP', view: 'GCPDeviation', permission: 'access_gcp_deviation' },
            { label: 'Desvio de Protocolo', view: 'ProtocolDeviation', permission: 'access_protocol_deviation' },
            { label: 'Desvio de SAE', view: 'SAEDeviation', permission: 'access_sae_deviation' },
            { label: 'Estoque de Kits', view: 'KitStock', permission: 'access_kit_stock' },
            { label: 'Solicitação de Exames', view: 'ExamRequest', permission: 'access_exam_request' },
          ]
        },
        { label: 'Educação / Ensino', view: 'Education', permission: 'access_education' },
        { 
          label: 'Enfermagem', 
          children: [
            { label: 'Controle de Infusão', view: 'InfusionControl', permission: 'access_infusion_control' },
            { label: 'Geral', view: 'Nursing', permission: 'access_nursing_general' },
          ]
        },
        { label: 'Farmácia', view: 'Pharmacy', permission: 'access_pharmacy' },
        { 
          label: 'Financeiro', 
          children: [
            { label: 'Lançamento & NFs', view: 'FinanceTransactions', permission: 'access_finance_transactions' },
            { label: 'Relatório de lançamentos', view: 'FinanceReport', permission: 'access_finance_report' },
          ]
        },
        { 
          label: 'Recepção', 
          children: [
            { label: 'Nova Consulta', view: 'Reception', permission: 'access_reception' }
          ]
        },
        { 
          label: 'Regulatório',
          children: [
            { label: 'Calendário Reuniões CEP', view: 'CEPCalendar', permission: 'access_cep_calendar' },
            { label: 'Links Úteis', view: 'RegulatoryLinks', permission: 'access_regulatory_links' },
            { label: 'Relatórios Parciais', view: 'RegulatoryPartialReport', permission: 'access_regulatory_partial_report' },
            { label: 'Reunião CEP', view: 'CEPMeeting', permission: 'access_cep_meeting' },
          ] 
        },
      ]
    },
  ];

  const handleNavigation = (view: ViewState | undefined, label: string) => {
    if (view) {
      if (view === 'Exit') setShowLogoutModal(true);
      else {
        onNavigate(view);
        setActiveViewLabel(label);
      }
      setIsProfileMenuOpen(false);
      setIsNotificationMenuOpen(false);
    }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    const updated = { ...n, read: true };
    await db.upsert('notifications', updated);
    setNotifications(prev => prev.map(notif => notif.id === n.id ? updated : notif));

    if (n.linkTo) {
      onNavigate(n.linkTo);
    }
    setIsNotificationMenuOpen(false);
  };

  const toggleMenu = (label: string, depth: number) => {
    if (depth === 0) {
      setExpandedMenus(prev => 
        prev.includes(label) ? prev.filter(l => l !== label) : [label]
      );
    } else {
      setExpandedMenus(prev => 
        prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
      );
    }
  };

  const getProfileLabel = (p: UserProfile) => {
    return p;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    if (item.roles && !item.roles.includes(userProfile)) return null;
    if (item.excludedRoles && item.excludedRoles.includes(userProfile)) return null;
    
    if (item.permission) {
      const hasPermission = currentUserPermissions.includes(item.permission) || userProfile === UserProfile.DEVELOPER || userProfile === UserProfile.ADMIN;
      if (!hasPermission) return null;
    }

    const visibleChildren = item.children?.filter(child => {
      if (child.permission) {
        return currentUserPermissions.includes(child.permission) || userProfile === UserProfile.DEVELOPER || userProfile === UserProfile.ADMIN;
      }
      return true;
    });

    if (item.children && visibleChildren?.length === 0) return null;

    const isExpanded = expandedMenus.includes(item.label);
    const hasChildren = visibleChildren && visibleChildren.length > 0;
    const paddingLeft = depth * 12 + 16; 

    return (
      <div key={item.label} className="select-none">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.label, depth);
            } else if (item.action === 'openChangePassword') {
              // Custom action: handled by a callback or dispatch
              const event = new CustomEvent('openChangePasswordModal');
              window.dispatchEvent(event);
            } else {
              handleNavigation(item.view, item.label);
            }
          }}
          className={`
            w-full flex items-center justify-between py-3 pr-4 transition-all text-sm font-medium
            ${!hasChildren && activeViewLabel === item.label 
               ? 'bg-white text-[#007b63] font-bold border-l-4 border-white' // Item Ativo Final
               : 'text-white/80 hover:text-white hover:bg-white/10' // Item Inativo
            }
            ${hasChildren && isExpanded ? 'bg-[#00604d]' : ''} // Pai Expandido
          `}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div className="flex items-center gap-3">
            {item.icon && <span className={!hasChildren && activeViewLabel === item.label ? 'text-[#007b63]' : 'text-white/60'}>{item.icon}</span>}
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            <svg 
              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="bg-[#00604d]">
            {visibleChildren.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#007b63] text-white flex flex-col shadow-2xl z-30 flex-shrink-0 transition-all">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-white/10 bg-[#006b56]">
           <div className="flex flex-col cursor-pointer" onClick={() => handleNavigation('Dashboard', 'Dashboard')}>
             {customLogo ? (
               <img src={customLogo} alt="Logo" className="max-w-[150px] max-h-[32px] object-contain mb-1" />
             ) : (
               <span className="text-white font-black text-xl tracking-tighter leading-none mb-1">
                 {customLogoText ? '' : 'GRUPO ELORA'}
               </span>
             )}
             <span className="text-[9px] text-white/70 font-bold uppercase tracking-widest leading-none mt-0.5" style={{ textAlign: customLogo ? 'center' : 'left' }}>
               {customLogoText}
             </span>
           </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4">
           {menuStructure.map(item => renderMenuItem(item))}
        </nav>

        {/* Sidebar Footer (Version/Info) */}
        <div className="p-4 border-t border-white/10 text-center">
           <p className="text-[10px] text-white/40">Versão 2.6.0</p>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 shadow-sm z-20">
           {/* Close menus when clicking outside */}
           {(isProfileMenuOpen || isNotificationMenuOpen) && (
             <div className="fixed inset-0 z-40 bg-transparent" onClick={() => { setIsProfileMenuOpen(false); setIsNotificationMenuOpen(false); }}></div>
           )}
           {/* Breadcrumb / Page Title */}
           <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium text-sm">Painel</span>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-[#007b63] font-bold text-sm uppercase tracking-wide">{activeViewLabel}</span>
           </div>

           {/* Right Actions */}
           <div className="flex items-center gap-4">
              
              {/* Mural Shortcut */}
              <button 
                onClick={() => handleNavigation('NoticeBoard', 'Mural de Avisos')}
                className="p-2 text-gray-400 hover:text-[#007b63] hover:bg-[#007b63]/10 rounded-xl transition-all"
                title="Mural de Avisos"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </button>

              <div className="h-6 w-[1px] bg-gray-200"></div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsNotificationMenuOpen(!isNotificationMenuOpen); }}
                  className={`p-2 rounded-xl transition-all relative ${isNotificationMenuOpen ? 'text-[#007b63] bg-[#007b63]/10' : 'text-gray-400 hover:text-[#007b63]'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                    </span>
                  )}
                </button>

                {isNotificationMenuOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white shadow-2xl border border-gray-100 rounded-xl overflow-hidden animate-in slide-in-from-top-2 z-50">
                    <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notificações</span>
                      {unreadCount > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{unreadCount} novas</span>}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-xs italic">Nenhuma notificação.</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs font-bold ${!n.read ? 'text-[#007b63]' : 'text-gray-700'}`}>{n.title}</span>
                              <span className="text-[9px] text-gray-400">{n.date}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsProfileMenuOpen(!isProfileMenuOpen); }}
                  className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-lg transition-all border border-transparent hover:border-gray-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#007b63] flex items-center justify-center text-white font-black text-sm shadow-md">
                    {currentUser?.name.charAt(0)}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                     <span className="text-xs font-bold text-gray-700 leading-tight truncate max-w-[100px]">{currentUser?.name}</span>
                     <span className="text-[10px] text-gray-400 font-medium leading-none">{getProfileLabel(userProfile)}</span>
                  </div>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-14 w-56 bg-white shadow-xl border border-gray-100 rounded-xl py-2 animate-in slide-in-from-top-2 z-50">
                    {currentUser?.profiles && currentUser.profiles.length > 0 && (
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Alternar Perfil</p>
                        <div className="flex flex-col gap-1">
                          {currentUser.profiles.map(p => (
                            <button
                              key={p}
                              onClick={() => {
                                if (onSwitchProfile) onSwitchProfile(p);
                                setIsProfileMenuOpen(false);
                              }}
                              className={`text-left px-2 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between ${userProfile === p ? 'bg-[#007b63]/10 text-[#007b63] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                              {getProfileLabel(p)}
                              {userProfile === p && <svg className="w-3 h-3 text-[#007b63]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setShowLogoutModal(true);
                      }} 
                      className="w-full text-left px-4 py-2 text-xs text-red-600 font-bold hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sair do Sistema
                    </button>
                  </div>
                )}
              </div>

           </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-hidden relative bg-gray-50 flex flex-col">
           {children}
        </main>

      </div>
      
      {/* GLOBAL MODALS */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50" onClick={(e) => e.stopPropagation()}>
           <ConfirmationModal 
             isOpen={showLogoutModal}
             title="Sair do Sistema"
             message="Tem certeza que deseja sair do sistema?"
             onConfirm={() => {
               setShowLogoutModal(false);
               onLogout();
             }}
             onCancel={() => setShowLogoutModal(false)}
           />
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
      `}</style>
    </div>
  );
};
