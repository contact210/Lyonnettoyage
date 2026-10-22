
import {
  OrderLine,
  OrderStatus,
  PriceTier,
  StockMovement,
  StockMovementType,
  WholesaleCustomer,
  WholesaleOrder,
  WholesaleProduct,
  WholesaleSettings
} from '../types';

export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Les frais de livraison sont facturés au taux normal.
export const SHIPPING_VAT_RATE = 20;

// Arrondi commercial au centime (0,5 vers le haut), robuste aux erreurs de virgule flottante.
export const round2 = (n: number) => {
  const scaled = n * 100;
  return (Math.sign(scaled) * Math.round(Math.abs(scaled) + 1e-9)) / 100;
};

// Coûts unitaires gardés à 4 décimales pour que le CMP ne dérive pas au fil des réceptions.
export const round4 = (n: number) => Math.round(n * 10000) / 10000;

// Coût moyen pondéré après une entrée de `quantity` unités au coût `unitCost`.
export const weightedAverageCost = (stock: number, currentCost: number, quantity: number, unitCost: number) => {
  const before = Math.max(stock, 0);
  if (before + quantity <= 0) return round4(unitCost);
  return round4((before * currentCost + quantity * unitCost) / (before + quantity));
};

export const formatEUR = (n: number) =>
  n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

export const formatDate = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR') : '—';

// Date du jour en heure locale (toISOString() donnerait la veille après minuit à Lyon).
export const todayISO = (now: Date = new Date()) => {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
};

export const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

// --- Prix -------------------------------------------------------------------

export const sortedTiers = (product: WholesaleProduct): PriceTier[] =>
  [...product.tiers].sort((a, b) => a.minQty - b.minQty);

export const tierFor = (product: WholesaleProduct, quantity: number): PriceTier => {
  const tiers = sortedTiers(product);
  let current = tiers[0];
  for (const tier of tiers) {
    if (quantity >= tier.minQty) current = tier;
  }
  return current;
};

export const nextTier = (product: WholesaleProduct, quantity: number): PriceTier | undefined =>
  sortedTiers(product).find(t => t.minQty > quantity);

export const basePrice = (product: WholesaleProduct) => sortedTiers(product)[0]?.unitPrice ?? 0;

export const unitPriceFor = (product: WholesaleProduct, quantity: number, discountRate = 0) =>
  round2(tierFor(product, quantity).unitPrice * (1 - discountRate / 100));

export const buildLine = (
  product: WholesaleProduct,
  quantity: number,
  customer?: WholesaleCustomer
): OrderLine => ({
  productId: product.id,
  sku: product.sku,
  label: `${product.name} — ${product.packaging}`,
  quantity,
  unitPrice: unitPriceFor(product, quantity, customer?.discountRate ?? 0),
  unitCost: product.costPrice,
  vatRate: product.vatRate
});

// Marge en % du prix de vente HT.
export const marginRate = (price: number, cost: number) =>
  price > 0 ? round2(((price - cost) / price) * 100) : 0;

// --- Totaux -----------------------------------------------------------------

export interface VatLine {
  rate: number;
  base: number;
  vat: number;
}

export interface OrderTotals {
  subtotalHT: number;
  shippingHT: number;
  totalHT: number;
  vat: VatLine[];
  totalVAT: number;
  totalTTC: number;
  costHT: number;
  marginHT: number;
  marginRate: number;
  francoReached: boolean;
  missingForFranco: number;
}

export const lineTotalHT = (line: OrderLine) => round2(line.quantity * line.unitPrice);

