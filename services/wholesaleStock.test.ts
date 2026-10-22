import { describe, expect, it } from 'vitest';
import {
  adjustStock,
  cancelPurchase,
  computePurchaseTotals,
  draftPurchase,
  incomingQuantities,
  landedUnitCost,
  markPurchaseOrdered,
  markPurchasePaid,
  profitability,
  receivePurchase,
  recordSupplierInvoice,
  reorderSuggestions,
  reservedQuantities
} from './wholesaleStock';
import { applyStatusChange, buildLine, weightedAverageCost } from './wholesalePricing';
import {
  DEFAULT_WHOLESALE_SETTINGS,
  MOCK_PURCHASES,
  MOCK_STOCK_MOVEMENTS,
  MOCK_SUPPLIERS,
  MOCK_WHOLESALE_CUSTOMERS,
  MOCK_WHOLESALE_ORDERS,
  MOCK_WHOLESALE_PRODUCTS
} from '../constants';
import { OrderStatus, PurchaseOrder, PurchaseStatus, StockMovementType, WholesaleOrder } from '../types';

const today = '2026-10-22';
const product = (id: string) => MOCK_WHOLESALE_PRODUCTS.find(p => p.id === id)!;
const detergent = product('prd-1'); // stock 140, CMP 9,80
const bags = product('prd-9');      // stock 8, seuil 15, fournisseur sup-2
const supplier = MOCK_SUPPLIERS.find(s => s.id === 'sup-1')!; // paiement 45 jours

const ordered = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: 'ach-test',
  number: 'ACH-2026-0099',
  supplierId: supplier.id,
  supplierName: supplier.companyName,
  date: today,
  status: PurchaseStatus.ORDERED,
  lines: [
    { productId: 'prd-1', sku: 'SOL-NEU-5L', label: 'Détergent', quantity: 60, unitCost: 11, vatRate: 20, receivedQty: 0 },
    { productId: 'prd-2', sku: 'DEG-SUP-5L', label: 'Dégraissant', quantity: 20, unitCost: 12, vatRate: 20, receivedQty: 0 }
  ],
  shippingHT: 30,
  history: [{ date: today, status: PurchaseStatus.ORDERED }],
  ...overrides
});

describe('coût moyen pondéré', () => {
  it('pondère le stock existant et l’entrée', () => {
    expect(weightedAverageCost(140, 9.8, 60, 11)).toBe(10.16); // (1372 + 660) / 200
  });
  it('prend le coût d’entrée quand le stock est vide ou négatif', () => {
    expect(weightedAverageCost(0, 9.8, 10, 11)).toBe(11);
    expect(weightedAverageCost(-3, 9.8, 10, 11)).toBe(11);
  });
});

