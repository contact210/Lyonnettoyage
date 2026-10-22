
import {
  OrderStatus,
  PurchaseLine,
  PurchaseOrder,
  PurchaseStatus,
  StockMovement,
  StockMovementType,
  Supplier,
  WholesaleOrder,
  WholesaleProduct,
  WholesaleSettings
} from '../types';
import {
  SHIPPING_VAT_RATE,
  VatLine,
  addDays,
  computeTotals,
  lineTotalHT,
  marginRate,
  newId,
  nextNumber,
  round2,
  round4,
  weightedAverageCost
} from './wholesalePricing';

export const PURCHASE_PREFIX = 'ACH';

// --- Totaux d'achat ---------------------------------------------------------

export const purchaseLineTotal = (line: PurchaseLine) => round2(line.quantity * line.unitCost);

export interface PurchaseTotals {
  subtotalHT: number;
  shippingHT: number;
  totalHT: number;
  vat: VatLine[];
  totalVAT: number;
  totalTTC: number;
}

export const computePurchaseTotals = (po: Pick<PurchaseOrder, 'lines' | 'shippingHT'>): PurchaseTotals => {
  const subtotalHT = round2(po.lines.reduce((s, l) => s + purchaseLineTotal(l), 0));
  const bases = new Map<number, number>();
  po.lines.forEach(l => bases.set(l.vatRate, (bases.get(l.vatRate) ?? 0) + purchaseLineTotal(l)));
  if (po.shippingHT > 0) bases.set(SHIPPING_VAT_RATE, (bases.get(SHIPPING_VAT_RATE) ?? 0) + po.shippingHT);
  const vat = [...bases.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, base]) => ({ rate, base: round2(base), vat: round2((base * rate) / 100) }));
  const totalHT = round2(subtotalHT + po.shippingHT);
  const totalVAT = round2(vat.reduce((s, v) => s + v.vat, 0));
  return { subtotalHT, shippingHT: po.shippingHT, totalHT, vat, totalVAT, totalTTC: round2(totalHT + totalVAT) };
};

// Coût de revient unitaire : prix d'achat + part des frais de port au prorata de la valeur de la ligne.
export const landedUnitCost = (po: Pick<PurchaseOrder, 'lines' | 'shippingHT'>, lineIndex: number) => {
  const line = po.lines[lineIndex];
  const subtotal = po.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  if (po.shippingHT <= 0 || subtotal <= 0 || line.quantity <= 0) return round4(line.unitCost);
  const shippingShare = (po.shippingHT * (line.quantity * line.unitCost)) / subtotal;
  return round4(line.unitCost + shippingShare / line.quantity);
};

// --- Cycle de vie de l'achat ------------------------------------------------

export const remainingQty = (line: PurchaseLine) => Math.max(line.quantity - line.receivedQty, 0);

export const checkPurchase = (po: Pick<PurchaseOrder, 'lines' | 'shippingHT'>): string[] => {
  const problems: string[] = [];
  if (po.lines.length === 0) problems.push('Ajoutez au moins un produit.');
  po.lines.forEach(l => {
    if (!Number.isInteger(l.quantity) || l.quantity <= 0) problems.push(`${l.sku} : quantité entière positive attendue.`);
    if (!(l.unitCost >= 0)) problems.push(`${l.sku} : prix d'achat invalide.`);
  });
  if (!(po.shippingHT >= 0)) problems.push('Les frais de port doivent être positifs ou nuls.');
  return problems;
};

const withStatus = (po: PurchaseOrder, status: PurchaseStatus, today: string): PurchaseOrder => ({
  ...po,
  status,
  history: [...po.history, { date: today, status }]
});

export const markPurchaseOrdered = (po: PurchaseOrder, today: string) => {
  if (po.status !== PurchaseStatus.DRAFT) throw new Error('Seul un brouillon peut être commandé.');
  const problems = checkPurchase(po);
  if (problems.length) throw new Error(problems.join('\n'));
  return withStatus(po, PurchaseStatus.ORDERED, today);
};

export const cancelPurchase = (po: PurchaseOrder, today: string) => {
  if (po.status !== PurchaseStatus.DRAFT && po.status !== PurchaseStatus.ORDERED) {
    throw new Error('Un achat déjà réceptionné (même en partie) ne peut plus être annulé.');
  }
  return withStatus(po, PurchaseStatus.CANCELED, today);
};

