
import React, { useState } from 'react';
import { Study, TeamMember, UserProfile, Amendment, CalendarEvent, Patient, MonitorEntry, PIEntry, AppNotification, Notice, Sponsor, CEPMeeting, ProtocolDeviation, KitStockEntry, PatientVisitSchedule, CEPCalendarEntry } from './types';

export const COLORS = {
  primary: '#007b63',
  secondary: '#d1e7e4',
  accent: '#e55a5a',
};

export const POST_IT_COLORS = [
  'bg-yellow-100 border-yellow-200 text-yellow-900',
  'bg-blue-100 border-blue-200 text-blue-900',
  'bg-green-100 border-green-200 text-green-900',
  'bg-pink-100 border-pink-200 text-pink-900',
  'bg-purple-100 border-purple-200 text-purple-900',
  'bg-orange-100 border-orange-200 text-orange-900',
];

export const CEP_DOCUMENT_OPTIONS = [
  'Brochura do Investigador',
  'Material Participante',
  'Protocolo Clinico',
  "TCLE's"
].sort();

export const DELEGATION_ROLES = [
  'Sub-Investigador',
  'Coordenador de estudos',
  'Enfermeira',
  'Tec. de enfermagem',
  'Assistente de Pesquisa',
  'Farmacêutico',
  'Oftalmologista',
  'Cardiologista',
  'Dentista',
  'Pneumologista'
].sort();

export const EXAM_LIST = {
  'HEMATOLOGIA + COAGULAÇÃO': [
    'Hemograma Completo',
    'Contagem de Plaquetas',
    'Cont. Reticulócitos',
    'Coombs Direto',
    'Eletroforese de Hemoglobina',
    'Fibrinogênio',
    'Grupo Sanguíneo e Fator RH',
    'Hematócrito',
    'Hemoglobina',
    'Homossedimentação (VHS)',
    'Leucograma',
    'Painel de Hemácias',
    'Retração do Coágulo',
    'Tempo de Protrombina (TAP)',
    'Tempo de Sangria',
    'Tempo de Trombina',
    'Teste de Ham'
  ],
  'BIOQUÍMICA + ELETRÓLITOS': [
    'Ácido Fólico',
    'Ácido Úrico',
    'Alfa 1 Glicoprot Ácida',
    'Amilase',
    'Bilirrubinas T e F',
    'Cálcio',
    'Capacidade de Fixação do Ferro',
    'CK - MB',
    'CK - Total',
    'Cloretos',
    'Colesterol Total',
    'Creatinina',
    'Desidrogenase Lática (LDH)',
    'Eletroforese de Proteínas',
    'Ferritina',
    'Ferro Sérico',
    'Fosfatase Ácida Prostática',
    'Fosfatase Ácida Total',
    'Fosfatase Alcalina',
    'Gama - GT',
    'Glicose',
    'HDL Colesterol',
    'LDL Colesterol',
    'Lipase',
    'Magnésio',
    'Potássio',
    'Proteína C Reativa',
    'Sódio',
    'Transaminase (GOT/AST)',
    'Transaminase (GPT/ALT)',
    'Transferrina',
    'Triglicerídeos',
    'Ureia'
  ],
  'IMUNOLOGIA': [
    'Antígeno Austrália (HBs Ag)',
    'Anti HCV',
    'Anti HIV 1 e 2',
    'Anti HTLV',
    'ASLO',
    'BHCG (Beta HCG)',
    'CEA',
    'Chagas',
    'FAN',
    'Fator Reumatóide',
    'Monotest',
    'Paul Bunnel',
    'PPD',
    'PSA Total',
    'Rubéola IgG/IgM',
    'T3',
    'T4',
    'Toxoplasmose IgG/IgM',
    'TSH',
    'VDRL',
    'Vitamina D',
    'Vitamina B12'
  ],
  'URINÁLISE + PARASITOLOGIA': [
    'Parcial de Urina (EAS)',
    'Urocultura',
    'Proteinúria de 24 horas',
    'Parasitológico de Fezes',
    'Pesquisa de Sangue Oculto',
    'P. de Leucócitos'
  ],
  'MICROSCOPIA + LÍQUIDOS': [
    'Bacterioscopia (Gram)',
    'P. de BAAR',
    'Pesquisa de Fungos',
    'Citologia Total + Espec.',
    'Eletroforese de Líquor',
    'Pesquisa de Células Neoplásicas',
    'Rotina de Líquor'
  ],
  'CULTURA': [
    'Coprocultura',
    'Cultura de Secreção',
    'Hemocultura (2 amostras)',
    'P/ Anaeróbios',
    'P/ Fungos',
    'P/ Germes Comuns',
    'TSA'
  ]
};