describe('achats', () => {
  it('calcule les totaux avec les frais de port', () => {
    const t = computePurchaseTotals(ordered());
    expect(t.subtotalHT).toBe(900); // 660 + 240
    expect(t.totalHT).toBe(930);
    expect(t.totalTTC).toBe(1116);
  });

  it('répartit les frais de port dans le coût de revient au prorata de la valeur', () => {
    // 30 € × 660/900 = 22 € sur 60 unités → +0,3667 ; 30 × 240/900 = 8 € sur 20 → +0,40
    expect(landedUnitCost(ordered(), 0)).toBe(11.3667);
    expect(landedUnitCost(ordered(), 1)).toBe(12.4);
  });

  it('réceptionne en partie : stock, CMP, mouvement et statut', () => {
    const { purchase, products, movements } = receivePurchase(ordered({ shippingHT: 0 }), [40, 0], {
      products: MOCK_WHOLESALE_PRODUCTS,
      supplier,
      today
    });
    const p = products.find(x => x.id === 'prd-1')!;
    expect(p.stock).toBe(180);
    expect(p.costPrice).toBe(10.0667); // (140 × 9,80 + 40 × 11) / 180
    expect(p.lastPurchasePrice).toBe(11);
    expect(purchase.status).toBe(PurchaseStatus.PARTIAL);
    expect(purchase.lines[0].receivedQty).toBe(40);
    expect(purchase.dueDate).toBeUndefined();
    expect(movements).toEqual([
      expect.objectContaining({ productId: 'prd-1', type: StockMovementType.PURCHASE, quantity: 40, unitCost: 11, stockAfter: 180, reference: 'ACH-2026-0099' })
    ]);
  });

  it('termine la réception et fixe l’échéance fournisseur', () => {
    const first = receivePurchase(ordered(), [40, 20], { products: MOCK_WHOLESALE_PRODUCTS, supplier, today });
    const second = receivePurchase(first.purchase, [20, 0], { products: first.products, supplier, today: '2026-10-25' });
    expect(second.purchase.status).toBe(PurchaseStatus.RECEIVED);
    expect(second.purchase.receivedDate).toBe('2026-10-25');
    expect(second.purchase.dueDate).toBe('2026-12-09'); // + 45 jours
    expect(second.products.find(x => x.id === 'prd-1')!.stock).toBe(200);
  });

  it('refuse de recevoir plus que commandé', () => {
    expect(() => receivePurchase(ordered(), [61, 0], { products: MOCK_WHOLESALE_PRODUCTS, today })).toThrow('60 attendus');
  });

  it('refuse d’annuler un achat déjà reçu en partie', () => {
    expect(cancelPurchase(ordered(), today).status).toBe(PurchaseStatus.CANCELED);
    expect(() => cancelPurchase(ordered({ status: PurchaseStatus.PARTIAL }), today)).toThrow('ne peut plus être annulé');
  });

  it('enregistre la facture fournisseur puis le paiement, seulement après réception', () => {
    expect(() => recordSupplierInvoice(ordered(), { ref: 'F-1', dueDate: '2026-12-01' })).toThrow('après la réception');
    const received = ordered({ status: PurchaseStatus.RECEIVED });
    expect(() => recordSupplierInvoice(received, { ref: ' ', dueDate: '2026-12-01' })).toThrow('numéro');
    const invoiced = recordSupplierInvoice(received, { ref: ' F-1 ', dueDate: '2026-12-01' });
    expect(invoiced).toEqual(expect.objectContaining({ supplierInvoiceRef: 'F-1', dueDate: '2026-12-01' }));
    const paid = markPurchasePaid(invoiced, today);
    expect(paid.paidDate).toBe(today);
    expect(() => markPurchasePaid(paid, today)).toThrow('déjà payé');
  });

  it('ne passe commande que d’un brouillon valide', () => {
    const draft = ordered({ status: PurchaseStatus.DRAFT, lines: [] });
    expect(() => markPurchaseOrdered(draft, today)).toThrow('au moins un produit');
  });
});

describe('ventes et stock', () => {
  const customer = MOCK_WHOLESALE_CUSTOMERS[0];
  const quote: WholesaleOrder = {
    id: 'ord-test', number: 'CMD-2026-0099', customerId: customer.id, customerName: customer.companyName,
    date: today, status: OrderStatus.QUOTE, lines: [{ ...buildLine(detergent, 20, customer), unitCost: 1 }],
    history: [{ date: today, status: OrderStatus.QUOTE }]
  };
  const ctx = { products: MOCK_WHOLESALE_PRODUCTS, orders: MOCK_WHOLESALE_ORDERS, customer, settings: DEFAULT_WHOLESALE_SETTINGS, today };

  it('fige le coût des ventes au CMP du jour et trace la sortie', () => {
    const { order, movements } = applyStatusChange(quote, OrderStatus.CONFIRMED, ctx);
    expect(order.lines[0].unitCost).toBe(9.8);
    expect(movements).toEqual([
      expect.objectContaining({ type: StockMovementType.SALE, quantity: -20, unitCost: 9.8, stockAfter: 120, reference: 'CMD-2026-0099' })
    ]);
  });

  it('trace le retour en stock quand la commande est annulée', () => {
    const confirmed = applyStatusChange(quote, OrderStatus.CONFIRMED, ctx);
    const canceled = applyStatusChange(confirmed.order, OrderStatus.CANCELED, { ...ctx, products: confirmed.products });
    expect(canceled.movements).toEqual([
      expect.objectContaining({ type: StockMovementType.SALE_CANCEL, quantity: 20, unitCost: 9.8, stockAfter: 140 })
    ]);
    expect(canceled.products.find(p => p.id === 'prd-1')!.costPrice).toBe(9.8);
  });
});

