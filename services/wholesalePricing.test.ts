import { describe, expect, it } from 'vitest';
import {
  addDays,
  applyStatusChange,
  buildLine,
  checkOrder,
  computeTotals,
  nextNumber,
  round2,
  tierFor,
  todayISO,
  unitPriceFor
} from './wholesalePricing';
import {
  DEFAULT_WHOLESALE_SETTINGS,
  MOCK_WHOLESALE_CUSTOMERS,
  MOCK_WHOLESALE_ORDERS,
  MOCK_WHOLESALE_PRODUCTS
} from '../constants';
import { OrderStatus, WholesaleOrder } from '../types';

const settings = DEFAULT_WHOLESALE_SETTINGS;
const detergent = MOCK_WHOLESALE_PRODUCTS.find(p => p.id === 'prd-1')!; // 16,90 / 15,50 dès 10 / 13,90 dès 50
const reseller = MOCK_WHOLESALE_CUSTOMERS.find(c => c.id === 'cli-1')!;  // remise 10 %, 45 jours

const quote = (overrides: Partial<WholesaleOrder> = {}): WholesaleOrder => ({
  id: 'ord-test',
  number: 'CMD-2026-0099',
  customerId: reseller.id,
  customerName: reseller.companyName,
  date: '2026-10-22',
  status: OrderStatus.QUOTE,
  lines: [buildLine(detergent, 20, reseller)],
  history: [{ date: '2026-10-22', status: OrderStatus.QUOTE }],
  ...overrides
});

describe('round2', () => {
  it('arrondit au centime, 0,5 vers le haut, malgré la virgule flottante', () => {
    expect(round2(25.5 * 0.95)).toBe(24.23); // 24.224999…
    expect(round2(1.005)).toBe(1.01);
    expect(round2(-1.005)).toBe(-1.01);
    expect(round2(0)).toBe(0);
  });
});

describe('prix par palier', () => {
  it('applique le palier atteint par la quantité', () => {
    expect(tierFor(detergent, 1).unitPrice).toBe(16.9);
    expect(tierFor(detergent, 9).unitPrice).toBe(16.9);
    expect(tierFor(detergent, 10).unitPrice).toBe(15.5);
    expect(tierFor(detergent, 49).unitPrice).toBe(15.5);
    expect(tierFor(detergent, 50).unitPrice).toBe(13.9);
  });

  it('ignore l’ordre de saisie des paliers', () => {
    const shuffled = { ...detergent, tiers: [...detergent.tiers].reverse() };
    expect(tierFor(shuffled, 12).unitPrice).toBe(15.5);
  });

  it('applique la remise client sur le prix du palier', () => {
    expect(unitPriceFor(detergent, 50, 10)).toBe(12.51);
    expect(buildLine(detergent, 50, reseller).unitPrice).toBe(12.51);
  });
});

describe('totaux', () => {
  it('ajoute les frais de port sous le franco, TVA comprise', () => {
    // 10 × 15,50 = 155,00 HT < 300 → port 25 € HT
    const totals = computeTotals([buildLine(detergent, 10)], settings);
    expect(totals.subtotalHT).toBe(155);
    expect(totals.shippingHT).toBe(25);
    expect(totals.totalHT).toBe(180);
    expect(totals.totalVAT).toBe(36);
    expect(totals.totalTTC).toBe(216);
    expect(totals.missingForFranco).toBe(145);
  });

  it('offre le port à partir du franco', () => {
    const totals = computeTotals([buildLine(detergent, 20)], settings); // 310 HT
    expect(totals.francoReached).toBe(true);
    expect(totals.shippingHT).toBe(0);
    expect(totals.totalTTC).toBe(372);
  });

  it('calcule la marge sur les marchandises', () => {
    const totals = computeTotals([buildLine(detergent, 20)], settings);
    expect(totals.costHT).toBe(196);    // 20 × 9,80
    expect(totals.marginHT).toBe(114);  // 310 − 196
    expect(totals.marginRate).toBe(36.77);
  });

  it('regroupe la TVA par taux', () => {
    const reduced = { ...buildLine(detergent, 20), vatRate: 5.5 };
    const totals = computeTotals([buildLine(detergent, 10), reduced], settings);
    expect(totals.vat).toEqual([
      { rate: 5.5, base: 310, vat: 17.05 },
      { rate: 20, base: 155, vat: 31 }
    ]);
  });

  it('ne facture pas de port sur une commande vide', () => {
    expect(computeTotals([], settings).shippingHT).toBe(0);
  });
});