export const DROPDOWN_OPTIONS = {
  sponsors: ['AstraZeneca', 'Bayer', 'J&J', 'Lilly', 'MSD', 'Novartis', 'Pfizer', 'Roche'].sort(),
  pis: ['Dr. Carlos Eduardo', 'Dr. Ricardo Silva', 'Dra. Fernanda Braga', 'Dra. Maria Helena'].sort(),
  cros: ['Covance', 'GlobalCRO', 'Icon', 'IQVIA', 'Medpace', 'Parexel', 'PPD', 'Syneos'].sort(),
  coordinators: ['Ana Costa', 'Bruno Vivan', 'Camila Sommer', 'Carlos Oliveira', 'Marcos Pereira'].sort(),
  recruitmentStatus: ['Aberto', 'Em Pausa', 'Fechado'], 
  monitorRoles: ['Clinical Trial Assistant', 'CRA', 'Lead CRA', 'RSM', 'SMA'].sort(),
  medicationRoutes: ['Endovenosa (IV)', 'Inalatória', 'Intramuscular (IM)', 'Oral', 'Subcutânea (SC)', 'Tópica'].sort(),
  studyTypes: ['Intervencional', 'Observacional'],
  participantsCount: ['0-50', '51-100', '101-250', '251-500', '501-1000', '1000+'],
  piRoles: [
    'Administrativo',
    'Assist. Admin.',
    'Assist. Pesquisa',
    'Cardiologista',
    'Cirurgião Torácico',
    'Coordenador(a) de Estudos',
    'Diretor(a)',
    'Enf. Auditor(a)',
    'Enfermeira',
    'Farmacêutico(a)',
    'Fisioterapeuta',
    'Hematologista',
    'Oftalmologista',
    'Oncologista',
    'Pneumologista',
    'Téc. Enfermagem',
    'Urologista'
  ],
  teamHonorifics: ['Sr.', 'Sra.'],
  teamRoles: ['Administrativo', 'Assistente de Pesquisa', 'Cardiologista', 'Coordenador de estudos', 'Enfermeira', 'Farmacêutico', 'Oftalmologista'].sort(),
  participantStatus: [
    'Ativo', 
    'Concluiu', 
    'Descontinuado', 
    'Falha Screening', 
    'FUP', 
    'Obto', 
    'Pós-Estudo', 
    'Pré-Screening', 
    'Retirou Consent.', 
    'Screening'
  ],
  cepCategories: ['Emenda', 'Relatório'],
  cepTraining: ['N/A', 'SIV', 'OK', 'Aguardando', 'Coletando Assinatura', 'Enviar p/monitor'],
  cepApproval: [
    'Aguardando Aprovação',
    'APROVADO',
    'Em Edição',
    'Não Aprovado',
    'Pendencia'
  ]
};

// --- MOCK DATA ---

// 3 Patrocinadores
export const MOCK_SPONSORS: Sponsor[] = [
  { id: 'sp1', name: 'Novartis', alternativeName: 'Novartis Biociências', currency: 'BRL', cro: 'IQVIA', cnpj: '00.123.456/0001-00', address: 'Av. Chucri Zaidan, 100 - SP' },
  { id: 'sp2', name: 'MSD', alternativeName: 'Merck Sharp & Dohme', currency: 'USD', cro: 'PPD', cnpj: '00.987.654/0001-99', address: 'Rua da Paz, 500 - SP' },
  { id: 'sp3', name: 'Bayer', alternativeName: 'Bayer S.A.', currency: 'EUR', cro: 'Icon', cnpj: '11.222.333/0001-11', address: 'Socorro, SP' }
];

