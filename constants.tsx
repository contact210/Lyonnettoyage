
import { Employee, Site, Role, ContractType, SiteStatus, Invoice, InvoiceStatus, CompanySettings } from './types';

export const LYON_CENTER: [number, number] = [45.764043, 4.835659];

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: "Lyon Clean Pro Services",
  siret: "123 456 789 00012",
  tvaIntra: "FR 12 123456789",
  address: "42 Quai de la République, 69002 Lyon",
  iban: "FR76 3000 6000 0102 0304 0506 078",
  bic: "BNPAFR69",
  email: "compta@cleanlyon.fr",
  phone: "04 78 00 00 00"
};

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'j.dupont@cleanlyon.fr',
    phone: '06 12 34 56 78',
    address: '12 Rue de la République, 69002 Lyon',
    contractType: ContractType.CDI,
    hiringDate: '2023-01-15',
    hourlyRate: 14.5,
    photoUrl: 'https://picsum.photos/seed/jean/200',
    role: Role.AGENT
  },
  {
    id: 'emp-2',
    firstName: 'Marie',
    lastName: 'Lefebvre',
    email: 'm.lefebvre@cleanlyon.fr',
    phone: '06 87 65 43 21',
    address: '45 Avenue Jean Jaurès, 69007 Lyon',
    contractType: ContractType.CDI,
    hiringDate: '2022-06-10',
    hourlyRate: 15.2,
    photoUrl: 'https://picsum.photos/seed/marie/200',
    role: Role.LEADER
  }
];

export const MOCK_SITES: Site[] = [
  {
    id: 'site-1',
    clientName: 'Tour Incity',
    address: '116 Cours Lafayette, 69003 Lyon',
    coords: [45.7645, 4.8515],
    type: 'Bureaux',
    frequency: 'Quotidien',
    duration: 8,
    agentsRequired: 3,
    status: SiteStatus.ACTIVE,
    hourlyRate: 45
  },
  {
    id: 'site-2',
    clientName: 'Copropriété Bellecour',
    address: 'Place Bellecour, 69002 Lyon',
    coords: [45.7578, 4.8322],
    type: 'Copropriété',
    frequency: 'Hebdomadaire',
    duration: 4,
    agentsRequired: 1,
    status: SiteStatus.ACTIVE,
    hourlyRate: 38
  }
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    number: 'FAC-2024-001',
    clientId: 'site-1',
    clientName: 'Tour Incity',
    date: '2024-05-01',
    dueDate: '2024-05-31',
    items: [
      { description: 'Entretien bureaux - Forfait Mai', quantity: 1, unitPrice: 2450.00, vatRate: 20 }
    ],
    status: InvoiceStatus.PAID,
    totalHT: 2450.00,
    totalTTC: 2940.00
  },
  {
    id: 'inv-2',
    number: 'FAC-2024-002',
    clientId: 'site-2',
    clientName: 'Copropriété Bellecour',
    date: '2024-05-10',
    dueDate: '2024-06-10',
    items: [
      { description: 'Nettoyage parties communes', quantity: 4, unitPrice: 150.00, vatRate: 20 }
    ],
    status: InvoiceStatus.SENT,
    totalHT: 600.00,
    totalTTC: 720.00
  }
];
