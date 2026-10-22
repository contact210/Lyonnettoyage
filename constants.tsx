
import {
  Employee, Site, Role, ContractType, SiteStatus, Invoice, InvoiceStatus, CompanySettings,
  WholesaleProduct, WholesaleCustomer, WholesaleOrder, WholesaleSettings, CustomerSegment, OrderStatus,
  Supplier, PurchaseOrder, PurchaseStatus, StockMovement, StockMovementType,
  Lead, LeadStage, Activity, ActivityType, CrmTask
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
    vatRate: 20, stock: 140, minStock: 40, active: true, supplierId: 'sup-1', lastPurchasePrice: 9.8
  },
  {
    id: 'prd-2', sku: 'DEG-SUP-5L', name: 'Dégraissant surpuissant', category: 'Sols', packaging: 'Bidon 5 L',
    costPrice: 12.4, tiers: [{ minQty: 1, unitPrice: 21.5 }, { minQty: 10, unitPrice: 19.7 }, { minQty: 50, unitPrice: 17.9 }],
    vatRate: 20, stock: 65, minStock: 20, active: true, supplierId: 'sup-1', lastPurchasePrice: 12.4
  },
  {
    id: 'prd-3', sku: 'SAN-DET-12', name: 'Détartrant sanitaires', category: 'Sanitaires', packaging: 'Carton 12 × 750 mL',
    costPrice: 18, tiers: [{ minQty: 1, unitPrice: 32.4 }, { minQty: 10, unitPrice: 29.9 }, { minQty: 30, unitPrice: 27.5 }],
    vatRate: 20, stock: 22, minStock: 25, active: true, supplierId: 'sup-1', lastPurchasePrice: 18
  },
  {
    id: 'prd-4', sku: 'VIT-NET-5L', name: 'Nettoyant vitres', category: 'Vitres', packaging: 'Bidon 5 L',
    costPrice: 7.9, tiers: [{ minQty: 1, unitPrice: 13.9 }, { minQty: 10, unitPrice: 12.7 }, { minQty: 50, unitPrice: 11.5 }],
    vatRate: 20, stock: 90, minStock: 30, active: true, supplierId: 'sup-1', lastPurchasePrice: 7.9
  },
  {
    id: 'prd-5', sku: 'DES-SUR-5L', name: 'Désinfectant surfaces EN 14476', category: 'Désinfection', packaging: 'Bidon 5 L',
    costPrice: 15.6, tiers: [{ minQty: 1, unitPrice: 27.9 }, { minQty: 10, unitPrice: 25.5 }, { minQty: 50, unitPrice: 23.4 }],
    vatRate: 20, stock: 48, minStock: 20, active: true, supplierId: 'sup-1', lastPurchasePrice: 15.6
  },
  {
    id: 'prd-6', sku: 'HYG-GEL-12', name: 'Gel hydroalcoolique', category: 'Hygiène', packaging: 'Carton 12 × 500 mL',
    costPrice: 21, tiers: [{ minQty: 1, unitPrice: 36 }, { minQty: 10, unitPrice: 33 }],
    vatRate: 20, stock: 30, minStock: 10, active: true, supplierId: 'sup-2', lastPurchasePrice: 21
  },
  {
    id: 'prd-7', sku: 'PAP-ESS-20', name: 'Essuie-mains enchevêtrés', category: 'Consommables', packaging: 'Carton 20 × 150 feuilles',
    costPrice: 19.5, tiers: [{ minQty: 1, unitPrice: 31.9 }, { minQty: 10, unitPrice: 29.5 }, { minQty: 40, unitPrice: 27.4 }],
    vatRate: 20, stock: 75, minStock: 30, active: true, supplierId: 'sup-2', lastPurchasePrice: 19.5
  },
  {
    id: 'prd-8', sku: 'PAP-WC-JMB', name: 'Papier toilette Jumbo', category: 'Consommables', packaging: 'Colis 6 rouleaux',
    costPrice: 11.2, tiers: [{ minQty: 1, unitPrice: 18.9 }, { minQty: 10, unitPrice: 17.4 }, { minQty: 50, unitPrice: 15.9 }],
    vatRate: 20, stock: 110, minStock: 40, active: true, supplierId: 'sup-2', lastPurchasePrice: 11.2
  },
  {
    id: 'prd-9', sku: 'SAC-110-200', name: 'Sacs poubelle 110 L renforcés', category: 'Consommables', packaging: 'Carton 200 sacs',
    costPrice: 22, tiers: [{ minQty: 1, unitPrice: 36.5 }, { minQty: 10, unitPrice: 33.9 }],
    vatRate: 20, stock: 8, minStock: 15, active: true, supplierId: 'sup-2', lastPurchasePrice: 22
  },
  {
    id: 'prd-10', sku: 'MAT-MIC-10', name: 'Microfibres 40 × 40 cm', category: 'Matériel', packaging: 'Lot de 10',
    costPrice: 6.5, tiers: [{ minQty: 1, unitPrice: 12.9 }, { minQty: 20, unitPrice: 11.5 }, { minQty: 100, unitPrice: 9.9 }],
    vatRate: 20, stock: 200, minStock: 50, active: true, supplierId: 'sup-3', lastPurchasePrice: 6.5
  },
  {
    id: 'prd-11', sku: 'MAT-MOP-40', name: 'Frange MOP coton 40 cm', category: 'Matériel', packaging: 'Lot de 5',
    costPrice: 14, tiers: [{ minQty: 1, unitPrice: 24.9 }, { minQty: 10, unitPrice: 22.5 }],
    vatRate: 20, stock: 35, minStock: 10, active: true, supplierId: 'sup-3', lastPurchasePrice: 14
  },
  {
    id: 'prd-12', sku: 'HYG-GNT-100', name: 'Gants nitrile non poudrés', category: 'Hygiène', packaging: 'Boîte de 100',
    costPrice: 4.2, tiers: [{ minQty: 1, unitPrice: 7.9 }, { minQty: 20, unitPrice: 6.9 }, { minQty: 100, unitPrice: 5.9 }],
    vatRate: 20, stock: 320, minStock: 100, active: true, supplierId: 'sup-2', lastPurchasePrice: 4.2
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

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1', companyName: 'Rhône Chimie Pro', siret: '555 666 777 00018', tvaIntra: 'FR 55 555666777',
    address: '14 Rue de l’Industrie, 69800 Saint-Priest', contactName: 'Marc Lefort', email: 'commandes@rhonechimie.example',
    phone: '04 72 33 44 55', paymentTermsDays: 45, leadTimeDays: 3
  },
  {
    id: 'sup-2', companyName: 'Hygiène Papier Sud', siret: '666 777 888 00029', tvaIntra: 'FR 66 666777888',
    address: '8 Avenue de la Gare, 38200 Vienne', contactName: 'Julie Perrin', email: 'adv@hygienepapier.example',
    phone: '04 74 55 66 77', paymentTermsDays: 30, leadTimeDays: 5
  },
  {
    id: 'sup-3', companyName: 'MatClean Équipement', siret: '777 888 999 00030', tvaIntra: 'FR 77 777888999',
    address: '3 Chemin des Mûriers, 69150 Décines', contactName: 'Paulo Santos', email: 'pro@matclean.example',
    phone: '04 78 66 77 88', paymentTermsDays: 30, leadTimeDays: 7
  }
];