// 3 Membros de Equipe (1 Oncologista, 2 Coordenadores conforme solicitado)
export const MOCK_TEAM: TeamMember[] = [
  { 
    id: 't1', active: true, honorific: 'Dr.', name: 'Fernando Mendes', role: 'Oncologista', email: 'fernando.mendes@elora.com', 
    profile: UserProfile.ADMIN, phone: '(11) 3000-1000', cellphone: '(11) 99999-1000', birthDate: '1975-03-15', 
    cpf: '111.222.333-00', license: 'CRM-SP 90909', cvDate: '2023-01-10', gcpDate: '2023-02-15', platforms: [],
    contractType: 'PJ', matricula: '1001', admissionDate: '2022-01-01'
  },
  { 
    id: 't2', active: true, honorific: 'Sra.', name: 'Camila Sommer', role: 'Coordenador de estudos', email: 'camila.sommer@elora.com', 
    profile: UserProfile.COORDINATOR, phone: '(11) 3000-2000', cellphone: '(11) 98888-2000', birthDate: '1988-07-22', 
    cpf: '222.333.444-11', license: 'N/A', cvDate: '2023-03-20', gcpDate: '2023-04-01', platforms: [],
    contractType: 'CLT', matricula: '2050', admissionDate: '2022-06-15'
  },
  { 
    id: 't3', active: true, honorific: 'Sr.', name: 'Bruno Vivan', role: 'Coordenador de estudos', email: 'bruno.vivan@elora.com', 
    profile: UserProfile.COORDINATOR, phone: '(11) 3000-3000', cellphone: '(11) 97777-3000', birthDate: '1990-11-05', 
    cpf: '333.444.555-22', license: 'N/A', cvDate: '2023-05-10', gcpDate: '2023-05-15', platforms: [],
    contractType: 'CLT', matricula: '2060', admissionDate: '2022-08-01'
  }
];

// PIs para Dropdown (sincronizado com o Oncologista do time e mais 2)
export const MOCK_PIS: PIEntry[] = [
  { id: 'pi1', name: 'Fernando Mendes', email: 'fernando.mendes@elora.com', sex: 'M', role: 'Oncologista', phone: '(11) 3000-1000', cellphone: '(11) 99999-1000', birthDate: '1975-03-15', cpf: '111.222.333-00', crm: '90909', rqe: '1234', license: 'CRM-SP 90909', cvDate: '2023-01-10', gcpDate: '2023-02-15', platforms: [] },
  { id: 'pi2', name: 'Mariana Rocha', email: 'mariana.rocha@elora.com', sex: 'F', role: 'Oncologista', phone: '(11) 3000-4000', cellphone: '(11) 96666-4000', birthDate: '1980-08-12', cpf: '444.555.666-33', crm: '80808', rqe: '5678', license: 'CRM-SP 80808', cvDate: '2023-06-01', gcpDate: '2023-06-10', platforms: [] },
  { id: 'pi3', name: 'Roberto Alencar', email: 'roberto.alencar@elora.com', sex: 'M', role: 'Hematologista', phone: '(11) 3000-5000', cellphone: '(11) 95555-5000', birthDate: '1972-12-25', cpf: '555.666.777-44', crm: '70707', rqe: '9012', license: 'CRM-SP 70707', cvDate: '2023-07-20', gcpDate: '2023-08-01', platforms: [] }
];

// 3 Estudos (ACRUE, AMPLITUDE, EMERALD-2)
export const MOCK_STUDIES: Study[] = [
  {
    id: 's1', name: 'ACRUE', protocol: 'NOV-123', sponsor: 'Novartis', pi: 'Dr. Fernando Mendes', cro: 'IQVIA',
    coordinator: 'Camila Sommer', pathology: 'Câncer de Pulmão', recruitment: 'Aberto', centerNumber: '001', caae: '12345678.1.0000.1111',
    ciomsDistribution: 'Email', credentials: 'Portal Novartis', status: 'Active', medicationRoute: 'Oral', studyType: 'Intervencional',
    studyParticipantsCount: '51-100', participantsIds: ['p1'], monitors: [], delegation: []
  },
  {
    id: 's2', name: 'AMPLITUDE', protocol: 'MSD-456', sponsor: 'MSD', pi: 'Dra. Mariana Rocha', cro: 'PPD',
    coordinator: 'Camila Sommer', pathology: 'Melanoma', recruitment: 'Em Pausa', centerNumber: '002', caae: '87654321.2.0000.2222',
    ciomsDistribution: 'Portal', credentials: 'Portal MSD', status: 'Active', medicationRoute: 'Endovenosa (IV)', studyType: 'Intervencional',
    studyParticipantsCount: '0-50', participantsIds: ['p2'], monitors: [], delegation: []
  },
  {
    id: 's3', name: 'EMERALD-2', protocol: 'BAY-789', sponsor: 'Bayer', pi: 'Dr. Roberto Alencar', cro: 'Icon',
    coordinator: 'Bruno Vivan', pathology: 'Insuficiência Cardíaca', recruitment: 'Fechado', centerNumber: '003', caae: '11223344.3.0000.3333',
    ciomsDistribution: 'Email', credentials: 'Portal Bayer', status: 'Closed', medicationRoute: 'Oral', studyType: 'Observacional',
    studyParticipantsCount: '1000+', participantsIds: ['p3'], monitors: [], delegation: []
  }
];

