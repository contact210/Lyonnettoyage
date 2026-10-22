
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
  costPrice: number;  // prix d'achat HT
  tiers: PriceTier[]; // le premier palier (minQty 1) est le prix de base
  vatRate: number;
  stock: number;
  minStock: number;
  active: boolean;
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
  history: OrderEvent[];
}

export interface WholesaleSettings {
  francoThreshold: number; // franco de port à partir de ce montant HT
  shippingFee: number;     // frais de livraison HT sous le franco
  minOrderHT: number;      // minimum de commande HT
  minMarginRate: number;   // marge minimale en % du prix de vente
}
