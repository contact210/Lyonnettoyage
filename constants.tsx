
import {
  Employee, Site, Role, ContractType, SiteStatus, Invoice, InvoiceStatus, CompanySettings,
  WholesaleProduct, WholesaleCustomer, WholesaleOrder, WholesaleSettings, CustomerSegment, OrderStatus
} from './types';

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

// ---------------------------------------------------------------------------
// Vente en gros — données de démonstration
// ---------------------------------------------------------------------------

export const DEFAULT_WHOLESALE_SETTINGS: WholesaleSettings = {
  francoThreshold: 300,
  shippingFee: 25,
  minOrderHT: 150,
  minMarginRate: 25
};

export const MOCK_WHOLESALE_PRODUCTS: WholesaleProduct[] = [
  {
    id: 'prd-1', sku: 'SOL-NEU-5L', name: 'Détergent sols neutre', category: 'Sols', packaging: 'Bidon 5 L',
    costPrice: 9.8, tiers: [{ minQty: 1, unitPrice: 16.9 }, { minQty: 10, unitPrice: 15.5 }, { minQty: 50, unitPrice: 13.9 }],
    vatRate: 20, stock: 140, minStock: 40, active: true
  },
  {
    id: 'prd-2', sku: 'DEG-SUP-5L', name: 'Dégraissant surpuissant', category: 'Sols', packaging: 'Bidon 5 L',
    costPrice: 12.4, tiers: [{ minQty: 1, unitPrice: 21.5 }, { minQty: 10, unitPrice: 19.7 }, { minQty: 50, unitPrice: 17.9 }],
    vatRate: 20, stock: 65, minStock: 20, active: true
  },
  {
    id: 'prd-3', sku: 'SAN-DET-12', name: 'Détartrant sanitaires', category: 'Sanitaires', packaging: 'Carton 12 × 750 mL',
    costPrice: 18, tiers: [{ minQty: 1, unitPrice: 32.4 }, { minQty: 10, unitPrice: 29.9 }, { minQty: 30, unitPrice: 27.5 }],
    vatRate: 20, stock: 22, minStock: 25, active: true
  },
  {
    id: 'prd-4', sku: 'VIT-NET-5L', name: 'Nettoyant vitres', category: 'Vitres', packaging: 'Bidon 5 L',
    costPrice: 7.9, tiers: [{ minQty: 1, unitPrice: 13.9 }, { minQty: 10, unitPrice: 12.7 }, { minQty: 50, unitPrice: 11.5 }],
    vatRate: 20, stock: 90, minStock: 30, active: true
  },
  {
    id: 'prd-5', sku: 'DES-SUR-5L', name: 'Désinfectant surfaces EN 14476', category: 'Désinfection', packaging: 'Bidon 5 L',
    costPrice: 15.6, tiers: [{ minQty: 1, unitPrice: 27.9 }, { minQty: 10, unitPrice: 25.5 }, { minQty: 50, unitPrice: 23.4 }],
    vatRate: 20, stock: 48, minStock: 20, active: true
  },
  {
    id: 'prd-6', sku: 'HYG-GEL-12', name: 'Gel hydroalcoolique', category: 'Hygiène', packaging: 'Carton 12 × 500 mL',
    costPrice: 21, tiers: [{ minQty: 1, unitPrice: 36 }, { minQty: 10, unitPrice: 33 }],
    vatRate: 20, stock: 30, minStock: 10, active: true
  },
  {
    id: 'prd-7', sku: 'PAP-ESS-20', name: 'Essuie-mains enchevêtrés', category: 'Consommables', packaging: 'Carton 20 × 150 feuilles',
    costPrice: 19.5, tiers: [{ minQty: 1, unitPrice: 31.9 }, { minQty: 10, unitPrice: 29.5 }, { minQty: 40, unitPrice: 27.4 }],
    vatRate: 20, stock: 75, minStock: 30, active: true
  },
  {
    id: 'prd-8', sku: 'PAP-WC-JMB', name: 'Papier toilette Jumbo', category: 'Consommables', packaging: 'Colis 6 rouleaux',
    costPrice: 11.2, tiers: [{ minQty: 1, unitPrice: 18.9 }, { minQty: 10, unitPrice: 17.4 }, { minQty: 50, unitPrice: 15.9 }],
    vatRate: 20, stock: 110, minStock: 40, active: true
  },
  {
    id: 'prd-9', sku: 'SAC-110-200', name: 'Sacs poubelle 110 L renforcés', category: 'Consommables', packaging: 'Carton 200 sacs',
    costPrice: 22, tiers: [{ minQty: 1, unitPrice: 36.5 }, { minQty: 10, unitPrice: 33.9 }],
    vatRate: 20, stock: 8, minStock: 15, active: true
  },
  {
    id: 'prd-10', sku: 'MAT-MIC-10', name: 'Microfibres 40 × 40 cm', category: 'Matériel', packaging: 'Lot de 10',
    costPrice: 6.5, tiers: [{ minQty: 1, unitPrice: 12.9 }, { minQty: 20, unitPrice: 11.5 }, { minQty: 100, unitPrice: 9.9 }],
    vatRate: 20, stock: 200, minStock: 50, active: true
  },
  {
    id: 'prd-11', sku: 'MAT-MOP-40', name: 'Frange MOP coton 40 cm', category: 'Matériel', packaging: 'Lot de 5',
    costPrice: 14, tiers: [{ minQty: 1, unitPrice: 24.9 }, { minQty: 10, unitPrice: 22.5 }],
    vatRate: 20, stock: 35, minStock: 10, active: true
  },
  {
    id: 'prd-12', sku: 'HYG-GNT-100', name: 'Gants nitrile non poudrés', category: 'Hygiène', packaging: 'Boîte de 100',
    costPrice: 4.2, tiers: [{ minQty: 1, unitPrice: 7.9 }, { minQty: 20, unitPrice: 6.9 }, { minQty: 100, unitPrice: 5.9 }],
    vatRate: 20, stock: 320, minStock: 100, active: true
  }
];