// 3 Monitores (Viculados aos estudos)
export const MOCK_AVAILABLE_MONITORS: MonitorEntry[] = [
  { id: 'm1', name: 'Pedro Alves', role: 'CRA', contact: '(11) 91111-1111', email: 'pedro@iqvia.com', cro: 'IQVIA', studyId: 's1', logins: [] },
  { id: 'm2', name: 'Sofia Martins', role: 'Lead CRA', contact: '(21) 92222-2222', email: 'sofia@ppd.com', cro: 'PPD', studyId: 's2', logins: [] },
  { id: 'm3', name: 'Marcos Vinicius', role: 'SMA', contact: '(31) 93333-3333', email: 'marcos@icon.com', cro: 'Icon', studyId: 's3', logins: [] }
];

// 3 Participantes
export const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', participantNumber: '001-001', screeningNumber: 'SCR-01', name: 'João Silva', birthDate: '1960-05-10', studyId: 's1', status: 'Ativo', treatment: 'Droga A', randomization: 'RND-100', email: 'joao@email.com', contact: '(11) 90000-0001' },
  { id: 'p2', participantNumber: '002-005', screeningNumber: 'SCR-05', name: 'Maria Souza', birthDate: '1975-11-20', studyId: 's2', status: 'Screening', treatment: 'Placebo', randomization: '', email: 'maria@email.com', contact: '(11) 90000-0002' },
  { id: 'p3', participantNumber: '003-010', screeningNumber: 'SCR-10', name: 'Carlos Pereira', birthDate: '1955-02-28', studyId: 's3', status: 'Concluiu', treatment: 'Padrão', randomization: 'RND-500', email: 'carlos@email.com', contact: '(11) 90000-0003' }
];

// 3 Emendas/Reuniões CEP
export const MOCK_CEP_MEETINGS: CEPMeeting[] = [
  { 
    id: 'cep1', date: '2023-10-15', category: 'Emenda', studyId: 's1', caae: '12345678.1.0000.1111', amendment: 'Emenda 01 - Protocolo V2', 
    training: 'SIV', submissionDate: '2023-09-01', acceptanceDate: '2023-09-10', indexMeetingDate: '2023-10-15', approvalDate: '2023-10-20', 
    businessDays: '30', cepApproval: 'APROVADO', lastVerificationDate: '2023-10-25', selectedDocuments: ['Protocolo Clinico', "TCLE's"]
  },
  { 
    id: 'cep2', date: '2023-11-20', category: 'Emenda', studyId: 's2', caae: '87654321.2.0000.2222', amendment: 'Emenda 02 - IB V5', 
    training: 'Aguardando', submissionDate: '2023-11-01', acceptanceDate: '2023-11-05', indexMeetingDate: '2023-11-20', approvalDate: '', 
    businessDays: '15', cepApproval: 'Aguardando Aprovação', lastVerificationDate: '2023-11-22', selectedDocuments: ['Brochura do Investigador']
  },
  { 
    id: 'cep3', date: '2023-08-10', category: 'Relatório', studyId: 's3', caae: '11223344.3.0000.3333', amendment: 'Relatório Semestral', 
    training: 'N/A', submissionDate: '2023-07-15', acceptanceDate: '2023-07-20', indexMeetingDate: '2023-08-10', approvalDate: '2023-08-15', 
    businessDays: '20', cepApproval: 'APROVADO', lastVerificationDate: '2023-08-16', selectedDocuments: []
  }
];

export const MOCK_CEP_CALENDAR: CEPCalendarEntry[] = [
  { id: 'cal1', month: 'Janeiro 2024', meetingDate: '2024-01-25', submissionDeadline: '2024-01-10', notes: 'Reunião Padrão' },
  { id: 'cal2', month: 'Fevereiro 2024', meetingDate: '2024-02-22', submissionDeadline: '2024-02-08', notes: '' },
  { id: 'cal3', month: 'Março 2024', meetingDate: '2024-03-28', submissionDeadline: '2024-03-13', notes: '' },
];

// --- NOVOS MOCKS: Desvios e Kits ---

// 3 Desvios de Protocolo
export const MOCK_DEVIATIONS: ProtocolDeviation[] = [
  { id: 'd1', studyId: 's1', piName: 'Dr. Fernando Mendes', centerNumber: '001', patientId: 'p1', patientNumber: '001-001', occurrenceDate: '2023-10-01', deviationDate: '2023-10-02', description: 'Participante compareceu à visita 7 dias após a janela permitida.', status: 'Gerado' },
  { id: 'd2', studyId: 's2', piName: 'Dra. Mariana Rocha', centerNumber: '002', patientId: 'p2', patientNumber: '002-005', occurrenceDate: '2023-11-15', deviationDate: '2023-11-16', description: 'Dose da medicação administrada incorretamente (2 comprimidos em vez de 3).', status: 'Pendente' },
  { id: 'd3', studyId: 's3', piName: 'Dr. Roberto Alencar', centerNumber: '003', patientId: 'p3', patientNumber: '003-010', occurrenceDate: '2023-09-20', deviationDate: '2023-09-21', description: 'TCLE assinado após início do procedimento de triagem.', status: 'Gerado' }
];

