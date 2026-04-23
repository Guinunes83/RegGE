
export const UserProfile = {
  DEVELOPER: 'Desenvolvedor', // Acesso Master
  ADMIN: 'Administrador',            // Administrativo (Acesso Total)
  COORDINATOR: 'Coordenação', // Coordenação
  REGULATORY: 'Regulatório',   // Regulatório
  NURSE: 'Enfermagem',             // Enfermagem
  AUDIT: 'Auditoria',             // Auditoria
  FINANCE: 'Financeiro',         // Financeiro
  EDUCATION: 'Ensino',     // Ensino
  PHARMACY: 'Farmácia'        // Farmácia
} as const;

export type UserProfile = string;

export type User = {
  id: string;
  name: string;
  jobTitle: string; // Função
  cpf: string;
  contact: string;
  login: string;
  password?: string; // Em produção, nunca armazenar texto plano
  profile: UserProfile; // Perfil principal/ativo
  profiles?: UserProfile[]; // Múltiplos perfis
  active: boolean;
};

export type ViewState = 
  | 'Login'
  | 'Dashboard' 
  | 'CreateProfile'
  | 'ManageRoles'
  | 'ChangeProfile'
  | 'ChangePassword'
  | 'UserList'
  | 'Exit'
  | 'Settings'
  | 'Studies' 
  | 'PI'
  | 'Sponsors'
  | 'Team' 
  | 'MonitoriaData' 
  | 'Participants' 
  | 'Admin' 
  | 'Audit' 
  | 'ProtocolDeviation' 
  | 'SAEDeviation' 
  | 'GCPDeviation' 
  | 'KitStock' 
  | 'VisitControl'
  | 'Nursing' 
  | 'InfusionControl' 
  | 'Reception' // Nova View
  | 'Education' 
  | 'Pharmacy' 
  | 'Finance' 
  | 'FinanceTransactions'
  | 'FinanceAssets'
  | 'FinanceReport'
  | 'VacationControl'
  | 'Regulatory' 
  | 'CEPMeeting'
  | 'CEPCalendar'
  | 'RegulatoryPartialReport'
  | 'RegulatoryIndices'
  | 'RegulatoryLinks'
  | 'BirthdayFilter'
  | 'Calendar' 
  | 'Notepad'
  | 'NoticeBoard'
  | 'CreateNotice'
  | 'ExamRequest'
  | 'Calibrations'
  | 'Associates';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  targetProfiles?: UserProfile[]; // Perfis que devem ver esta notificação
  linkTo?: ViewState; // Janela para onde a notificação redireciona
};

export type Notice = {
  id: string;
  title: string;
  sector: string; // "De: Setor X"
  message: string;
  date: string;
  color: string; // Cor do post-it
};

export type PlatformAccess = {
  id: string;
  name: string;
  login: string;
  password?: string;
  link: string;
};

export type NoteItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type PIEntry = {
  id: string;
  name: string;
  email: string; // Novo campo adicionado
  sex: 'M' | 'F'; 
  role: string;
  phone: string;
  cellphone: string;
  birthDate: string;
  cpf: string;
  crm: string;
  rqe?: string;
  license?: string;
  cvDate?: string;
  gcpDate?: string;
  platforms: PlatformAccess[];
  systemAccess?: boolean;
  profiles?: UserProfile[];
  systemLogin?: string;
  systemPassword?: string;
  studyRoles?: { studyId: string; role: string }[];
};

export type Sponsor = {
  id: string;
  name: string;
  alternativeName?: string;
  currency?: string;
  cro?: string;
  cnpj?: string;
  address?: string;
  active?: boolean;
};

export type TeamMember = {
  id: string;
  active?: boolean; // Novo campo
  honorific: string;
  name: string;
  role: string;
  email: string;
  profile: UserProfile;
  profiles?: UserProfile[]; // Múltiplos perfis
  systemAccess?: boolean; // Se tem acesso ao sistema
  systemLogin?: string;
  systemPassword?: string;
  phone: string;
  cellphone: string;
  birthDate: string;
  cpf: string;
  license: string;
  rqe?: string; // Novo campo movido de PI ou adicionado
  
  // RH / Financeiro
  matricula?: string;
  admissionDate?: string;
  terminationDate?: string;
  contractType?: 'CLT' | 'PJ';
  cnpj?: string;

  cvDate?: string;
  gcpDate?: string;
  platforms: PlatformAccess[];
  studyRoles?: { studyId: string; role: string }[];
  studyIds?: string[];
};