export const MOCK_WHOLESALE_CUSTOMERS: WholesaleCustomer[] = [
  {
    id: 'cli-1', companyName: 'Rhône Hygiène Distribution', siret: '111 222 333 00014', tvaIntra: 'FR 11 111222333',
    address: '18 Rue Paul Bert, 69003 Lyon', contactName: 'Sophie Garnier', email: 'achats@rhone-hygiene.example',
    phone: '04 72 00 11 22', segment: CustomerSegment.RESELLER, discountRate: 10, paymentTermsDays: 45
  },
  {
    id: 'cli-2', companyName: 'Hôtel Les Platanes', siret: '222 333 444 00025', tvaIntra: 'FR 22 222333444',
    address: '5 Quai Claude Bernard, 69007 Lyon', contactName: 'Karim Benali', email: 'intendance@hotel-platanes.example',
    phone: '04 78 11 22 33', segment: CustomerSegment.COMPANY, discountRate: 5, paymentTermsDays: 30
  },
  {
    id: 'cli-3', companyName: 'Crèche Les Petits Pas', siret: '333 444 555 00036', tvaIntra: 'FR 33 333444555',
    address: '27 Rue de Marseille, 69007 Lyon', contactName: 'Hélène Roux', email: 'direction@petitspas.example',
    phone: '04 78 22 33 44', segment: CustomerSegment.PUBLIC, discountRate: 0, paymentTermsDays: 30
  }
];

export const MOCK_WHOLESALE_ORDERS: WholesaleOrder[] = [
  {
    id: 'ord-1', number: 'CMD-2026-0001', customerId: 'cli-1', customerName: 'Rhône Hygiène Distribution',
    date: '2026-10-05', deliveryDate: '2026-10-08', status: OrderStatus.INVOICED,
    lines: [
      { productId: 'prd-1', sku: 'SOL-NEU-5L', label: 'Détergent sols neutre — Bidon 5 L', quantity: 50, unitPrice: 12.51, unitCost: 9.8, vatRate: 20 },
      { productId: 'prd-8', sku: 'PAP-WC-JMB', label: 'Papier toilette Jumbo — Colis 6 rouleaux', quantity: 20, unitPrice: 15.66, unitCost: 11.2, vatRate: 20 }
    ],
    invoiceNumber: 'FAC-G-2026-0001', invoiceDate: '2026-10-08', dueDate: '2026-11-22',
    history: [
      { date: '2026-10-05', status: OrderStatus.QUOTE },
      { date: '2026-10-05', status: OrderStatus.CONFIRMED },
      { date: '2026-10-07', status: OrderStatus.PREPARED },
      { date: '2026-10-08', status: OrderStatus.DELIVERED },
      { date: '2026-10-08', status: OrderStatus.INVOICED }
    ]
  },
  {
    id: 'ord-2', number: 'CMD-2026-0002', customerId: 'cli-2', customerName: 'Hôtel Les Platanes',
    date: '2026-10-19', status: OrderStatus.CONFIRMED,
    lines: [
      { productId: 'prd-5', sku: 'DES-SUR-5L', label: 'Désinfectant surfaces EN 14476 — Bidon 5 L', quantity: 10, unitPrice: 24.23, unitCost: 15.6, vatRate: 20 },
      { productId: 'prd-7', sku: 'PAP-ESS-20', label: 'Essuie-mains enchevêtrés — Carton 20 × 150 feuilles', quantity: 12, unitPrice: 28.03, unitCost: 19.5, vatRate: 20 }
    ],
    history: [
      { date: '2026-10-19', status: OrderStatus.QUOTE },
      { date: '2026-10-20', status: OrderStatus.CONFIRMED }
    ]
  },
  {
    id: 'ord-3', number: 'CMD-2026-0003', customerId: 'cli-3', customerName: 'Crèche Les Petits Pas',
    date: '2026-10-21', status: OrderStatus.QUOTE,
    lines: [
      { productId: 'prd-6', sku: 'HYG-GEL-12', label: 'Gel hydroalcoolique — Carton 12 × 500 mL', quantity: 4, unitPrice: 36, unitCost: 21, vatRate: 20 },
      { productId: 'prd-12', sku: 'HYG-GNT-100', label: 'Gants nitrile non poudrés — Boîte de 100', quantity: 20, unitPrice: 6.9, unitCost: 4.2, vatRate: 20 }
    ],
    notes: 'Livraison le matin avant 9 h.',
    history: [{ date: '2026-10-21', status: OrderStatus.QUOTE }]
  }
];
