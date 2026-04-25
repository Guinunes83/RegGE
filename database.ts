
import { 
  TeamMember, Study, Patient, PIEntry, ProtocolDeviation, MonitorEntry, CEPMeeting, KitStockEntry, NoteItem, User, Sponsor, UserProfile, CalendarEvent, RegulatoryLinkEntry, AppNotification, Notice, InfusionAppointment, Consultation, Calibration
} from './types';
import { 
  MOCK_STUDIES, MOCK_PIS, MOCK_PATIENTS, MOCK_AVAILABLE_MONITORS, 
  MOCK_AMENDMENTS, MOCK_TEAM, MOCK_NOTIFICATIONS, MOCK_NOTICES,
  MOCK_SPONSORS, MOCK_CEP_MEETINGS, MOCK_DEVIATIONS, MOCK_SAE_DEVIATIONS,
  MOCK_GCP_DEVIATIONS, MOCK_KIT_STOCK, MOCK_VISIT_SCHEDULES, MOCK_CEP_CALENDAR
} from './constants';

// Usuário padrão para primeiro acesso caso não exista
const DEFAULT_ADMIN: User = {
  id: 'admin',
  name: 'Administrador',
  jobTitle: 'Gestor',
  cpf: '000.000.000-00',
  contact: '',
  login: 'admin',
  password: '123',
  profile: UserProfile.ADMIN,
  active: true
};

class AppDatabase {
  // Prefixo para não misturar com outros dados do localstorage
  private PREFIX = 'REGGE_';
  private API_URL = 'http://localhost:8080/api';

  // Coleções que estão implementadas no backend
  private API_COLLECTIONS = ['studies', 'team-members', 'sponsors', 'patients', 'notes', 'deviations', 'calibrations', 'monitors', 'kit-stock', 'consultations', 'associates', 'transactions', 'assets', 'vacations'];

  private getCollection<T>(key: string): T[] {
    const data = localStorage.getItem(`${this.PREFIX}${key}`);
    return data ? JSON.parse(data) : [];
  }

  private saveCollection<T>(key: string, data: T[]) {
    localStorage.setItem(`${this.PREFIX}${key}`, JSON.stringify(data));
  }

  constructor() {
    this.initMocks();
  }

  private initMocks() {
    // Inicializa dados de exemplo se o storage estiver vazio para o sistema não começar "em branco"
    // Nota: Quando usar API real, os mocks podem ser ignorados ou usados apenas para desenvolvimento local sem backend
    if (this.getCollection('studies').length === 0) {
      this.saveCollection('studies', MOCK_STUDIES);
    }
    // ... rest of initMocks remains same for local fallback ...
    if (this.getCollection('pis').length === 0) {
      this.saveCollection('pis', MOCK_PIS);
    }
    if (this.getCollection('patients').length === 0) {
      this.saveCollection('patients', MOCK_PATIENTS);
    }
    if (this.getCollection('monitors').length === 0) {
      this.saveCollection('monitors', MOCK_AVAILABLE_MONITORS);
    }
    if (this.getCollection('notifications').length === 0) {
      this.saveCollection('notifications', MOCK_NOTIFICATIONS);
    }
    if (this.getCollection('notices').length === 0) {
      this.saveCollection('notices', MOCK_NOTICES);
    }
    if (this.getCollection('team-members').length === 0) {
      this.saveCollection('team-members', MOCK_TEAM);
    }
    if (this.getCollection('sponsors').length === 0) {
      this.saveCollection('sponsors', MOCK_SPONSORS);
    }
    if (this.getCollection('cepMeetings').length === 0) {
      this.saveCollection('cepMeetings', MOCK_CEP_MEETINGS);
    }
    if (this.getCollection('kitStock').length === 0) {
      this.saveCollection('kitStock', MOCK_KIT_STOCK);
    }
    // Inicializa mock de controle de visitas
    if (this.getCollection('visitSchedules').length === 0) {
      this.saveCollection('visitSchedules', MOCK_VISIT_SCHEDULES);
    }
    // Inicializa mock de calendario CEP
    if (this.getCollection('cepCalendar').length === 0) {
      this.saveCollection('cepCalendar', MOCK_CEP_CALENDAR);
    }
    
    // Inicializa coleção de infusões vazia
    if (this.getCollection('infusions').length === 0) {
      this.saveCollection('infusions', []);
    }

    // Inicializa coleção de consultas vazia
    if (this.getCollection('consultations').length === 0) {
      this.saveCollection('consultations', []);
    }

    // Garante que existe um usuário admin para logar (admin / 123)
    if (this.getCollection('users').length === 0) {
      this.saveCollection('users', [DEFAULT_ADMIN]);
    }

    // Inicializar outras coleções vazias para evitar erros de null
    const otherCollections = ['notes', 'calendarEvents', 'regulatoryLinks', 'transactions', 'assets', 'vacations', 'userProfiles'];
    otherCollections.forEach(col => {
      if (!localStorage.getItem(`${this.PREFIX}${col}`)) {
        this.saveCollection(col, []);
      }
    });
  }

  async getAll<K>(collection: string): Promise<K[]> {
    if (this.API_COLLECTIONS.includes(collection)) {
      try {
        const response = await fetch(`${this.API_URL}/${collection}`);
        if (response.ok) return await response.json();
      } catch (error) {
        // Silently fallback to localStorage to avoid console clutter.
      }
    }

    return new Promise((resolve) => {
      // Simula um delay imperceptível para manter a assincronicidade do código existente
      setTimeout(() => {
        const data = this.getCollection<K>(collection);
        resolve(data);
      }, 50); 
    });
  }

  async upsert(collection: string, item: any) {
    if (this.API_COLLECTIONS.includes(collection)) {
      try {
        const response = await fetch(`${this.API_URL}/${collection}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (response.ok) return await response.json();
        
        // Se não for ok, tenta ler a mensagem de erro
        const errorText = await response.text();
        return errorText || `Erro ${response.status}: Falha ao salvar ${collection}`;
      } catch (error) {
        // Silently fallback
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.getCollection<any>(collection);
        const index = items.findIndex((i: any) => i.id === item.id);
        
        // Se já existe atualiza, se não cria novo
        if (index >= 0) {
          items[index] = item;
        } else {
          if (!item.id) item.id = Math.random().toString(36).substr(2, 9);
          items.push(item);
        }
        
        this.saveCollection(collection, items);
        resolve(item);
      }, 50);
    });
  }

  async delete(collection: string, id: string) {
    if (this.API_COLLECTIONS.includes(collection)) {
      try {
        const response = await fetch(`${this.API_URL}/${collection}/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) return true;
      } catch (error) {
        // Silently fallback
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.getCollection<any>(collection);
        const newItems = items.filter((i: any) => i.id !== id);
        this.saveCollection(collection, newItems);
        resolve(true);
      }, 50);
    });
  }

  async patch(collection: string, id: string, action: string) {
    if (this.API_COLLECTIONS.includes(collection)) {
      try {
        const response = await fetch(`${this.API_URL}/${collection}/${id}/${action}`, {
          method: 'PATCH'
        });
        if (response.ok) return await response.json();
      } catch (error) {
        // Silently fallback
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.getCollection<any>(collection);
        const index = items.findIndex((i: any) => i.id === id);
        if (index >= 0) {
          if (action === 'toggle-active') {
            items[index].active = !items[index].active;
          }
          this.saveCollection(collection, items);
          resolve(items[index]);
        } else {
          resolve(null);
        }
      }, 50);
    });
  }
}

export const db = new AppDatabase();
