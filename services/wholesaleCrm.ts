
import {
  CrmTask,
  Lead,
  LeadSource,
  LeadStage,
  OrderStatus,
  WholesaleCustomer,
  WholesaleOrder,
  WholesaleSettings
} from '../types';
import { computeTotals, isOverdue, newId, round2 } from './wholesalePricing';

// --- Funnel ------------------------------------------------------------------

export const OPEN_STAGES: LeadStage[] = [
  LeadStage.NEW,
  LeadStage.CONTACTED,
  LeadStage.MEETING,
  LeadStage.PROPOSAL,
  LeadStage.NEGOTIATION
];

// Probabilité de signature par étape, pour pondérer le potentiel du pipeline.
export const STAGE_PROBABILITY: Record<LeadStage, number> = {
  [LeadStage.NEW]: 10,
  [LeadStage.CONTACTED]: 20,
  [LeadStage.MEETING]: 40,
  [LeadStage.PROPOSAL]: 60,
  [LeadStage.NEGOTIATION]: 80,
  [LeadStage.WON]: 100,
  [LeadStage.LOST]: 0
};

export const LEAD_SOURCES: LeadSource[] = [
  'Site web',
  'Google',
  'Téléphone',
  'Recommandation',
  'Salon',
  'Prospection',
  'Réseaux sociaux',
  'Autre'
];

export const daysBetween = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000);

export const moveLead = (lead: Lead, to: LeadStage, today: string, lostReason?: string): Lead => {
  if (lead.stage === LeadStage.WON) throw new Error('Ce prospect est déjà devenu client.');
  if (to === LeadStage.WON) throw new Error('Utilisez « Convertir en client » pour gagner un prospect.');
  if (to === LeadStage.LOST && !lostReason?.trim()) throw new Error('Indiquez pourquoi le prospect est perdu.');
  if (to === lead.stage) return lead;
  return {
    ...lead,
    stage: to,
    stageDate: today,
    lostReason: to === LeadStage.LOST ? lostReason!.trim() : undefined
  };
};

// Conversion : crée la fiche client à partir du prospect et le marque « Gagné ».
export const convertLead = (
  lead: Lead,
  details: { siret: string; tvaIntra?: string; discountRate: number; paymentTermsDays: number },
  ctx: { customers: WholesaleCustomer[]; today: string }
): { lead: Lead; customer: WholesaleCustomer } => {
  if (lead.stage === LeadStage.WON) throw new Error('Ce prospect est déjà devenu client.');
  if (lead.stage === LeadStage.LOST) throw new Error('Rouvrez le prospect avant de le convertir.');
  const siret = details.siret.replace(/\s/g, '');
  if (!/^\d{14}$/.test(siret)) throw new Error('Le SIRET doit compter 14 chiffres.');
  if (ctx.customers.some(c => c.siret.replace(/\s/g, '') === siret)) throw new Error('Un client avec ce SIRET existe déjà.');
  if (!lead.address.trim()) throw new Error("L'adresse de facturation est obligatoire.");
  if (!(details.discountRate >= 0 && details.discountRate <= 50)) throw new Error('La remise doit être comprise entre 0 et 50 %.');
  if (details.paymentTermsDays < 0 || details.paymentTermsDays > 60) throw new Error('Délai de paiement : 60 jours maximum.');

  const tva = (details.tvaIntra ?? '').replace(/\s/g, '').toUpperCase();
  const customer: WholesaleCustomer = {
    id: newId('cli'),
    companyName: lead.companyName,
    siret: siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, '$1 $2 $3 $4'),
    tvaIntra: tva.replace(/^FR(\w{2})(\d{9})$/, 'FR $1 $2'),
    address: lead.address,
    contactName: lead.contactName,
    email: lead.email,
    phone: lead.phone,
    segment: lead.segment,
    discountRate: details.discountRate,
    paymentTermsDays: details.paymentTermsDays
  };
  return {
    lead: { ...lead, stage: LeadStage.WON, stageDate: ctx.today, customerId: customer.id, lostReason: undefined },
    customer
  };
};

export interface StageSummary {
  stage: LeadStage;
  count: number;
  monthlyHT: number;
  weightedHT: number;
}

export const pipelineSummary = (leads: Lead[]): StageSummary[] =>
  Object.values(LeadStage).map(stage => {
    const inStage = leads.filter(l => l.stage === stage);
    const monthlyHT = round2(inStage.reduce((s, l) => s + l.estimatedMonthlyHT, 0));
    return { stage, count: inStage.length, monthlyHT, weightedHT: round2((monthlyHT * STAGE_PROBABILITY[stage]) / 100) };
  });

// Potentiel mensuel pondéré des prospects encore ouverts.
export const weightedPipeline = (leads: Lead[]) =>
  round2(pipelineSummary(leads).filter(s => OPEN_STAGES.includes(s.stage)).reduce((s, x) => s + x.weightedHT, 0));

export const conversionRate = (leads: Lead[]) => {
  const won = leads.filter(l => l.stage === LeadStage.WON).length;
  const lost = leads.filter(l => l.stage === LeadStage.LOST).length;
  return won + lost === 0 ? null : round2((won / (won + lost)) * 100);
};