export type Patient = {
  id: string;
  participantNumber: string;
  screeningNumber?: string; // Novo campo
  name: string;
  email?: string; // Novo campo
  birthDate: string;
  sex?: 'M' | 'F'; // Novo campo Sexo
  studyId: string;
  treatment?: string;
  randomization?: string;
  status: string;
  observations?: string;
  initials?: string;
  contact?: string;
  secondaryContact?: string;
  tcleDate?: string;
};

export type Consultation = {
  id: string;
  patientId: string;
  studyId: string;
  date: string;
  time: string;
  visitName: string; // Ex: Screening, C1D1, Retorno
  doctorName?: string; // Novo campo para o médico
  
  // Sinais Vitais
  height: string; // cm
  weight: string; // kg
  systolicPressure: string; // mmHg
  diastolicPressure: string; // mmHg
  temperature?: string; // C
  heartRate?: string; // bpm
  
  observations?: string;
};

export type StudyStatus = 'Active' | 'Pending' | 'Closed';

export type MonitorLogin = {
  id: string;
  description: string;
  login: string;
  password?: string;
};

export type MonitorEntry = {
  id: string;
  name: string;
  role: string;
  contact: string;
  email: string;
  cro: string;
  studyId?: string;
  studyIds?: string[];
  logins: MonitorLogin[];
};

export type PartialReportEntry = {
  id: string;
  sequence: number;
  expectedDate: string;
  submissionDate: string;
};

export type StudyDelegation = {
  memberId: string;
  memberName: string;
  role: string;
};

export type Study = {
  id: string;
  name: string;
  alternativeName?: string;
  coordinatorCenter?: 'SIM' | 'NÃO';
  protocol: string;
  sponsor: string;
  pi: string;
  cro: string;
  coordinator: string;
  pathology: string;
  recruitment: string;
  centerNumber: string;
  caae: string;
  ciomsDistribution: string;
  credentials: string;
  monitors: MonitorEntry[];
  participantsIds: string[]; 
  delegation?: StudyDelegation[]; // Novo campo para delegação
  medicationRoute: string;
  studyType: string;
  studyParticipantsCount: string; 
  status: StudyStatus;
  
  // Seção Regulatório
  regulatoryCAAE?: string;
  regulatoryCenterNumber?: string;
  regulatoryObs?: string;
  regulatorySusarPlatform?: string;

  // Seção Índices
  feasibilityReceptionDate?: string;
  feasibilitySigningDate?: string;
  centerSelectionNoticeDate?: string;
  contractReceptionDate?: string;
  contractSigningDate?: string;
  initialDossierReceptionDate?: string;
  initialDossierSubmissionDate?: string;
  cepAcceptanceDate?: string;
  initialOpinionApprovalDate?: string;
  centerActivationDate?: string;
  firstParticipantDate?: string;
  firstRandomizedDate?: string;
  finalOpinionDate?: string;

  // Relatórios Parciais
  partialReports?: PartialReportEntry[];
};

export type ProtocolDeviation = {
  id: string;
  studyId: string;
  piName: string;
  centerNumber: string;
  patientId: string;
  patientNumber: string;
  occurrenceDate: string;
  deviationDate: string;
  description: string;
  status: 'Pendente' | 'Gerado';
};

export type CEPMeeting = {
  id: string;
  date: string; 
  category: string;
  studyId: string;
  caae: string;
  amendment: string;
  training: string;
  submissionDate: string;
  acceptanceDate: string;
  indexMeetingDate: string; 
  approvalDate: string;
  businessDays: string; 
  pbLine?: string;
  cepApproval?: string;
  lastVerificationDate?: string;
  selectedDocuments?: string[]; // Lista de documentos vinculados à emenda
};

export type CEPCalendarEntry = {
  id: string;
  month: string; // Ex: "Janeiro 2024" ou apenas label
  meetingDate: string; // YYYY-MM-DD
  submissionDeadline: string; // YYYY-MM-DD
  notes?: string;
};

export type KitHistoryEntry = {
  date: string; 
  action: 'Entrada' | 'Saída' | 'Criação' | 'Ajuste';
  amount: number; 
  balance: number; 
};

export type KitStockEntry = {
  id: string;
  studyId: string;
  kitName: string;
  expirationDate: string;
  quantity: number;
  history: KitHistoryEntry[];
};

export type AmendmentStatus = 'Submitted' | 'Under Review' | 'Approved' | 'Pendent';