describe('contrôles de commande', () => {
  it('bloque une commande sous le minimum', () => {
    const issues = checkOrder([buildLine(detergent, 2)], MOCK_WHOLESALE_PRODUCTS, settings);
    expect(issues.some(i => i.blocking && i.message.includes('Minimum'))).toBe(true);
  });

  it('bloque si le stock ne suffit pas, en cumulant les lignes du même produit', () => {
    const lines = [buildLine(detergent, 100), buildLine(detergent, 41)]; // 141 > 140
    const issues = checkOrder(lines, MOCK_WHOLESALE_PRODUCTS, settings);
    expect(issues.some(i => i.blocking && i.message.includes('stock insuffisant'))).toBe(true);
  });

  it('signale sans bloquer une marge trop faible', () => {
    const issues = checkOrder([buildLine(detergent, 50, reseller)], MOCK_WHOLESALE_PRODUCTS, settings);
    expect(issues).toHaveLength(1);
    expect(issues[0].blocking).toBe(false);
    expect(issues[0].message).toContain('marge');
  });

  it('refuse les quantités non entières', () => {
    const issues = checkOrder([buildLine(detergent, 12.5)], MOCK_WHOLESALE_PRODUCTS, settings);
    expect(issues.some(i => i.blocking && i.message.includes('entier'))).toBe(true);
  });
});

describe('cycle de vie', () => {
  const ctx = {
    products: MOCK_WHOLESALE_PRODUCTS,
    orders: MOCK_WHOLESALE_ORDERS,
    customer: reseller,
    settings,
    today: '2026-10-22'
  };
  const stockOf = (products: typeof MOCK_WHOLESALE_PRODUCTS) => products.find(p => p.id === 'prd-1')!.stock;

  it('sort le stock à la confirmation et le rend à l’annulation', () => {
    const confirmed = applyStatusChange(quote(), OrderStatus.CONFIRMED, ctx);
    expect(stockOf(confirmed.products)).toBe(120);
    expect(confirmed.order.history.at(-1)).toEqual({ date: '2026-10-22', status: OrderStatus.CONFIRMED });

    const canceled = applyStatusChange(confirmed.order, OrderStatus.CANCELED, { ...ctx, products: confirmed.products });
    expect(stockOf(canceled.products)).toBe(140);
  });

  it('ne touche pas au stock en annulant un devis', () => {
    const canceled = applyStatusChange(quote(), OrderStatus.CANCELED, ctx);
    expect(stockOf(canceled.products)).toBe(140);
  });

  it('refuse un passage non prévu', () => {
    expect(() => applyStatusChange(quote(), OrderStatus.INVOICED, ctx)).toThrow('Passage impossible');
  });

  it('refuse de confirmer sans stock', () => {
    const big = quote({ lines: [buildLine(detergent, 500, reseller)] });
    expect(() => applyStatusChange(big, OrderStatus.CONFIRMED, ctx)).toThrow('stock insuffisant');
  });

  it('numérote la facture à la suite et calcule l’échéance', () => {
    const delivered = quote({ status: OrderStatus.DELIVERED });
    const { order } = applyStatusChange(delivered, OrderStatus.INVOICED, ctx);
    expect(order.invoiceNumber).toBe('FAC-G-2026-0002');
    expect(order.invoiceDate).toBe('2026-10-22');
    expect(order.dueDate).toBe('2026-12-06'); // + 45 jours
  });
});

describe('outils', () => {
  it('numérote par préfixe et par année', () => {
    expect(nextNumber('CMD', ['CMD-2026-0001', 'CMD-2026-0007', 'CMD-2025-0042'], 2026)).toBe('CMD-2026-0008');
    expect(nextNumber('CMD', ['CMD-2025-0042'], 2026)).toBe('CMD-2026-0001');
    expect(nextNumber('FAC-G', [undefined, 'FAC-2026-0009'], 2026)).toBe('FAC-G-2026-0001');
  });

  it('ajoute des jours sans décalage de fuseau', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-15', 30)).toBe('2027-01-14');
  });

  it('donne la date locale', () => {
    expect(todayISO(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
  });
});