// Réception (totale ou partielle) : le stock entre au coût de revient et le CMP est recalculé.
export const receivePurchase = (
  po: PurchaseOrder,
  received: number[], // quantité reçue par ligne, dans l'ordre des lignes
  ctx: { products: WholesaleProduct[]; supplier?: Supplier; today: string }
): { purchase: PurchaseOrder; products: WholesaleProduct[]; movements: StockMovement[] } => {
  if (po.status !== PurchaseStatus.ORDERED && po.status !== PurchaseStatus.PARTIAL) {
    throw new Error('Seul un achat commandé peut être réceptionné.');
  }
  po.lines.forEach((l, i) => {
    const q = received[i] ?? 0;
    if (!Number.isInteger(q) || q < 0) throw new Error(`${l.sku} : quantité reçue invalide.`);
    if (q > remainingQty(l)) throw new Error(`${l.sku} : ${q} reçus pour ${remainingQty(l)} attendus.`);
  });
  if (received.every(q => !q)) throw new Error('Indiquez au moins une quantité reçue.');

  let products = ctx.products;
  const movements: StockMovement[] = [];
  const lines = po.lines.map((l, i) => {
    const q = received[i] ?? 0;
    if (q === 0) return l;
    const cost = landedUnitCost(po, i);
    products = products.map(p => {
      if (p.id !== l.productId) return p;
      const updated = {
        ...p,
        stock: p.stock + q,
        costPrice: weightedAverageCost(p.stock, p.costPrice, q, cost),
        lastPurchasePrice: l.unitCost
      };
      movements.push({
        id: newId('mvt'),
        date: ctx.today,
        productId: p.id,
        sku: p.sku,
        type: StockMovementType.PURCHASE,
        quantity: q,
        unitCost: cost,
        stockAfter: updated.stock,
        reference: po.number
      });
      return updated;
    });
    return { ...l, receivedQty: l.receivedQty + q };
  });

  const complete = lines.every(l => remainingQty(l) === 0);
  let purchase = withStatus({ ...po, lines }, complete ? PurchaseStatus.RECEIVED : PurchaseStatus.PARTIAL, ctx.today);
  if (complete) {
    purchase = {
      ...purchase,
      receivedDate: ctx.today,
      dueDate: purchase.dueDate ?? addDays(ctx.today, ctx.supplier?.paymentTermsDays ?? 30)
    };
  }
  return { purchase, products, movements };
};

const assertReceived = (po: PurchaseOrder) => {
  if (po.status !== PurchaseStatus.RECEIVED && po.status !== PurchaseStatus.PARTIAL) {
    throw new Error("La facture fournisseur s'enregistre après la réception.");
  }
};

