
import React, { useMemo, useState } from 'react';
import { Plus, Trash2, AlertTriangle, AlertCircle, TrendingDown, Truck } from 'lucide-react';
import {
  OrderLine,
  OrderStatus,
  WholesaleCustomer,
  WholesaleOrder,
  WholesaleProduct,
  WholesaleSettings
} from '../../types';
import {
  ORDER_PREFIX,
  buildLine,
  checkOrder,
  computeTotals,
  formatEUR,
  lineTotalHT,
  marginRate,
  nextNumber,
  nextTier,
  round2,
  todayISO
} from '../../services/wholesalePricing';
import { CATEGORIES } from './Catalog';
import { Field, Modal, inputClass, newId, parseNumber, primaryButton, secondaryButton } from './ui';

interface DraftLine {
  productId: string;
  quantity: string;
}

interface OrderEditorProps {
  order?: WholesaleOrder; // devis à modifier ; absent pour une nouvelle commande
  initialCustomerId?: string;
  products: WholesaleProduct[];
  customers: WholesaleCustomer[];
  orders: WholesaleOrder[];
  settings: WholesaleSettings;
  onCancel: () => void;
  onSave: (order: WholesaleOrder, confirm: boolean) => void;
}

const OrderEditor: React.FC<OrderEditorProps> = ({
  order,
  initialCustomerId,
  products,
  customers,
  orders,
  settings,
  onCancel,
  onSave
}) => {
  const [customerId, setCustomerId] = useState(order?.customerId ?? initialCustomerId ?? '');
  const [date, setDate] = useState(order?.date ?? todayISO());
  const [deliveryDate, setDeliveryDate] = useState(order?.deliveryDate ?? '');
  const [notes, setNotes] = useState(order?.notes ?? '');
  const [lines, setLines] = useState<DraftLine[]>(
    order?.lines.map(l => ({ productId: l.productId, quantity: String(l.quantity) })) ?? []
  );
  const [pickProduct, setPickProduct] = useState('');
  const [pickQty, setPickQty] = useState('1');

  const customer = customers.find(c => c.id === customerId);
  const productById = (id: string) => products.find(p => p.id === id);

  // Prix recalculés à chaque saisie : palier atteint + remise du client.
  const priced: OrderLine[] = useMemo(
    () =>
      lines.map(l => {
        const qty = parseNumber(l.quantity);
        const quantity = Number.isFinite(qty) ? qty : 0;
        const product = productById(l.productId);
        if (product) return buildLine(product, quantity, customer);
        const previous = order?.lines.find(o => o.productId === l.productId)!;
        return { ...previous, quantity };
      }),
    [lines, customer, products]
  );

  const totals = computeTotals(priced, settings);
  const issues = [
    ...(customer ? [] : [{ blocking: true, message: 'Choisissez un client.' }]),
    ...checkOrder(priced, products, settings)
  ];
  const quantitiesValid = priced.length > 0 && priced.every(l => Number.isInteger(l.quantity) && l.quantity > 0);
  const canSave = !!customer && quantitiesValid;
  const canConfirm = canSave && !issues.some(i => i.blocking);

  const addLine = () => {
    const qty = parseNumber(pickQty);
    if (!pickProduct || !Number.isInteger(qty) || qty <= 0) return;
    const existing = lines.find(l => l.productId === pickProduct);
    setLines(
      existing
        ? lines.map(l => (l === existing ? { ...l, quantity: String((parseNumber(l.quantity) || 0) + qty) } : l))
        : [...lines, { productId: pickProduct, quantity: String(qty) }]
    );
    setPickProduct('');
    setPickQty('1');
  };

  const submit = (confirm: boolean) => {
    if (!customer || !canSave) return;
    onSave(
      {
        id: order?.id ?? newId('ord'),
        number: order?.number ?? nextNumber(ORDER_PREFIX, orders.map(o => o.number), Number(date.slice(0, 4))),
        customerId: customer.id,
        customerName: customer.companyName,
        date,
        deliveryDate: deliveryDate || undefined,
        status: OrderStatus.QUOTE,
        lines: priced,
        notes: notes.trim() || undefined,
        history: order?.history ?? [{ date: todayISO(), status: OrderStatus.QUOTE }]
      },
      confirm
    );
  };

  const activeProducts = products.filter(p => p.active);

  return (
    <Modal
      wide
      title={order ? `Modifier le devis ${order.number}` : 'Nouvelle commande'}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className={secondaryButton}>Annuler</button>
          <button onClick={() => submit(false)} disabled={!canSave} className={secondaryButton}>
            Enregistrer le devis
          </button>
          <button onClick={() => submit(true)} disabled={!canConfirm} className={primaryButton}>
            Enregistrer et confirmer
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Client" className="md:col-span-3">
              <select className={inputClass} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Choisir un client professionnel…</option>
                {[...customers]
                  .sort((a, b) => a.companyName.localeCompare(b.companyName, 'fr'))
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} · {c.segment}
                      {c.discountRate > 0 ? ` · remise ${c.discountRate.toLocaleString('fr-FR')} %` : ''}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Date de commande">
              <input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value || todayISO())} />
            </Field>
            <Field label="Livraison prévue">
              <input type="date" className={inputClass} value={deliveryDate} min={date} onChange={e => setDeliveryDate(e.target.value)} />
            </Field>
            <Field label="Délai de paiement">
              <input className={`${inputClass} text-gray-500`} disabled value={customer ? (customer.paymentTermsDays === 0 ? 'Comptant' : `${customer.paymentTermsDays} jours`) : '—'} />
            </Field>
          </div>

          <div>
            <p className="block text-xs font-bold text-gray-400 uppercase mb-2">Ajouter un produit</p>
            <div className="flex flex-col md:flex-row gap-2">
              <select className={`${inputClass} flex-1`} value={pickProduct} onChange={e => setPickProduct(e.target.value)}>
                <option value="">Choisir dans le catalogue…</option>
                {CATEGORIES.map(cat => {
                  const inCat = activeProducts.filter(p => p.category === cat);
                  if (inCat.length === 0) return null;
                  return (
                    <optgroup key={cat} label={cat}>
                      {inCat.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.name} — {p.packaging} · {p.sku} · stock {p.stock}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <input
                className={`${inputClass} md:w-24`}
                inputMode="numeric"
                value={pickQty}
                onChange={e => setPickQty(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLine()}
                aria-label="Quantité"
              />
              <button onClick={addLine} disabled={!pickProduct} className={primaryButton}>
                <Plus size={16} /> Ajouter
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Produit</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase w-24">Qté</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">P.U. HT</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Total HT</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Marge</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priced.map((line, i) => {
                  const product = productById(line.productId);
                  const upsell = product ? nextTier(product, line.quantity) : undefined;
                  const rate = marginRate(line.unitPrice, line.unitCost);
                  return (
                    <tr key={line.productId}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-800">{line.label}</p>
                        <p className="text-[11px] text-gray-400">
                          <span className="font-mono">{line.sku}</span>
                          {product && <> · stock {product.stock}</>}
                        </p>
                        {product && upsell && line.quantity > 0 && (
                          <p className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                            <TrendingDown size={12} /> Encore {upsell.minQty - line.quantity} pour passer à{' '}
                            {formatEUR(round2(upsell.unitPrice * (1 - (customer?.discountRate ?? 0) / 100)))} / u
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className={`${inputClass} bg-white`}
                          inputMode="numeric"
                          value={lines[i].quantity}
                          onChange={e => setLines(lines.map((l, j) => (j === i ? { ...l, quantity: e.target.value } : l)))}
                          aria-label={`Quantité ${line.sku}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{formatEUR(line.unitPrice)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">{formatEUR(lineTotalHT(line))}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold whitespace-nowrap ${rate < settings.minMarginRate ? 'text-red-600' : 'text-green-600'}`}>
                        {rate.toLocaleString('fr-FR')} %
                      </td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() => setLines(lines.filter((_, j) => j !== i))}
                          className="p-2 text-red-400 hover:text-red-600"
                          aria-label={`Retirer ${line.sku}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {priced.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                      Aucun produit pour l'instant. Les prix suivent les paliers de quantité et la remise du client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Field label="Notes (livraison, accès, référence client)">
            <textarea className={`${inputClass} h-20`} value={notes} onChange={e => setNotes(e.target.value)} />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Sous-total HT</span><span className="font-bold">{formatEUR(totals.subtotalHT)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Livraison HT</span><span className="font-bold">{totals.shippingHT === 0 ? (priced.length ? 'Offerte' : '—') : formatEUR(totals.shippingHT)}</span></div>
            {totals.vat.map(v => (
              <div key={v.rate} className="flex justify-between">
                <span className="text-gray-500">TVA {v.rate.toLocaleString('fr-FR')} %</span><span className="font-bold">{formatEUR(v.vat)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 border-t-2 border-indigo-600 text-lg">
              <span className="font-black text-indigo-600">Total TTC</span><span className="font-black text-indigo-600">{formatEUR(totals.totalTTC)}</span>
            </div>
            {priced.length > 0 && !totals.francoReached && (
              <p className="text-xs text-indigo-700 flex items-center gap-1.5 pt-1">
                <Truck size={14} /> Plus que {formatEUR(totals.missingForFranco)} HT pour la livraison offerte.
              </p>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Marge (interne)</p>
            <p className={`text-2xl font-black ${totals.marginRate < settings.minMarginRate ? 'text-red-600' : 'text-green-600'}`}>
              {formatEUR(totals.marginHT)}
            </p>
            <p className="text-xs text-gray-500">{totals.marginRate.toLocaleString('fr-FR')} % du CA marchandises · achat {formatEUR(totals.costHT)}</p>
          </div>

          {issues.length > 0 && (
            <div className="space-y-2">
              {issues.map(issue => (
                <p
                  key={issue.message}
                  className={`text-xs rounded-lg p-3 flex items-start gap-2 ${
                    issue.blocking ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {issue.blocking ? <AlertCircle size={14} className="shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
                  {issue.message}
                </p>
              ))}
              {issues.some(i => i.blocking) && canSave && (
                <p className="text-[11px] text-gray-400">Le devis peut être enregistré ; la confirmation attend que les points en rouge soient réglés.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default OrderEditor;