export type Amendment = {
  id: string;
  studyId: string;
  description: string;
  submissionDate: string;
  approvalDate?: string;
  status: AmendmentStatus;
};

export type EventType = 
  | 'Consultation' 
  | 'Monitor Visit' 
  | 'Internal Event' 
  | 'External Event'
  | 'Birthday'
  | 'Vacation'
  | 'MedicationDelivery';

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: EventType;
  description: string;
  patientId?: string;
  studyId?: string;
  consultationId?: string; // Vínculo com os dados clínicos da consulta
};

export type RegulatoryLinkEntry = {
  id: string;
  name: string;
  notes?: string;
  url: string;
};

// --- Tipos para Controle de Visitas ---
export type VisitRow = {
  id: string;
  visitName: string; // Ex: C1D1, C1D15
  scheduledDate: string; // Data Programada
  actualDate: string; // Data Real
  notes?: string; // Imagens/Obs
};

export type PatientVisitSchedule = {
  id: string;
  studyId: string; // Novo campo para vincular ao estudo
  patientName: string;
  birthDate: string;
  medicalRecord: string; // Prontuário
  visits: VisitRow[];
  tcleDate?: string;
  randomizationDate?: string;
};

// --- Tipos para Infusão ---
export type InfusionStationType = 'Poltrona' | 'Maca';

export type InfusionAppointment = {
  id: string;
  stationId: string; // 1 a 6
  patientId: string;
  studyId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes: number;
  
  // Detalhes da Medicação
  medicationName: string;
  medicationDose: string;
  cycleInfo: string; // Ex: Ciclo 1 Dia 1
  
  status: 'Agendado' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  notes?: string;
};

export type Calibration = {
  id: string;
  assetCode: string; // Cód. Patrimônio
  reference: string; // Referência
  calibrationDate: string; // Data da calibração (YYYY-MM-DD)
  expirationPeriod: number; // Vencimento a cada (número)
  expirationUnit: 'Days' | 'Months' | 'Years'; // Vencimento a cada (unidade)
  nextCalibrationDate: string; // Data da próxima calibração (calculada)
  responsible: string; // Responsável
  history?: CalibrationHistoryEntry[];
};

export type CalibrationHistoryEntry = {
  date: string;
  responsible: string;
  notes?: string;
};

export type PaymentEntry = {
  id: string;
  method: string;
  value: string;
  date: string;
};

export type Associate = {
  id: string;
  status: string; // 'Ativo' | 'Inativo' | 'Recadastro'
  memberSince?: string;
  exitRequestDate?: string;
  name: string;
  observations?: string;
  birthDate?: string;
  cpf: string;
  associateType?: string;
  email?: string;
  naturalness?: string;
  nationality?: string;
  address?: string;
  addressComplement?: string;
  city?: string;
  neighborhood?: string;
  state?: string;
  bond?: string;
  cep?: string;
  phone1?: string;
  phone2?: string;
  role?: string;
  dueDay?: number;
  reRegistrationsJson?: string;
  paymentsJson?: string;
};

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  value: number;
};

export type TransactionCategory = {
  id: string;
  name: string;
};

export type PaymentRecord = {
  id: string;
  date: string;
  amount: number;
  method?: string;
  notes?: string;
};

export type InventoryItem = {
  id: string;
  description: string;
  quantity: number;
  value: number;
  invoiceNumber?: string;
  transactionId: string;
  category: string;
  status: 'ACTIVE' | 'CANCELLED';
  obs?: string;
};

export type FinancialTransaction = {
  id: string;
  type: TransactionType;
  date: string;
  dueDate?: string;
  amount: number;
  description: string;
  category: string;
  status: TransactionStatus;
  invoiceNumber?: string;
  entity?: string;
  notes?: string;
  items?: InvoiceItem[];
  payments?: PaymentRecord[];
  isCancelled?: boolean;
};

export type CompanyAsset = {
  id: string;
  code: string;
  name: string;
  purchaseDate: string;
  purchaseValue: number;
  currentValue: number;
  location: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'DISPOSED';
};

export type VacationRecord = {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'TAKEN' | 'CANCELLED';
  notes?: string;
};

// MDI Window Type Definition
export type WindowInstance = {
  id: string; // Unique ID for the window instance
  type: ViewState; // Which component to render
  title: string;
  zIndex: number;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  isMinimized?: boolean;
  props?: any; // Data passed to the window (e.g., study to edit)
};
