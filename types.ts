
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

// ---------------------------------------------------------------------------
// Vente en gros (B2B) de produits d'entretien
// ---------------------------------------------------------------------------

export type ProductCategory =
  | 'Sols'
  | 'Sanitaires'
  | 'Vitres'
  | 'Désinfection'
  | 'Hygiène'
  | 'Consommables'
  | 'Matériel';

export interface PriceTier {
  minQty: number;    // à partir de cette quantité
  unitPrice: number; // € HT par unité de vente
}

export interface WholesaleProduct {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  packaging: string;  // unité de vente, ex : "Bidon 5 L"
  costPrice: number;  // coût moyen pondéré (CMP) HT, recalculé à chaque réception
  tiers: PriceTier[]; // le premier palier (minQty 1) est le prix de base
  vatRate: number;
  stock: number;      // disponible à la vente (les commandes confirmées sont déjà déduites)
  minStock: number;
  active: boolean;
  supplierId?: string;        // fournisseur principal
  lastPurchasePrice?: number; // dernier prix d'achat HT payé
}

export enum CustomerSegment {
  RESELLER = 'Revendeur',
  COMPANY = 'Entreprise',
  PUBLIC = 'Collectivité'
}

export interface WholesaleCustomer {
  id: string;
  companyName: string;
  siret: string;
  tvaIntra: string;
  address: string;
  contactName: string;
  email: string;
  phone: string;
  segment: CustomerSegment;
  discountRate: number;     // remise négociée en %
  paymentTermsDays: number;
}

export enum OrderStatus {
  QUOTE = 'Devis',
  CONFIRMED = 'Confirmée',
  PREPARED = 'Préparée',
  DELIVERED = 'Livrée',
  INVOICED = 'Facturée',
  PAID = 'Payée',
  CANCELED = 'Annulée'
}

export interface OrderLine {
  productId: string;
  sku: string;
  label: string;
  quantity: number;
  unitPrice: number; // € HT figé au moment de la commande (palier + remise)
  unitCost: number;  // prix d'achat HT figé, pour la marge
  vatRate: number;
}

export interface OrderEvent {
  date: string;
  status: OrderStatus;
}

export interface WholesaleOrder {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  date: string;
  deliveryDate?: string;
  status: OrderStatus;
  lines: OrderLine[];
  notes?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  paidDate?: string;
  history: OrderEvent[];
}

export interface WholesaleSettings {
  francoThreshold: number; // franco de port à partir de ce montant HT
  shippingFee: number;     // frais de livraison HT sous le franco
  minOrderHT: number;      // minimum de commande HT
  minMarginRate: number;   // marge minimale en % du prix de vente
}

export interface Supplier {
  id: string;
  companyName: string;
  siret: string;
  tvaIntra: string;
  address: string;
  contactName: string;
  email: string;
  phone: string;
  paymentTermsDays: number;
  leadTimeDays: number; // délai de livraison habituel
}

export enum PurchaseStatus {
  DRAFT = 'Brouillon',
  ORDERED = 'Commandée',
  PARTIAL = 'Reçue en partie',
  RECEIVED = 'Reçue',
  CANCELED = 'Annulée'
}

export interface PurchaseLine {
  productId: string;
  sku: string;
  label: string;
  quantity: number;
  unitCost: number; // prix d'achat HT négocié
  vatRate: number;
  receivedQty: number;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDate?: string;
  status: PurchaseStatus;
  lines: PurchaseLine[];
  shippingHT: number; // frais de port facturés par le fournisseur, répartis dans le coût de revient
  notes?: string;
  receivedDate?: string;
  supplierInvoiceRef?: string;
  dueDate?: string;
  paidDate?: string;
  history: { date: string; status: PurchaseStatus }[];
}

export enum StockMovementType {
  INITIAL = 'Stock initial',
  PURCHASE = 'Réception achat',
  SALE = 'Sortie vente',
  SALE_CANCEL = 'Retour (vente annulée)',
  COUNT = 'Inventaire',
  LOSS = 'Perte / casse',
  ADJUSTMENT = 'Ajustement'
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  sku: string;
  type: StockMovementType;
  quantity: number;   // + entrée, − sortie
  unitCost: number;   // valorisation HT du mouvement
  stockAfter: number; // stock disponible après le mouvement
  reference?: string; // n° de commande ou d'achat
  note?: string;
}

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

export enum LeadStage {
  NEW = 'Nouveau',
  CONTACTED = 'Contacté',
  MEETING = 'Visite / échantillon',
  PROPOSAL = 'Devis envoyé',
  NEGOTIATION = 'Négociation',
  WON = 'Gagné',
  LOST = 'Perdu'
}

export type LeadSource =
  | 'Site web'
  | 'Google'
  | 'Téléphone'
  | 'Recommandation'
  | 'Salon'
  | 'Prospection'
  | 'Réseaux sociaux'
  | 'Autre';

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  segment: CustomerSegment;
  source: LeadSource;
  stage: LeadStage;
  estimatedMonthlyHT: number; // achats mensuels estimés du prospect
  createdDate: string;
  stageDate: string;          // entrée dans l'étape actuelle
  lostReason?: string;
  customerId?: string;        // client créé à la conversion
  notes?: string;
}

export enum ActivityType {
  CALL = 'Appel',
  EMAIL = 'E-mail',
  VISIT = 'Visite',
  SAMPLE = 'Échantillon',
  NOTE = 'Note'
}

export interface Activity {
  id: string;
  date: string;
  type: ActivityType;
  subject: string;
  notes?: string;
  leadId?: string;
  customerId?: string;
}

export interface CrmTask {
  id: string;
  dueDate: string;
  title: string;
  leadId?: string;
  customerId?: string;
  done: boolean;
  doneDate?: string;
  createdDate: string;
}
