
import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { PurchaseLine, PurchaseOrder, PurchaseStatus, Supplier, WholesaleProduct } from '../../types';
import { addDays, formatEUR, nextNumber, todayISO } from '../../services/wholesalePricing';
import {
  PURCHASE_PREFIX,
  checkPurchase,
  computePurchaseTotals,
  landedUnitCost,
  purchaseLineTotal
} from '../../services/wholesaleStock';
import { Field, Modal, inputClass, newId, parseNumber, primaryButton, secondaryButton } from './ui';

interface DraftLine {
  productId: string;
  quantity: string;
  unitCost: string;
}

interface PurchaseEditorProps {
  purchase?: PurchaseOrder; // brouillon à modifier
  initialSupplierId?: string;
  suppliers: Supplier[];
  products: WholesaleProduct[];
  purchases: PurchaseOrder[];
  onCancel: () => void;
  onSave: (purchase: PurchaseOrder, order: boolean) => void;
}

const defaultCost = (p: WholesaleProduct) => String(p.lastPurchasePrice ?? p.costPrice);

const PurchaseEditor: React.FC<PurchaseEditorProps> = ({
  purchase,
  initialSupplierId,
  suppliers,
  products,
  purchases,
  onCancel,
  onSave
}) => {
  const [supplierId, setSupplierId] = useState(purchase?.supplierId ?? initialSupplierId ?? '');
  const supplier = suppliers.find(s => s.id === supplierId);
  const [date, setDate] = useState(purchase?.date ?? todayISO());
  const [expectedDate, setExpectedDate] = useState(
    purchase?.expectedDate ?? (supplier ? addDays(todayISO(), supplier.leadTimeDays) : '')
  );
  const [shipping, setShipping] = useState(String(purchase?.shippingHT ?? 0));
  const [notes, setNotes] = useState(purchase?.notes ?? '');
  const [lines, setLines] = useState<DraftLine[]>(
    purchase?.lines.map(l => ({ productId: l.productId, quantity: String(l.quantity), unitCost: String(l.unitCost) })) ?? []
  );
  const [pick, setPick] = useState('');
  const [pickQty, setPickQty] = useState('1');

  const productById = (id: string) => products.find(p => p.id === id);

  const chooseSupplier = (id: string) => {
    setSupplierId(id);
    const s = suppliers.find(x => x.id === id);
    if (s && !purchase) setExpectedDate(addDays(date, s.leadTimeDays));
  };

  const parsedLines: PurchaseLine[] = lines.map(l => {
    const p = productById(l.productId)!;
    const quantity = parseNumber(l.quantity);
    const unitCost = parseNumber(l.unitCost);
    return {
      productId: p.id,
      sku: p.sku,
      label: `${p.name} — ${p.packaging}`,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      unitCost: Number.isFinite(unitCost) ? unitCost : NaN,
      vatRate: p.vatRate,
      receivedQty: 0
    };
  });
  const shippingHT = parseNumber(shipping);
  const draft = { lines: parsedLines, shippingHT: Number.isFinite(shippingHT) ? shippingHT : NaN };
  const problems = [...(supplier ? [] : ['Choisissez un fournisseur.']), ...checkPurchase(draft)];
  const totals = computePurchaseTotals({ lines: parsedLines, shippingHT: Number.isFinite(shippingHT) ? shippingHT : 0 });

  const addLine = () => {
    const qty = parseNumber(pickQty);
    const product = productById(pick);
    if (!product || !Number.isInteger(qty) || qty <= 0) return;
    const existing = lines.find(l => l.productId === pick);
    setLines(
      existing
        ? lines.map(l => (l === existing ? { ...l, quantity: String((parseNumber(l.quantity) || 0) + qty) } : l))
        : [...lines, { productId: pick, quantity: String(qty), unitCost: defaultCost(product) }]
    );
    setPick('');
    setPickQty('1');
  };

  const submit = (order: boolean) => {
    if (problems.length > 0 || !supplier) return;
    onSave(
      {
        id: purchase?.id ?? newId('ach'),
        number: purchase?.number ?? nextNumber(PURCHASE_PREFIX, purchases.map(p => p.number), Number(date.slice(0, 4))),
        supplierId: supplier.id,
        supplierName: supplier.companyName,
        date,
        expectedDate: expectedDate || undefined,
        status: PurchaseStatus.DRAFT,
        lines: parsedLines,
        shippingHT: draft.shippingHT,
        notes: notes.trim() || undefined,
        history: purchase?.history ?? [{ date: todayISO(), status: PurchaseStatus.DRAFT }]
      },
      order
    );
  };

  const active = products.filter(p => p.active);
  const fromSupplier = active.filter(p => p.supplierId === supplierId);
  const others = active.filter(p => p.supplierId !== supplierId);
  const option = (p: WholesaleProduct) => (
    <option key={p.id} value={p.id}>
      {p.name} — {p.packaging} · {p.sku} · stock {p.stock}
    </option>
  );

  return (
    <Modal
      wide
      title={purchase ? `Modifier ${purchase.number}` : 'Nouvelle commande fournisseur'}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className={secondaryButton}>Annuler</button>
          <button onClick={() => submit(false)} disabled={problems.length > 0} className={secondaryButton}>Enregistrer le brouillon</button>
          <button onClick={() => submit(true)} disabled={problems.length > 0} className={primaryButton}>Enregistrer et commander</button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Fournisseur" className="md:col-span-3">
              <select className={inputClass} value={supplierId} onChange={e => chooseSupplier(e.target.value)}>
                <option value="">Choisir un fournisseur…</option>
                {[...suppliers]
                  .sort((a, b) => a.companyName.localeCompare(b.companyName, 'fr'))
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} · livraison {s.leadTimeDays} j · paiement {s.paymentTermsDays} j
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Date de commande">
              <input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value || todayISO())} />
            </Field>
            <Field label="Livraison attendue">
              <input type="date" className={inputClass} value={expectedDate} min={date} onChange={e => setExpectedDate(e.target.value)} />
            </Field>
            <Field label="Frais de port HT (€)" hint="Répartis dans le coût de revient.">
              <input className={inputClass} inputMode="decimal" value={shipping} onChange={e => setShipping(e.target.value)} />
            </Field>
          </div>

          <div>
            <p className="block text-xs font-bold text-gray-400 uppercase mb-2">Ajouter un produit</p>
            <div className="flex flex-col md:flex-row gap-2">
              <select className={`${inputClass} flex-1`} value={pick} onChange={e => setPick(e.target.value)}>
                <option value="">Choisir dans le catalogue…</option>
                {fromSupplier.length > 0 && <optgroup label="Produits de ce fournisseur">{fromSupplier.map(option)}</optgroup>}
                <optgroup label={fromSupplier.length > 0 ? 'Autres produits' : 'Catalogue'}>{others.map(option)}</optgroup>
              </select>
              <input
                className={`${inputClass} md:w-24`}
                inputMode="numeric"
                value={pickQty}
                onChange={e => setPickQty(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLine()}
                aria-label="Quantité"
              />
              <button onClick={addLine} disabled={!pick} className={primaryButton}>
                <Plus size={16} /> Ajouter
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-left min-w-[680px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Produit</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase w-24">Qté</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase w-28">P.U. HT</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Total HT</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Coût de revient</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedLines.map((line, i) => {
                  const product = productById(line.productId)!;
                  const landed = Number.isFinite(line.unitCost) ? landedUnitCost({ ...draft, shippingHT: totals.shippingHT }, i) : NaN;
                  const change = Number.isFinite(landed) && product.costPrice > 0 ? ((landed - product.costPrice) / product.costPrice) * 100 : 0;
                  return (
                    <tr key={line.productId}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-800">{line.label}</p>
                        <p className="text-[11px] text-gray-400">
                          <span className="font-mono">{line.sku}</span> · stock {product.stock} · CMP {formatEUR(product.costPrice)}
                        </p>
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
                      <td className="px-4 py-3">
                        <input
                          className={`${inputClass} bg-white`}
                          inputMode="decimal"
                          value={lines[i].unitCost}
                          onChange={e => setLines(lines.map((l, j) => (j === i ? { ...l, unitCost: e.target.value } : l)))}
                          aria-label={`Prix d'achat ${line.sku}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold">
                        {Number.isFinite(line.unitCost) ? formatEUR(purchaseLineTotal(line)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <p className="text-sm font-bold">{Number.isFinite(landed) ? formatEUR(landed) : '—'}</p>
                        {Math.abs(change) >= 0.5 && (
                          <p className={`text-[11px] font-bold ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {change > 0 ? '+' : ''}{change.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % vs CMP
                          </p>
                        )}
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
                {parsedLines.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                      Aucun produit. Le prix proposé est le dernier prix payé ; modifiez-le si le fournisseur a changé ses tarifs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Field label="Notes pour le fournisseur">
            <textarea className={`${inputClass} h-20`} value={notes} onChange={e => setNotes(e.target.value)} />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="bg-teal-50 p-5 rounded-2xl border border-teal-100 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Marchandises HT</span><span className="font-bold">{formatEUR(totals.subtotalHT)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Frais de port HT</span><span className="font-bold">{formatEUR(totals.shippingHT)}</span></div>
            {totals.vat.map(v => (
              <div key={v.rate} className="flex justify-between">
                <span className="text-gray-500">TVA {v.rate.toLocaleString('fr-FR')} %</span><span className="font-bold">{formatEUR(v.vat)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 border-t-2 border-teal-600 text-lg">
              <span className="font-black text-teal-700">Total TTC</span><span className="font-black text-teal-700">{formatEUR(totals.totalTTC)}</span>
            </div>
          </div>
          {supplier && (
            <p className="text-xs text-gray-500">
              Paiement à {supplier.paymentTermsDays} jours après réception · livraison habituelle en {supplier.leadTimeDays} jours.
            </p>
          )}
          {problems.length > 0 && (
            <div className="space-y-2">
              {problems.map(p => (
                <p key={p} className="text-xs rounded-lg p-3 flex items-start gap-2 bg-red-50 text-red-700">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> {p}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseEditor;