// 3 Desvios de SAE (Evento Adverso Grave)
export const MOCK_SAE_DEVIATIONS: ProtocolDeviation[] = [
  { id: 'sae1', studyId: 's1', piName: 'Dr. Fernando Mendes', centerNumber: '001', patientId: 'p1', patientNumber: '001-001', occurrenceDate: '2023-10-05', deviationDate: '2023-10-06', description: 'Hospitalização devido a pneumonia severa.', status: 'Gerado' },
  { id: 'sae2', studyId: 's2', piName: 'Dra. Mariana Rocha', centerNumber: '002', patientId: 'p2', patientNumber: '002-005', occurrenceDate: '2023-11-18', deviationDate: '2023-11-19', description: 'Reação alérgica grau 3 após infusão.', status: 'Pendente' },
  { id: 'sae3', studyId: 's3', piName: 'Dr. Roberto Alencar', centerNumber: '003', patientId: 'p3', patientNumber: '003-010', occurrenceDate: '2023-09-25', deviationDate: '2023-09-26', description: 'Arritmia cardíaca requerendo intervenção médica.', status: 'Pendente' }
];

// 3 Desvios de GCP (Boas Práticas Clínicas)
export const MOCK_GCP_DEVIATIONS: ProtocolDeviation[] = [
  { id: 'gcp1', studyId: 's1', piName: 'Dr. Fernando Mendes', centerNumber: '001', patientId: 'p1', patientNumber: '001-001', occurrenceDate: '2023-10-10', deviationDate: '2023-10-11', description: 'Excursão de temperatura na geladeira de medicamentos (2h acima de 8ºC).', status: 'Gerado' },
  { id: 'gcp2', studyId: 's2', piName: 'Dra. Mariana Rocha', centerNumber: '002', patientId: 'p2', patientNumber: '002-005', occurrenceDate: '2023-11-20', deviationDate: '2023-11-21', description: 'Equipamento de ECG com calibração vencida utilizado na visita.', status: 'Gerado' },
  { id: 'gcp3', studyId: 's3', piName: 'Dr. Roberto Alencar', centerNumber: '003', patientId: 'p3', patientNumber: '003-010', occurrenceDate: '2023-09-30', deviationDate: '2023-10-01', description: 'Documento fonte não assinado e datado pelo investigador no momento da coleta.', status: 'Pendente' }
];

// 12 Kits (4 por estudo)
export const MOCK_KIT_STOCK: KitStockEntry[] = [
  // Kits Estudo S1 (ACRUE)
  { id: 'k1', studyId: 's1', kitName: 'Kit A-100 (Visita 1)', expirationDate: '2024-12-31', quantity: 10, history: [{date: '2023-01-01', action: 'Criação', amount: 10, balance: 10}] },
  { id: 'k2', studyId: 's1', kitName: 'Kit B-200 (Visita 2)', expirationDate: '2024-06-30', quantity: 5, history: [{date: '2023-01-01', action: 'Criação', amount: 5, balance: 5}] },
  { id: 'k3', studyId: 's1', kitName: 'Kit C-300 (Emergência)', expirationDate: '2023-12-15', quantity: 2, history: [{date: '2023-01-01', action: 'Criação', amount: 2, balance: 2}] }, // Próximo vencimento
  { id: 'k4', studyId: 's1', kitName: 'Kit D-400 (Coleta)', expirationDate: '2023-01-01', quantity: 0, history: [{date: '2022-01-01', action: 'Criação', amount: 10, balance: 10}, {date: '2022-12-01', action: 'Saída', amount: 10, balance: 0}] }, // Vencido/Zerado

  // Kits Estudo S2 (AMPLITUDE)
  { id: 'k5', studyId: 's2', kitName: 'Kit Infusão X', expirationDate: '2025-01-20', quantity: 15, history: [{date: '2023-02-01', action: 'Criação', amount: 15, balance: 15}] },
  { id: 'k6', studyId: 's2', kitName: 'Kit Placebo Y', expirationDate: '2024-11-20', quantity: 8, history: [{date: '2023-02-01', action: 'Criação', amount: 8, balance: 8}] },
  { id: 'k7', studyId: 's2', kitName: 'Kit Lab Central', expirationDate: '2024-01-10', quantity: 20, history: [{date: '2023-02-01', action: 'Criação', amount: 20, balance: 20}] },
  { id: 'k8', studyId: 's2', kitName: 'Kit Farmacocinética', expirationDate: '2023-11-30', quantity: 3, history: [{date: '2023-02-01', action: 'Criação', amount: 3, balance: 3}] }, // Vencendo

  // Kits Estudo S3 (EMERALD-2)
  { id: 'k9', studyId: 's3', kitName: 'Caixa Medicação 10mg', expirationDate: '2024-08-15', quantity: 50, history: [{date: '2023-03-01', action: 'Criação', amount: 50, balance: 50}] },
  { id: 'k10', studyId: 's3', kitName: 'Caixa Medicação 20mg', expirationDate: '2024-08-15', quantity: 40, history: [{date: '2023-03-01', action: 'Criação', amount: 40, balance: 40}] },
  { id: 'k11', studyId: 's3', kitName: 'Kit Sangue Total', expirationDate: '2023-10-01', quantity: 0, history: [{date: '2023-03-01', action: 'Criação', amount: 5, balance: 5}, {date: '2023-09-01', action: 'Saída', amount: 5, balance: 0}] }, // Zerado
  { id: 'k12', studyId: 's3', kitName: 'Kit Urina', expirationDate: '2025-05-05', quantity: 100, history: [{date: '2023-03-01', action: 'Criação', amount: 100, balance: 100}] }
];