export const computeTotals = (lines: OrderLine[], settings: WholesaleSettings): OrderTotals => {
  const subtotalHT = round2(lines.reduce((sum, l) => sum + lineTotalHT(l), 0));
  const francoReached = subtotalHT >= settings.francoThreshold;
  const shippingHT = lines.length === 0 || francoReached ? 0 : settings.shippingFee;

  // TVA calculée par taux sur la base cumulée, comme sur la facture.
  const bases = new Map<number, number>();
  lines.forEach(l => bases.set(l.vatRate, (bases.get(l.vatRate) ?? 0) + lineTotalHT(l)));
  if (shippingHT > 0) {
    bases.set(SHIPPING_VAT_RATE, (bases.get(SHIPPING_VAT_RATE) ?? 0) + shippingHT);
  }
  const vat = [...bases.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, base]) => ({ rate, base: round2(base), vat: round2((base * rate) / 100) }));

  const totalHT = round2(subtotalHT + shippingHT);
  const totalVAT = round2(vat.reduce((sum, v) => sum + v.vat, 0));
  const costHT = round2(lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0));
  const marginHT = round2(subtotalHT - costHT);

  return {
    subtotalHT,
    shippingHT,
    totalHT,
    vat,
    totalVAT,
    totalTTC: round2(totalHT + totalVAT),
    costHT,
    marginHT,
    marginRate: marginRate(subtotalHT, costHT),
    francoReached,
    missingForFranco: francoReached ? 0 : round2(settings.francoThreshold - subtotalHT)
  };
};

// --- Contrôles --------------------------------------------------------------

export interface OrderIssue {
  blocking: boolean; // bloque la confirmation (le devis reste enregistrable)
  message: string;
}

// Quantités demandées par produit (un produit peut apparaître sur plusieurs lignes).
const quantitiesByProduct = (lines: OrderLine[]) => {
  const map = new Map<string, number>();
  lines.forEach(l => map.set(l.productId, (map.get(l.productId) ?? 0) + l.quantity));
  return map;
};

export const checkOrder = (
  lines: OrderLine[],
  products: WholesaleProduct[],
  settings: WholesaleSettings,
  stockAlreadyReserved = false
): OrderIssue[] => {
  const issues: OrderIssue[] = [];
  if (lines.length === 0) {
    issues.push({ blocking: true, message: 'Ajoutez au moins un produit.' });
    return issues;
  }

  lines.forEach(l => {
    if (!Number.isInteger(l.quantity) || l.quantity <= 0) {
      issues.push({ blocking: true, message: `${l.sku} : la quantité doit être un nombre entier positif.` });
    }
    if (l.unitPrice < l.unitCost) {
      issues.push({ blocking: false, message: `${l.sku} : vendu sous le prix d'achat.` });
    } else if (marginRate(l.unitPrice, l.unitCost) < settings.minMarginRate) {
      issues.push({
        blocking: false,
        message: `${l.sku} : marge de ${marginRate(l.unitPrice, l.unitCost)} %, sous le minimum de ${settings.minMarginRate} %.`
      });
    }
  });

  const { subtotalHT } = computeTotals(lines, settings);
  if (subtotalHT < settings.minOrderHT) {
    issues.push({
      blocking: true,
      message: `Minimum de commande : ${formatEUR(settings.minOrderHT)} HT (actuellement ${formatEUR(subtotalHT)}).`
    });
  }

  if (!stockAlreadyReserved) {
    quantitiesByProduct(lines).forEach((qty, productId) => {
      const product = products.find(p => p.id === productId);
      if (!product) {
        issues.push({ blocking: true, message: `Produit introuvable (${productId}).` });
      } else if (product.stock < qty) {
        issues.push({
          blocking: true,
          message: `${product.sku} : stock insuffisant (${product.stock} disponibles, ${qty} demandés).`
        });
      }
    });
  }

  return issues;
};

// --- Cycle de vie de la commande -------------------------------------------

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.QUOTE]: [OrderStatus.CONFIRMED, OrderStatus.CANCELED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARED, OrderStatus.CANCELED],
  [OrderStatus.PREPARED]: [OrderStatus.DELIVERED, OrderStatus.CANCELED],
  [OrderStatus.DELIVERED]: [OrderStatus.INVOICED],
  [OrderStatus.INVOICED]: [OrderStatus.PAID],
  [OrderStatus.PAID]: [],
  [OrderStatus.CANCELED]: []
};