export const MOCK_PURCHASES: PurchaseOrder[] = [
  {
    id: 'ach-1', number: 'ACH-2026-0001', supplierId: 'sup-1', supplierName: 'Rhône Chimie Pro',
    date: '2026-10-09', expectedDate: '2026-10-12', status: PurchaseStatus.RECEIVED,
    lines: [
      { productId: 'prd-1', sku: 'SOL-NEU-5L', label: 'Détergent sols neutre — Bidon 5 L', quantity: 60, unitCost: 9.8, vatRate: 20, receivedQty: 60 },
      { productId: 'prd-5', sku: 'DES-SUR-5L', label: 'Désinfectant surfaces EN 14476 — Bidon 5 L', quantity: 24, unitCost: 15.6, vatRate: 20, receivedQty: 24 }
    ],
    shippingHT: 0, receivedDate: '2026-10-12', supplierInvoiceRef: 'RCP-88412', dueDate: '2026-11-26',
    history: [
      { date: '2026-10-09', status: PurchaseStatus.DRAFT },
      { date: '2026-10-09', status: PurchaseStatus.ORDERED },
      { date: '2026-10-12', status: PurchaseStatus.RECEIVED }
    ]
  },
  {
    id: 'ach-2', number: 'ACH-2026-0002', supplierId: 'sup-2', supplierName: 'Hygiène Papier Sud',
    date: '2026-10-20', expectedDate: '2026-10-25', status: PurchaseStatus.ORDERED,
    lines: [
      { productId: 'prd-9', sku: 'SAC-110-200', label: 'Sacs poubelle 110 L renforcés — Carton 200 sacs', quantity: 40, unitCost: 22, vatRate: 20, receivedQty: 0 },
      { productId: 'prd-8', sku: 'PAP-WC-JMB', label: 'Papier toilette Jumbo — Colis 6 rouleaux', quantity: 30, unitCost: 11.2, vatRate: 20, receivedQty: 0 }
    ],
    shippingHT: 18,
    history: [
      { date: '2026-10-20', status: PurchaseStatus.DRAFT },
      { date: '2026-10-20', status: PurchaseStatus.ORDERED }
    ]
  }
];