export const LOGO_SVG = (
  <div className="flex flex-col items-center">
    <svg viewBox="0 0 800 500" className="w-[450px] h-auto" fill="#007b63">
      <text x="50%" y="100" textAnchor="middle" fontSize="50" fontWeight="400" letterSpacing="25">GRUPO</text>
      <text x="50%" y="280" textAnchor="middle" fontSize="230" fontWeight="900" style={{ fontStyle: 'normal', fontFamily: 'sans-serif' }}>elora</text>
      <text x="50%" y="360" textAnchor="middle" fontSize="32" fontWeight="400" letterSpacing="4">pesquisa, ensino</text>
      <text x="50%" y="405" textAnchor="middle" fontSize="32" fontWeight="400" letterSpacing="4">e acolhimento</text>
      <text x="50%" y="465" textAnchor="middle" fontSize="42" fontWeight="400" letterSpacing="6">contra o câncer</text>
    </svg>
  </div>
);

export const MOCK_AMENDMENTS: Amendment[] = [
  { id: 'a1', studyId: 's1', description: 'Inclusão de novo critério de exclusão', submissionDate: '2023-11-01', status: 'Under Review' }
];

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Visita de Monitoria - SIV', date: '2023-12-15', type: 'Monitor Visit', description: 'Abertura do centro' }
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Pendência Regulatória', message: 'Prazo do Relatório Parcial do estudo CA123-456 vence em 5 dias.', date: '10/12/2023', read: false, linkTo: 'RegulatoryPartialReport' },
  { id: 'n2', title: 'Visita de Monitoria', message: 'Confirmação de visita agendada para 15/12/2023.', date: '08/12/2023', read: false, linkTo: 'Calendar' }
];

export const MOCK_NOTICES: Notice[] = [
  { id: 'a1', title: 'Arrumação da Sala de Arquivo', sector: 'Administrativo', message: 'Favor manter a sala organizada após o uso. Documentos deixados sobre a mesa serão recolhidos.', date: '12/12/2023', color: 'bg-yellow-100 border-yellow-200 text-yellow-900' },
  { id: 'a2', title: 'Reunião Geral', sector: 'Coordenação', message: 'Reunião mensal agendada para sexta-feira às 14h. Presença obrigatória.', date: '13/12/2023', color: 'bg-blue-100 border-blue-200 text-blue-900' }
];