export const recordSupplierInvoice = (po: PurchaseOrder, invoice: { ref: string; dueDate: string }) => {
  assertReceived(po);
  if (!invoice.ref.trim()) throw new Error('Indiquez le numéro de la facture fournisseur.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoice.dueDate)) throw new Error("Indiquez la date d'échéance.");
  return { ...po, supplierInvoiceRef: invoice.ref.trim(), dueDate: invoice.dueDate };
};

export const markPurchasePaid = (po: PurchaseOrder, today: string) => {
  assertReceived(po);
  if (po.paidDate) throw new Error('Cet achat est déjà payé.');
  return { ...po, paidDate: today };
};

export const isPurchaseToPay = (po: PurchaseOrder) =>
  (po.status === PurchaseStatus.RECEIVED || po.status === PurchaseStatus.PARTIAL) && !po.paidDate;

// --- Stock -------------------------------------------------------------------

const sumBy = <T,>(items: T[], key: (t: T) => string, value: (t: T) => number) => {
  const map = new Map<string, number>();
  items.forEach(i => map.set(key(i), (map.get(key(i)) ?? 0) + value(i)));
  return map;
};

// Produits vendus (confirmés ou préparés) mais encore physiquement dans l'entrepôt.
export const reservedQuantities = (orders: WholesaleOrder[]) =>
  sumBy(
    orders.filter(o => o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.PREPARED).flatMap(o => o.lines),
    l => l.productId,
    l => l.quantity
  );

// Quantités commandées aux fournisseurs et pas encore reçues.
export const incomingQuantities = (purchases: PurchaseOrder[]) =>
  sumBy(
    purchases.filter(p => p.status === PurchaseStatus.ORDERED || p.status === PurchaseStatus.PARTIAL).flatMap(p => p.lines),
    l => l.productId,
    remainingQty
  );

export type AdjustmentKind = StockMovementType.COUNT | StockMovementType.LOSS | StockMovementType.ADJUSTMENT;

export const adjustStock = (
  product: WholesaleProduct,
  adjustment: { kind: AdjustmentKind; quantity: number; note?: string },
  ctx: { reserved: number; today: string }
): { product: WholesaleProduct; movement: StockMovement } => {
  const { kind, quantity } = adjustment;
  if (!Number.isInteger(quantity)) throw new Error('La quantité doit être un nombre entier.');

  let delta: number;
  if (kind === StockMovementType.COUNT) {
    // L'inventaire compte le stock physique, qui inclut les commandes pas encore livrées.
    if (quantity < 0) throw new Error('Le stock compté ne peut pas être négatif.');
    if (quantity < ctx.reserved) {
      throw new Error(
        `Stock compté (${quantity}) inférieur aux commandes à livrer (${ctx.reserved}). Vérifiez le comptage ou annulez une commande.`
      );
    }
    delta = quantity - (product.stock + ctx.reserved);
  } else if (kind === StockMovementType.LOSS) {
    if (quantity <= 0) throw new Error('Indiquez le nombre d’unités perdues ou cassées.');
    delta = -quantity;
  } else {
    if (quantity === 0) throw new Error('Indiquez une quantité à ajouter (+) ou à retirer (−).');
    if (!adjustment.note?.trim()) throw new Error('Précisez le motif de l’ajustement.');
    delta = quantity;
  }

  const stock = product.stock + delta;
  if (stock < 0) throw new Error(`Stock insuffisant : ${product.stock} disponibles.`);

  const updated = { ...product, stock };
  return {
    product: updated,
    movement: {
      id: newId('mvt'),
      date: ctx.today,
      productId: product.id,
      sku: product.sku,
      type: kind,
      quantity: delta,
      unitCost: product.costPrice,
      stockAfter: stock,
      note: adjustment.note?.trim() || undefined
    }
  };
};

export interface ReorderSuggestion {
  product: WholesaleProduct;
  incoming: number;
  quantity: number;
}

// Réappro quand disponible + en commande passe sous le seuil : on remonte à deux fois le seuil.
export const reorderSuggestions = (products: WholesaleProduct[], purchases: PurchaseOrder[]) => {
  const incoming = incomingQuantities(purchases);
  const bySupplier = new Map<string, ReorderSuggestion[]>();
  products
    .filter(p => p.active)
    .forEach(p => {
      const coming = incoming.get(p.id) ?? 0;
      if (p.stock + coming > p.minStock) return;
      const quantity = Math.max(p.minStock * 2 - p.stock - coming, 1);
      const key = p.supplierId ?? '';
      bySupplier.set(key, [...(bySupplier.get(key) ?? []), { product: p, incoming: coming, quantity }]);
    });
  return bySupplier;
};

export const draftPurchase = (
  supplier: Supplier,
  items: { product: WholesaleProduct; quantity: number }[],
  ctx: { purchases: PurchaseOrder[]; today: string }
): PurchaseOrder => ({
  id: newId('ach'),
  number: nextNumber(PURCHASE_PREFIX, ctx.purchases.map(p => p.number), Number(ctx.today.slice(0, 4))),
  supplierId: supplier.id,
  supplierName: supplier.companyName,
  date: ctx.today,
  expectedDate: addDays(ctx.today, supplier.leadTimeDays),
  status: PurchaseStatus.DRAFT,
  lines: items.map(({ product, quantity }) => ({
    productId: product.id,
    sku: product.sku,
    label: `${product.name} — ${product.packaging}`,
    quantity,
    unitCost: product.lastPurchasePrice ?? product.costPrice,
    vatRate: product.vatRate,
    receivedQty: 0
  })),
  shippingHT: 0,
  history: [{ date: ctx.today, status: PurchaseStatus.DRAFT }]
});

// --- Rentabilité --------------------------------------------------------------

export interface ProfitRow {
  id: string;
  label: string;
  quantity: number;
  revenueHT: number;
  costHT: number;
  marginHT: number;
  marginRate: number;
}

// Ventes engagées (confirmées jusqu'à payées) sur la période, par produit ou par client.
export const profitability = (
  orders: WholesaleOrder[],
  by: 'product' | 'customer',
  period: { from?: string; to?: string } = {}
): ProfitRow[] => {
  const rows = new Map<string, ProfitRow>();
  orders
    .filter(o => o.status !== OrderStatus.QUOTE && o.status !== OrderStatus.CANCELED)
    .filter(o => (!period.from || o.date >= period.from) && (!period.to || o.date <= period.to))
    .forEach(o =>
      o.lines.forEach(l => {
        const id = by === 'product' ? l.productId : o.customerId;
        const label = by === 'product' ? l.label : o.customerName;
        const row = rows.get(id) ?? { id, label, quantity: 0, revenueHT: 0, costHT: 0, marginHT: 0, marginRate: 0 };
        row.quantity += l.quantity;
        row.revenueHT += lineTotalHT(l);
        row.costHT += l.quantity * l.unitCost;
        rows.set(id, row);
      })
    );
  return [...rows.values()]
    .map(r => ({
      ...r,
      revenueHT: round2(r.revenueHT),
      costHT: round2(r.costHT),
      marginHT: round2(r.revenueHT - r.costHT),
      marginRate: marginRate(r.revenueHT, r.costHT)
    }))
    .sort((a, b) => b.marginHT - a.marginHT);
};

// Frais de port facturés aux clients sur la période (hors marchandises).
export const shippingRevenue = (orders: WholesaleOrder[], settings: WholesaleSettings, period: { from?: string; to?: string } = {}) =>
  round2(
    orders
      .filter(o => o.status !== OrderStatus.QUOTE && o.status !== OrderStatus.CANCELED)
      .filter(o => (!period.from || o.date >= period.from) && (!period.to || o.date <= period.to))
      .reduce((s, o) => s + computeTotals(o.lines, settings).shippingHT, 0)
  );