// Historique cohérent avec les commandes et achats de démonstration :
// stock initial au 1er octobre, puis ventes CMD-0001 et CMD-0002 et réception ACH-0001.
const INITIAL_STOCK_SHIFT: Record<string, number> = { 'prd-1': -10, 'prd-5': -14, 'prd-7': 12, 'prd-8': 20 };

const demoMovement = (
  id: string, date: string, productId: string, type: StockMovementType, quantity: number, stockAfter: number, reference?: string
): StockMovement => {
  const product = MOCK_WHOLESALE_PRODUCTS.find(p => p.id === productId)!;
  return { id, date, productId, sku: product.sku, type, quantity, unitCost: product.costPrice, stockAfter, reference };
};

export const MOCK_STOCK_MOVEMENTS: StockMovement[] = [
  ...MOCK_WHOLESALE_PRODUCTS.map(p => {
    const initial = p.stock + (INITIAL_STOCK_SHIFT[p.id] ?? 0);
    return demoMovement(`mvt-init-${p.id}`, '2026-10-01', p.id, StockMovementType.INITIAL, initial, initial);
  }),
  demoMovement('mvt-1', '2026-10-05', 'prd-1', StockMovementType.SALE, -50, 80, 'CMD-2026-0001'),
  demoMovement('mvt-2', '2026-10-05', 'prd-8', StockMovementType.SALE, -20, 110, 'CMD-2026-0001'),
  demoMovement('mvt-3', '2026-10-12', 'prd-1', StockMovementType.PURCHASE, 60, 140, 'ACH-2026-0001'),
  demoMovement('mvt-4', '2026-10-12', 'prd-5', StockMovementType.PURCHASE, 24, 58, 'ACH-2026-0001'),
  demoMovement('mvt-5', '2026-10-20', 'prd-5', StockMovementType.SALE, -10, 48, 'CMD-2026-0002'),
  demoMovement('mvt-6', '2026-10-20', 'prd-7', StockMovementType.SALE, -12, 75, 'CMD-2026-0002')
];

// ---------------------------------------------------------------------------
// CRM — données de démonstration
// ---------------------------------------------------------------------------