// --- MOCK CONTROLE DE VISITAS (Dados da Imagem PDF) ---
export const MOCK_VISIT_SCHEDULES: PatientVisitSchedule[] = [
  {
    id: 'vs1',
    studyId: 's1', // ACRUE
    patientName: 'EDUARDO FERREIRA',
    birthDate: '12/08/1964',
    medicalRecord: '66273',
    tcleDate: '2021-06-08', // 08/06/2021
    randomizationDate: '2021-06-21', // 21/06/2021
    visits: [
      { id: 'v1', visitName: 'C1D1', scheduledDate: '2021-06-21', actualDate: '2021-06-21' },
      { id: 'v2', visitName: 'C1D15', scheduledDate: '2021-07-05', actualDate: '2021-07-02', notes: 'Imagens' },
      { id: 'v3', visitName: 'C2D1', scheduledDate: '2021-07-16', actualDate: '2021-07-12' }, // Aprox
      { id: 'v4', visitName: 'C2D15', scheduledDate: '2021-07-30', actualDate: '2021-08-12' },
      { id: 'v5', visitName: 'C3D1', scheduledDate: '2021-08-13', actualDate: '2021-08-12' },
      { id: 'v6', visitName: 'C3D15', scheduledDate: '2021-08-27', actualDate: '2021-08-27' },
      { id: 'v7', visitName: 'C4D1', scheduledDate: '2021-09-10', actualDate: '2021-09-10' },
      { id: 'v8', visitName: 'C5D1', scheduledDate: '2021-10-08', actualDate: '2021-10-08' },
      { id: 'v9', visitName: 'C6D1', scheduledDate: '2021-11-05', actualDate: '2021-11-05' },
      { id: 'v10', visitName: 'C7D1', scheduledDate: '2021-12-03', actualDate: '2021-12-03' },
      { id: 'v11', visitName: 'C8D1', scheduledDate: '2021-12-31', actualDate: '2021-12-28' }, // 12/12/2021 na imagem parece 28/12/2021
      { id: 'v12', visitName: 'C9D1', scheduledDate: '2022-01-28', actualDate: '2022-01-28' },
      { id: 'v13', visitName: 'C10D1', scheduledDate: '2022-02-25', actualDate: '' },
      { id: 'v14', visitName: 'C11D1', scheduledDate: '2022-03-25', actualDate: '' },
      { id: 'v15', visitName: 'C12D1', scheduledDate: '2022-04-22', actualDate: '' },
      { id: 'v16', visitName: 'C13D1', scheduledDate: '2022-05-20', actualDate: '' },
      { id: 'v17', visitName: 'C14D1', scheduledDate: '2022-06-17', actualDate: '2022-06-14' },
      { id: 'v18', visitName: 'C15D1', scheduledDate: '2022-07-15', actualDate: '' },
      { id: 'v19', visitName: 'C16D1', scheduledDate: '2022-08-12', actualDate: '' },
      { id: 'v20', visitName: 'C17D1', scheduledDate: '2022-09-09', actualDate: '2022-09-08' },
      { id: 'v21', visitName: 'C18D1', scheduledDate: '2022-10-07', actualDate: '2022-10-06' },
      { id: 'v22', visitName: 'C19D1', scheduledDate: '2022-11-04', actualDate: '2022-11-03' },
      { id: 'v23', visitName: 'C20D1', scheduledDate: '2022-12-02', actualDate: '' },
      { id: 'v24', visitName: 'C21D1', scheduledDate: '2022-12-30', actualDate: '2022-12-28' },
      { id: 'v25', visitName: 'C22D1', scheduledDate: '2023-01-27', actualDate: '' },
      { id: 'v26', visitName: 'C23D1', scheduledDate: '2023-02-24', actualDate: '' },
      { id: 'v27', visitName: 'C24D1', scheduledDate: '2023-03-24', actualDate: '2023-03-22' },
      { id: 'v28', visitName: 'C25D1', scheduledDate: '2023-04-21', actualDate: '2023-04-20' },
      { id: 'v29', visitName: 'C29D1', scheduledDate: '2023-08-11', actualDate: '2023-08-08' },
      { id: 'v30', visitName: 'C33D1', scheduledDate: '2023-11-28', actualDate: '' },
      { id: 'v31', visitName: 'C37D1', scheduledDate: '2024-03-19', actualDate: '2024-03-20' },
      { id: 'v32', visitName: 'C41D1', scheduledDate: '2024-07-10', actualDate: '' },
      { id: 'v33', visitName: 'C45D1', scheduledDate: '2024-10-30', actualDate: '' },
      { id: 'v34', visitName: 'C49D1', scheduledDate: '2025-02-19', actualDate: '' },
      { id: 'v35', visitName: 'C53D1', scheduledDate: '2025-06-11', actualDate: '' },
      { id: 'v36', visitName: 'C57D1', scheduledDate: '2025-10-01', actualDate: '2025-09-22' },
      { id: 'v37', visitName: 'C61D1', scheduledDate: '2026-01-21', actualDate: '' },
      { id: 'v38', visitName: 'C65D1', scheduledDate: '2026-05-13', actualDate: '' },
    ]
  },
  {
    id: 'vs2',
    studyId: 's2', // AMPLITUDE
    patientName: 'DALIR ALBERTO RUARO',
    birthDate: '29/03/1977',
    medicalRecord: '67533',
    tcleDate: '2021-09-10', // 10/09/2021
    randomizationDate: '2021-09-24', // 24/09/2021
    visits: [
      { id: 'v1', visitName: 'C1D1', scheduledDate: '2021-09-24', actualDate: '2021-09-24', notes: 'Imagens' },
      { id: 'v2', visitName: 'C1D15', scheduledDate: '2021-10-08', actualDate: '' },
      { id: 'v3', visitName: 'C2D1', scheduledDate: '2021-10-22', actualDate: '' },
      { id: 'v4', visitName: 'C2D15', scheduledDate: '2021-11-05', actualDate: '' },
      { id: 'v5', visitName: 'C3D15', scheduledDate: '2021-12-03', actualDate: '2021-12-06' },
      { id: 'v6', visitName: 'C4D1', scheduledDate: '2021-12-17', actualDate: '' },
      { id: 'v7', visitName: 'C5D1', scheduledDate: '2022-01-14', actualDate: '2022-01-13' },
      { id: 'v8', visitName: 'C6D1', scheduledDate: '2022-02-11', actualDate: '' },
      { id: 'v9', visitName: 'C7D1', scheduledDate: '2022-03-11', actualDate: '' },
      { id: 'v10', visitName: 'C8D1', scheduledDate: '2022-04-08', actualDate: '' },
      { id: 'v11', visitName: 'C9D1', scheduledDate: '2022-05-06', actualDate: '' },
      { id: 'v12', visitName: 'C10D1', scheduledDate: '2022-06-03', actualDate: '' },
      { id: 'v13', visitName: 'C11D1', scheduledDate: '2022-07-01', actualDate: '' },
      { id: 'v14', visitName: 'C12D1', scheduledDate: '2022-07-29', actualDate: '2022-08-02' },
      { id: 'v15', visitName: 'C13D1', scheduledDate: '2022-08-26', actualDate: '2022-08-25' },
      { id: 'v16', visitName: 'C14D1', scheduledDate: '2022-09-23', actualDate: '' },
      { id: 'v17', visitName: 'C15D1', scheduledDate: '2022-10-21', actualDate: '' },
      { id: 'v18', visitName: 'C16D1', scheduledDate: '2022-11-18', actualDate: '2022-11-21' },
      { id: 'v19', visitName: 'C17D1', scheduledDate: '2022-12-16', actualDate: '2022-12-19' },
      { id: 'v20', visitName: 'C18D1', scheduledDate: '2023-01-13', actualDate: '' },
      { id: 'v21', visitName: 'C19D1', scheduledDate: '2023-02-10', actualDate: '' },
      { id: 'v22', visitName: 'C20D1', scheduledDate: '2023-03-10', actualDate: '2023-03-08' },
      { id: 'v23', visitName: 'C21D1', scheduledDate: '2023-04-07', actualDate: '2023-04-05' },
      { id: 'v24', visitName: 'C22D1', scheduledDate: '2023-05-05', actualDate: '' },
      { id: 'v25', visitName: 'C23D1', scheduledDate: '2023-06-02', actualDate: '2023-05-31' },
      { id: 'v26', visitName: 'C24D1', scheduledDate: '2023-06-28', actualDate: '2023-06-27' },
      { id: 'v27', visitName: 'C25D1', scheduledDate: '2023-07-25', actualDate: '' },
      { id: 'v28', visitName: 'C29D1', scheduledDate: '2023-11-14', actualDate: '' },
      { id: 'v29', visitName: 'C33D1', scheduledDate: '2024-03-05', actualDate: '2024-03-06' },
      { id: 'v30', visitName: 'C37D1', scheduledDate: '2024-06-26', actualDate: '' },
      { id: 'v31', visitName: 'C41D1', scheduledDate: '2024-10-16', actualDate: '' },
      { id: 'v32', visitName: 'C45D1', scheduledDate: '2025-02-05', actualDate: '' },
      { id: 'v33', visitName: 'C49D1', scheduledDate: '2025-05-28', actualDate: '' },
      { id: 'v34', visitName: 'C53D1', scheduledDate: '2025-09-17', actualDate: '' },
      { id: 'v35', visitName: 'C57D1', scheduledDate: '2026-01-07', actualDate: '2026-01-14' },
      { id: 'v36', visitName: 'C61D1', scheduledDate: '2026-04-29', actualDate: '' },
      { id: 'v37', visitName: 'C65D1', scheduledDate: '2026-08-19', actualDate: '' },
      { id: 'v41', visitName: 'C61D1', scheduledDate: '2026-12-09', actualDate: '' }
    ]
  }
];