describe('gestion du stock', () => {
  it('compte les quantités réservées et en commande', () => {
    expect(reservedQuantities(MOCK_WHOLESALE_ORDERS).get('prd-5')).toBe(10); // CMD-0002 confirmée
    expect(reservedQuantities(MOCK_WHOLESALE_ORDERS).has('prd-1')).toBe(false); // CMD-0001 facturée = livrée
    expect(incomingQuantities(MOCK_PURCHASES).get('prd-9')).toBe(40);
  });

  it('inventaire : compare au stock physique (disponible + à livrer)', () => {
    // disponible 48 + 10 à livrer = 58 attendus ; 55 comptés → −3
    const { product: p, movement } = adjustStock(product('prd-5'), { kind: StockMovementType.COUNT, quantity: 55 }, { reserved: 10, today });
    expect(p.stock).toBe(45);
    expect(movement).toEqual(expect.objectContaining({ type: StockMovementType.COUNT, quantity: -3, stockAfter: 45, unitCost: 15.6 }));
  });

  it('inventaire : refuse un comptage inférieur aux commandes à livrer', () => {
    expect(() => adjustStock(product('prd-5'), { kind: StockMovementType.COUNT, quantity: 8 }, { reserved: 10, today })).toThrow('commandes à livrer');
  });

  it('perte : retire du stock, sans passer sous zéro', () => {
    expect(adjustStock(bags, { kind: StockMovementType.LOSS, quantity: 2 }, { reserved: 0, today }).product.stock).toBe(6);
    expect(() => adjustStock(bags, { kind: StockMovementType.LOSS, quantity: 9 }, { reserved: 0, today })).toThrow('insuffisant');
  });

  it('ajustement : exige un motif', () => {
    expect(() => adjustStock(bags, { kind: StockMovementType.ADJUSTMENT, quantity: 3 }, { reserved: 0, today })).toThrow('motif');
    expect(adjustStock(bags, { kind: StockMovementType.ADJUSTMENT, quantity: 3, note: 'retour client' }, { reserved: 0, today }).product.stock).toBe(11);
  });

  it('suggère un réappro par fournisseur en tenant compte des achats en cours', () => {
    const suggestions = reorderSuggestions(MOCK_WHOLESALE_PRODUCTS, MOCK_PURCHASES);
    // Détartrant (22 ≤ 25, rien en commande) → 2 × 25 − 22 = 28 chez sup-1
    expect(suggestions.get('sup-1')).toEqual([expect.objectContaining({ quantity: 28, incoming: 0 })]);
    // Sacs : 8 en stock mais 40 en commande → pas de suggestion
    expect(suggestions.has('sup-2')).toBe(false);
  });

  it('prépare un brouillon d’achat au dernier prix payé', () => {
    const po = draftPurchase(supplier, [{ product: product('prd-3'), quantity: 28 }], { purchases: MOCK_PURCHASES, today });
    expect(po.number).toBe('ACH-2026-0003');
    expect(po.expectedDate).toBe('2026-10-25'); // délai fournisseur 3 jours
    expect(po.lines[0]).toEqual(expect.objectContaining({ quantity: 28, unitCost: 18, receivedQty: 0 }));
  });

  it('l’historique de démonstration retombe sur le stock actuel', () => {
    MOCK_WHOLESALE_PRODUCTS.forEach(p => {
      const moves = MOCK_STOCK_MOVEMENTS.filter(m => m.productId === p.id);
      expect(moves.reduce((s, m) => s + m.quantity, 0)).toBe(p.stock);
      expect(moves.at(-1)!.stockAfter).toBe(p.stock);
    });
  });
});

describe('rentabilité', () => {
  it('additionne CA, coût et marge par produit', () => {
    const rows = profitability(MOCK_WHOLESALE_ORDERS, 'product');
    const det = rows.find(r => r.id === 'prd-1')!;
    expect(det).toEqual(expect.objectContaining({ quantity: 50, revenueHT: 625.5, costHT: 490, marginHT: 135.5 }));
    expect(rows.some(r => r.id === 'prd-6')).toBe(false); // le devis ne compte pas
  });

  it('filtre par période et regroupe par client', () => {
    const rows = profitability(MOCK_WHOLESALE_ORDERS, 'customer', { from: '2026-10-10' });
    expect(rows.map(r => r.id)).toEqual(['cli-2']);
  });
});