// Le stock sort dès la confirmation et revient si la commande est annulée.
export const holdsStock = (status: OrderStatus) =>
  status === OrderStatus.CONFIRMED ||
  status === OrderStatus.PREPARED ||
  status === OrderStatus.DELIVERED ||
  status === OrderStatus.INVOICED ||
  status === OrderStatus.PAID;

export const isOverdue = (order: WholesaleOrder, today: string) =>
  order.status === OrderStatus.INVOICED && !!order.dueDate && order.dueDate < today;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Numérotation continue par année : PREFIX-2026-0001, PREFIX-2026-0002…
export const nextNumber = (prefix: string, existing: (string | undefined)[], year: number) => {
  const re = new RegExp(`^${escapeRegExp(prefix)}-${year}-(\\d+)$`);
  const max = existing.reduce((m, n) => {
    const match = n ? re.exec(n) : null;
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(4, '0')}`;
};

export const ORDER_PREFIX = 'CMD';
export const INVOICE_PREFIX = 'FAC-G';

export const applyStatusChange = (
  order: WholesaleOrder,
  to: OrderStatus,
  ctx: {
    products: WholesaleProduct[];
    orders: WholesaleOrder[];
    customer?: WholesaleCustomer;
    settings: WholesaleSettings;
    today: string;
  }
): { order: WholesaleOrder; products: WholesaleProduct[]; movements: StockMovement[] } => {
  const from = order.status;
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`Passage impossible de « ${from} » à « ${to} ».`);
  }

  let products = ctx.products;
  let lines = order.lines;
  const movements: StockMovement[] = [];
  const qty = quantitiesByProduct(order.lines);
  const movement = (p: WholesaleProduct, type: StockMovementType, quantity: number, unitCost: number): StockMovement => ({
    id: newId('mvt'),
    date: ctx.today,
    productId: p.id,
    sku: p.sku,
    type,
    quantity,
    unitCost,
    stockAfter: p.stock,
    reference: order.number
  });

  if (!holdsStock(from) && holdsStock(to)) {
    const blocking = checkOrder(order.lines, products, ctx.settings).filter(i => i.blocking);
    if (blocking.length > 0) throw new Error(blocking.map(i => i.message).join('\n'));
    // Le coût des ventes est figé au CMP du jour de la sortie de stock.
    lines = lines.map(l => {
      const p = products.find(x => x.id === l.productId);
      return p ? { ...l, unitCost: p.costPrice } : l;
    });
    products = products.map(p => {
      if (!qty.has(p.id)) return p;
      const out = { ...p, stock: p.stock - qty.get(p.id)! };
      movements.push(movement(out, StockMovementType.SALE, -qty.get(p.id)!, p.costPrice));
      return out;
    });
  } else if (holdsStock(from) && !holdsStock(to)) {
    // Retour en stock au coût de sortie, qui entre dans le CMP.
    products = products.map(p => {
      if (!qty.has(p.id)) return p;
      const back = qty.get(p.id)!;
      const own = lines.filter(l => l.productId === p.id);
      const cost = round4(own.reduce((s, l) => s + l.quantity * l.unitCost, 0) / back);
      const updated = { ...p, stock: p.stock + back, costPrice: weightedAverageCost(p.stock, p.costPrice, back, cost) };
      movements.push(movement(updated, StockMovementType.SALE_CANCEL, back, cost));
      return updated;
    });
  }

  const updated: WholesaleOrder = {
    ...order,
    lines,
    status: to,
    history: [...order.history, { date: ctx.today, status: to }]
  };

  if (to === OrderStatus.DELIVERED && !updated.deliveryDate) {
    updated.deliveryDate = ctx.today;
  }

  if (to === OrderStatus.INVOICED) {
    const year = Number(ctx.today.slice(0, 4));
    updated.invoiceNumber = nextNumber(INVOICE_PREFIX, ctx.orders.map(o => o.invoiceNumber), year);
    updated.invoiceDate = ctx.today;
    updated.dueDate = addDays(ctx.today, ctx.customer?.paymentTermsDays ?? 30);
  }

  if (to === OrderStatus.PAID) {
    updated.paidDate = ctx.today;
  }

  return { order: updated, products, movements };
};