export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1', companyName: 'Boulangerie Pain Doré', contactName: 'Sandrine Morel', email: 'contact@paindore.example',
    phone: '04 78 10 20 30', address: '9 Rue Mercière, 69002 Lyon', segment: CustomerSegment.COMPANY, source: 'Google',
    stage: LeadStage.NEW, estimatedMonthlyHT: 180, createdDate: '2026-10-21', stageDate: '2026-10-21',
    notes: 'Formulaire du site : cherche sacs, essuie-mains et produit sols.'
  },
  {
    id: 'lead-2', companyName: 'Résidence Seniors Les Acacias', contactName: 'Nadia Haddad', email: 'intendance@acacias.example',
    phone: '04 72 40 50 60', address: '120 Avenue Berthelot, 69007 Lyon', segment: CustomerSegment.COMPANY, source: 'Recommandation',
    stage: LeadStage.CONTACTED, estimatedMonthlyHT: 650, createdDate: '2026-10-10', stageDate: '2026-10-14'
  },
  {
    id: 'lead-3', companyName: 'Garage Auto Confluence', contactName: 'Thomas Girard', email: 'atelier@garageconfluence.example',
    phone: '04 78 37 11 22', address: '45 Quai Perrache, 69002 Lyon', segment: CustomerSegment.COMPANY, source: 'Prospection',
    stage: LeadStage.MEETING, estimatedMonthlyHT: 240, createdDate: '2026-10-02', stageDate: '2026-10-16'
  },
  {
    id: 'lead-4', companyName: 'Clinique Vétérinaire des Brotteaux', contactName: 'Dr Claire Fabre', email: 'accueil@vet-brotteaux.example',
    phone: '04 78 24 33 44', address: '61 Boulevard des Brotteaux, 69006 Lyon', segment: CustomerSegment.COMPANY, source: 'Site web',
    stage: LeadStage.PROPOSAL, estimatedMonthlyHT: 420, createdDate: '2026-09-25', stageDate: '2026-10-15'
  },
  {
    id: 'lead-5', companyName: 'Restaurant Le Bouchon Gourmand', contactName: 'Julien Bertrand', email: 'julien@bouchongourmand.example',
    phone: '04 78 42 55 66', address: '14 Rue Saint-Jean, 69005 Lyon', segment: CustomerSegment.COMPANY, source: 'Salon',
    stage: LeadStage.NEGOTIATION, estimatedMonthlyHT: 310, createdDate: '2026-09-20', stageDate: '2026-10-18',
    notes: 'Demande 8 % de remise sur volume.'
  },
  {
    id: 'lead-6', companyName: 'Salle de sport FitLyon', contactName: 'Kevin Lambert', email: 'gerant@fitlyon.example',
    phone: '04 78 60 70 80', address: '7 Rue de la Part-Dieu, 69003 Lyon', segment: CustomerSegment.COMPANY, source: 'Réseaux sociaux',
    stage: LeadStage.LOST, estimatedMonthlyHT: 200, createdDate: '2026-09-10', stageDate: '2026-10-01',
    lostReason: 'Prix trop élevé face à un grossiste en ligne'
  },
  {
    id: 'lead-7', companyName: 'Hôtel Les Platanes', contactName: 'Karim Benali', email: 'intendance@hotel-platanes.example',
    phone: '04 78 11 22 33', address: '5 Quai Claude Bernard, 69007 Lyon', segment: CustomerSegment.COMPANY, source: 'Recommandation',
    stage: LeadStage.WON, estimatedMonthlyHT: 550, createdDate: '2026-09-15', stageDate: '2026-10-01', customerId: 'cli-2'
  }
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: 'act-1', date: '2026-10-14', type: ActivityType.CALL, subject: 'Premier appel : 3 bâtiments, achats centralisés par l’intendance', leadId: 'lead-2' },
  { id: 'act-2', date: '2026-10-15', type: ActivityType.EMAIL, subject: 'Devis sanitaires + désinfection envoyé', leadId: 'lead-4' },
  { id: 'act-3', date: '2026-10-16', type: ActivityType.SAMPLE, subject: 'Échantillons dégraissant et microfibres déposés à l’atelier', leadId: 'lead-3' },
  { id: 'act-4', date: '2026-10-18', type: ActivityType.VISIT, subject: 'Rencontre avec le chef : demande −8 % sur volume', notes: 'Commande prévue tous les 15 jours si accord.', leadId: 'lead-5' },
  { id: 'act-5', date: '2026-10-19', type: ActivityType.EMAIL, subject: 'Confirmation de la commande CMD-2026-0002', customerId: 'cli-2' },
  { id: 'act-6', date: '2026-10-20', type: ActivityType.CALL, subject: 'Point mensuel : prochaine commande fin octobre', customerId: 'cli-1' }
];

export const MOCK_CRM_TASKS: CrmTask[] = [
  { id: 'task-1', dueDate: '2026-10-14', title: 'Appeler la résidence', leadId: 'lead-2', done: true, doneDate: '2026-10-14', createdDate: '2026-10-10' },
  { id: 'task-2', dueDate: '2026-10-21', title: 'Relancer le devis envoyé le 15/10', leadId: 'lead-4', done: false, createdDate: '2026-10-15' },
  { id: 'task-3', dueDate: '2026-10-22', title: 'Rappeler pour le retour sur les échantillons', leadId: 'lead-3', done: false, createdDate: '2026-10-16' },
  { id: 'task-4', dueDate: '2026-10-23', title: 'Premier appel et prise de rendez-vous', leadId: 'lead-1', done: false, createdDate: '2026-10-21' },
  { id: 'task-5', dueDate: '2026-10-24', title: 'Envoyer une proposition à −6 % avec livraison offerte', leadId: 'lead-5', done: false, createdDate: '2026-10-18' },
  { id: 'task-6', dueDate: '2026-10-27', title: 'Relancer le devis gel + gants', customerId: 'cli-3', done: false, createdDate: '2026-10-21' }
];
