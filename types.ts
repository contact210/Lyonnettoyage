
export enum Role {
  ADMIN = 'ADMIN',
  OPERATIONS = 'OPERATIONS',
  LEADER = 'LEADER',
  AGENT = 'AGENT'
}

export enum ContractType {
  CDI = 'CDI',
  CDD = 'CDD',
  AUTO = 'Auto-entrepreneur'
}

export enum SiteStatus {
  ACTIVE = 'Actif',
  SUSPENDED = 'Suspendu',
  COMPLETED = 'Terminé'
}

export enum InvoiceStatus {
  DRAFT = 'Brouillon',
  SENT = 'Envoyée',
  PAID = 'Payée',
  OVERDUE = 'En retard',
  CANCELED = 'Annulée'
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  contractType: ContractType;
  hiringDate: string;
  hourlyRate: number;
  photoUrl: string;
  role: Role;
}

export interface Site {
  id: string;
  clientName: string;
  address: string;
  coords: [number, number];
  type: 'Bureaux' | 'Copropriété' | 'Fin de chantier' | 'Vitrerie' | 'Industriel';
  frequency: 'Quotidien' | 'Hebdomadaire' | 'Mensuel' | 'Ponctuel';
  duration: number; // in hours
  agentsRequired: number;
  status: SiteStatus;
  hourlyRate: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  totalHT: number;
  totalTTC: number;
}

export interface CompanySettings {
  name: string;
  siret: string;
  tvaIntra: string;
  address: string;
  iban: string;
  bic: string;
  email: string;
  phone: string;
}