export const sourceStats = (leads: Lead[]) =>
  LEAD_SOURCES.map(source => {
    const list = leads.filter(l => l.source === source);
    return { source, count: list.length, won: list.filter(l => l.stage === LeadStage.WON).length, rate: conversionRate(list) };
  }).filter(s => s.count > 0);

// --- Tâches -------------------------------------------------------------------

export const taskBuckets = (tasks: CrmTask[], today: string) => {
  const open = tasks.filter(t => !t.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const in7 = new Date(`${today}T00:00:00Z`);
  in7.setUTCDate(in7.getUTCDate() + 7);
  const week = in7.toISOString().slice(0, 10);
  return {
    overdue: open.filter(t => t.dueDate < today),
    today: open.filter(t => t.dueDate === today),
    week: open.filter(t => t.dueDate > today && t.dueDate <= week),
    later: open.filter(t => t.dueDate > week)
  };
};

export const completeTask = (task: CrmTask, today: string): CrmTask => ({ ...task, done: true, doneDate: today });

export const nextTaskFor = (tasks: CrmTask[], ref: { leadId?: string; customerId?: string }) =>
  tasks
    .filter(t => !t.done && ((ref.leadId && t.leadId === ref.leadId) || (ref.customerId && t.customerId === ref.customerId)))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

// --- Clients -----------------------------------------------------------------

export type CustomerHealth = 'Sans commande' | 'Actif' | 'À relancer' | 'Inactif';

export interface CustomerInsights {
  orderCount: number;
  firstOrder?: string;
  lastOrder?: string;
  revenueHT: number;      // ventes engagées (confirmées à payées), marchandises + port
  marginHT: number;
  averageBasketHT: number;
  averageIntervalDays?: number;
  daysSinceLast?: number;
  dueTTC: number;         // factures émises non payées
  overdueTTC: number;
  openQuotes: number;
  health: CustomerHealth;
}

const DEFAULT_INTERVAL = 30;

export const customerInsights = (
  customerId: string,
  orders: WholesaleOrder[],
  settings: WholesaleSettings,
  today: string
): CustomerInsights => {
  const own = orders.filter(o => o.customerId === customerId);
  const sold = own
    .filter(o => o.status !== OrderStatus.QUOTE && o.status !== OrderStatus.CANCELED)
    .sort((a, b) => a.date.localeCompare(b.date));
  const totals = sold.map(o => computeTotals(o.lines, settings));
  const revenueHT = round2(totals.reduce((s, t) => s + t.totalHT, 0));
  const dates = sold.map(o => o.date);
  const intervals = dates.slice(1).map((d, i) => daysBetween(dates[i], d));
  const averageIntervalDays = intervals.length ? Math.round(intervals.reduce((s, x) => s + x, 0) / intervals.length) : undefined;
  const lastOrder = dates.at(-1);
  const daysSinceLast = lastOrder ? daysBetween(lastOrder, today) : undefined;

  const invoiced = own.filter(o => o.status === OrderStatus.INVOICED);
  const ttc = (o: WholesaleOrder) => computeTotals(o.lines, settings).totalTTC;

  // Rythme habituel du client (30 jours par défaut) : relance à 1,5 fois, inactif à 3 fois.
  const rhythm = Math.max(averageIntervalDays ?? DEFAULT_INTERVAL, 14);
  let health: CustomerHealth = 'Sans commande';
  if (daysSinceLast !== undefined) {
    health = daysSinceLast > rhythm * 3 ? 'Inactif' : daysSinceLast > rhythm * 1.5 ? 'À relancer' : 'Actif';
  }

  return {
    orderCount: sold.length,
    firstOrder: dates[0],
    lastOrder,
    revenueHT,
    marginHT: round2(totals.reduce((s, t) => s + t.marginHT, 0)),
    averageBasketHT: sold.length ? round2(revenueHT / sold.length) : 0,
    averageIntervalDays,
    daysSinceLast,
    dueTTC: round2(invoiced.reduce((s, o) => s + ttc(o), 0)),
    overdueTTC: round2(invoiced.filter(o => isOverdue(o, today)).reduce((s, o) => s + ttc(o), 0)),
    openQuotes: own.filter(o => o.status === OrderStatus.QUOTE).length,
    health
  };
};

// Devis sans réponse à relancer : à J+3, puis à J+7 et au-delà.
export const quotesToChase = (orders: WholesaleOrder[], today: string) =>
  orders
    .filter(o => o.status === OrderStatus.QUOTE)
    .map(o => ({ order: o, age: daysBetween(o.date, today) }))
    .filter(x => x.age >= 3)
    .map(x => ({ ...x, level: x.age >= 7 ? ('J+7' as const) : ('J+3' as const) }))
    .sort((a, b) => b.age - a.age);

export const customersToReactivate = (
  customers: WholesaleCustomer[],
  orders: WholesaleOrder[],
  settings: WholesaleSettings,
  today: string
) =>
  customers
    .map(c => ({ customer: c, insights: customerInsights(c.id, orders, settings, today) }))
    .filter(x => x.insights.health === 'À relancer' || x.insights.health === 'Inactif')
    .sort((a, b) => (b.insights.daysSinceLast ?? 0) - (a.insights.daysSinceLast ?? 0));
