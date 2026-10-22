
import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, History, ShoppingCart, AlertTriangle, PackageSearch } from 'lucide-react';
import {
  PurchaseOrder,
  PurchaseStatus,
  StockMovement,
  StockMovementType,
  Supplier,
  WholesaleOrder,
  WholesaleProduct
} from '../../types';
import { formatDate, formatEUR, round2 } from '../../services/wholesalePricing';
import {
  AdjustmentKind,
  incomingQuantities,
  remainingQty,
  reorderSuggestions,
  reservedQuantities
} from '../../services/wholesaleStock';
import { Field, Modal, StockBadge, inputClass, parseNumber, primaryButton, secondaryButton, stockLevel } from './ui';

const MOVEMENT_COLORS: Record<StockMovementType, string> = {
  [StockMovementType.INITIAL]: 'bg-gray-100 text-gray-600',
  [StockMovementType.PURCHASE]: 'bg-teal-100 text-teal-700',
  [StockMovementType.SALE]: 'bg-indigo-100 text-indigo-700',
  [StockMovementType.SALE_CANCEL]: 'bg-purple-100 text-purple-700',
  [StockMovementType.COUNT]: 'bg-blue-100 text-blue-700',
  [StockMovementType.LOSS]: 'bg-red-100 text-red-700',
  [StockMovementType.ADJUSTMENT]: 'bg-amber-100 text-amber-700'
};

const PAGE = 50;

interface StockProps {
  products: WholesaleProduct[];
  orders: WholesaleOrder[];
  purchases: PurchaseOrder[];
  suppliers: Supplier[];
  movements: StockMovement[];
  onAdjust: (product: WholesaleProduct, adjustment: { kind: AdjustmentKind; quantity: number; note?: string }) => string | null;
  onCreateDraft: (supplierId: string, items: { product: WholesaleProduct; quantity: number }[]) => void;
}

const Stock: React.FC<StockProps> = ({ products, orders, purchases, suppliers, movements, onAdjust, onCreateDraft }) => {
  const [query, setQuery] = useState('');
  const [adjusting, setAdjusting] = useState<WholesaleProduct | null>(null);
  const [journalProduct, setJournalProduct] = useState('');
  const [journalType, setJournalType] = useState('');
  const [shown, setShown] = useState(PAGE);

  const reserved = useMemo(() => reservedQuantities(orders), [orders]);
  const incoming = useMemo(() => incomingQuantities(purchases), [purchases]);
  const suggestions = useMemo(() => reorderSuggestions(products, purchases), [products, purchases]);

  const rows = products
    .filter(p => p.active)
    .filter(p => {
      const q = query.trim().toLowerCase();
      return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    })
    .map(p => {
      const res = reserved.get(p.id) ?? 0;
      const physical = p.stock + res;
      return { p, res, physical, coming: incoming.get(p.id) ?? 0, value: round2(physical * p.costPrice) };
    })
    .sort((a, b) => Number(stockLevel(a.p) === 'ok') - Number(stockLevel(b.p) === 'ok') || a.p.name.localeCompare(b.p.name, 'fr'));

  const allActive = products.filter(p => p.active);
  const totalValue = allActive.reduce((s, p) => s + (p.stock + (reserved.get(p.id) ?? 0)) * p.costPrice, 0);
  const comingValue = purchases
    .filter(po => po.status === PurchaseStatus.ORDERED || po.status === PurchaseStatus.PARTIAL)
    .flatMap(po => po.lines)
    .reduce((s, l) => s + remainingQty(l) * l.unitCost, 0);
  const toDeliver = [...reserved.values()].reduce((s, q) => s + q, 0);
  const below = allActive.filter(p => stockLevel(p) !== 'ok').length;

  const journal = movements
    .filter(m => !journalProduct || m.productId === journalProduct)
    .filter(m => !journalType || m.type === journalType)
    .map((m, i) => ({ m, i }))
    .sort((a, b) => b.m.date.localeCompare(a.m.date) || b.i - a.i)
    .map(x => x.m);

  const supplierName = (id: string) => suppliers.find(s => s.id === id)?.companyName;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Valeur du stock (CMP)', value: formatEUR(totalValue), sub: 'Stock physique × coût moyen' },
          { label: 'En commande fournisseurs', value: formatEUR(comingValue), sub: `${[...incoming.values()].reduce((s, q) => s + q, 0)} unités à recevoir` },
          { label: 'À livrer aux clients', value: `${toDeliver} unités`, sub: 'Vendues, encore en entrepôt' },
          { label: 'Sous le seuil', value: String(below), sub: below ? 'Voir les suggestions ci-dessous' : 'Aucune alerte', warn: below > 0 }
        ].map(k => (
          <div key={k.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{k.label}</p>
            <h3 className={`text-2xl font-black ${k.warn ? 'text-amber-500' : ''}`}>{k.value}</h3>
            <p className="text-[11px] text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {suggestions.size > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-amber-900 flex items-center gap-2"><ShoppingCart size={18} /> Réapprovisionnement suggéré</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...suggestions.entries()].map(([supplierId, items]) => (
              <div key={supplierId || 'none'} className="bg-white rounded-xl p-4 border border-amber-100 space-y-3">
                <p className="text-sm font-bold">{supplierId ? supplierName(supplierId) ?? 'Fournisseur inconnu' : 'Sans fournisseur principal'}</p>
                <ul className="space-y-1">
                  {items.map(s => (
                    <li key={s.product.id} className="text-xs text-gray-600 flex justify-between gap-3">
                      <span>
                        {s.product.name} — {s.product.packaging}
                        <span className="text-gray-400"> · stock {s.product.stock}{s.incoming ? ` + ${s.incoming} en commande` : ''} · seuil {s.product.minStock}</span>
                      </span>
                      <b className="whitespace-nowrap">{s.quantity} u.</b>
                    </li>
                  ))}
                </ul>
                {supplierId ? (
                  <button onClick={() => onCreateDraft(supplierId, items)} className={`${primaryButton} w-full text-sm`}>
                    Préparer la commande fournisseur
                  </button>
                ) : (
                  <p className="text-[11px] text-amber-700">Choisissez un fournisseur principal dans la fiche produit (Catalogue).</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-full max-w-sm">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un produit"
              className="bg-transparent border-none focus:ring-0 outline-none text-sm w-full"
            />
          </div>
          <p className="text-[11px] text-gray-400 hidden md:block">Physique = disponible + vendu pas encore livré</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[980px]">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase">Produit</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Disponible</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">À livrer</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Physique</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">En commande</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">CMP</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Valeur</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(({ p, res, physical, coming, value }) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-[11px] text-gray-400">
                      <span className="font-mono">{p.sku}</span> · {p.packaging} · seuil {p.minStock}
                      {p.supplierId && <> · {supplierName(p.supplierId)}</>}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <p className="text-sm font-bold">{p.stock}</p>
                    <StockBadge product={p} />
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-gray-600">{res || '—'}</td>
                  <td className="px-3 py-3 text-right text-sm font-medium">{physical}</td>
                  <td className="px-3 py-3 text-right text-sm text-teal-700 font-medium">{coming ? `+${coming}` : '—'}</td>
                  <td className="px-3 py-3 text-right text-sm">{formatEUR(p.costPrice)}</td>
                  <td className="px-3 py-3 text-right text-sm font-bold">{formatEUR(value)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setAdjusting(p)} className="p-2 text-gray-400 hover:text-indigo-600" aria-label={`Ajuster ${p.sku}`} title="Inventaire, perte, ajustement">
                      <SlidersHorizontal size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setJournalProduct(p.id);
                        setShown(PAGE);
                        document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600"
                      aria-label={`Historique ${p.sku}`}
                      title="Historique des mouvements"
                    >
                      <History size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="journal" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="font-bold flex items-center gap-2"><PackageSearch size={18} className="text-indigo-600" /> Mouvements de stock</h3>
          <div className="flex flex-wrap gap-2">
            <select className={`${inputClass} w-auto`} value={journalProduct} onChange={e => { setJournalProduct(e.target.value); setShown(PAGE); }}>
              <option value="">Tous les produits</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
            <select className={`${inputClass} w-auto`} value={journalType} onChange={e => { setJournalType(e.target.value); setShown(PAGE); }}>
              <option value="">Tous les mouvements</option>
              {Object.values(StockMovementType).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase">Date</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase">Produit</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase">Mouvement</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Quantité</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Coût unitaire</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Valeur</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Stock après</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase">Référence / motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {journal.slice(0, shown).map(m => (
                <tr key={m.id}>
                  <td className="px-5 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(m.date)}</td>
                  <td className="px-3 py-2.5 text-xs font-mono">{m.sku}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${MOVEMENT_COLORS[m.type]}`}>{m.type}</span>
                  </td>
                  <td className={`px-3 py-2.5 text-sm text-right font-bold ${m.quantity > 0 ? 'text-teal-700' : m.quantity < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-right text-gray-500">{formatEUR(m.unitCost)}</td>
                  <td className="px-3 py-2.5 text-xs text-right">{formatEUR(m.quantity * m.unitCost)}</td>
                  <td className="px-3 py-2.5 text-sm text-right">{m.stockAfter}</td>
                  <td className="px-5 py-2.5 text-xs text-gray-500">{[m.reference, m.note].filter(Boolean).join(' · ') || '—'}</td>
                </tr>
              ))}
              {journal.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">Aucun mouvement pour ces filtres.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {journal.length > shown && (
          <div className="p-3 text-center border-t border-gray-50">
            <button onClick={() => setShown(shown + PAGE)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Afficher {Math.min(PAGE, journal.length - shown)} mouvements de plus
            </button>
          </div>
        )}
      </div>

      {adjusting && (
        <AdjustForm
          product={adjusting}
          reserved={reserved.get(adjusting.id) ?? 0}
          onCancel={() => setAdjusting(null)}
          onConfirm={adjustment => {
            const error = onAdjust(adjusting, adjustment);
            if (!error) setAdjusting(null);
            return error;
          }}
        />
      )}
    </div>
  );
};

const KINDS: { kind: AdjustmentKind; label: string; help: string }[] = [
  { kind: StockMovementType.COUNT, label: 'Inventaire', help: 'Saisissez la quantité comptée dans l’entrepôt (y compris ce qui attend d’être livré).' },
  { kind: StockMovementType.LOSS, label: 'Perte / casse', help: 'Nombre d’unités abîmées, périmées ou perdues.' },
  { kind: StockMovementType.ADJUSTMENT, label: 'Ajustement', help: 'Quantité à ajouter (12) ou à retirer (−12), avec le motif.' }
];

const AdjustForm: React.FC<{
  product: WholesaleProduct;
  reserved: number;
  onCancel: () => void;
  onConfirm: (adjustment: { kind: AdjustmentKind; quantity: number; note?: string }) => string | null;
}> = ({ product, reserved, onCancel, onConfirm }) => {
  const [kind, setKind] = useState<AdjustmentKind>(StockMovementType.COUNT);
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const q = parseNumber(quantity.replace('−', '-'));
  const physical = product.stock + reserved;
  const delta = !Number.isInteger(q)
    ? null
    : kind === StockMovementType.COUNT ? q - physical : kind === StockMovementType.LOSS ? -q : q;

  return (
    <Modal
      title={`Stock — ${product.name}`}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className={secondaryButton}>Annuler</button>
          <button
            onClick={() => setError(onConfirm({ kind, quantity: q, note }))}
            disabled={delta === null}
            className={primaryButton}
          >
            Enregistrer le mouvement
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <p className="bg-red-50 text-red-700 text-sm rounded-xl p-3 flex items-start gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}</p>
        )}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[['Disponible', product.stock], ['À livrer', reserved], ['Physique', physical]].map(([label, value]) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
              <p className="text-xl font-black">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map(k => (
            <button
              key={k.kind}
              onClick={() => { setKind(k.kind); setError(null); }}
              className={`py-2 rounded-lg text-sm font-bold border transition-colors ${
                kind === k.kind ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{KINDS.find(k => k.kind === kind)!.help}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={kind === StockMovementType.COUNT ? 'Quantité comptée' : 'Quantité'}>
            <input className={inputClass} inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} autoFocus />
          </Field>
          <Field label={kind === StockMovementType.ADJUSTMENT ? 'Motif (obligatoire)' : 'Motif (facultatif)'}>
            <input className={inputClass} value={note} onChange={e => setNote(e.target.value)} placeholder={kind === StockMovementType.LOSS ? 'Bidons percés à la livraison' : ''} />
          </Field>
        </div>
        {delta !== null && (
          <p className={`text-sm font-medium ${delta < 0 ? 'text-red-600' : delta > 0 ? 'text-teal-700' : 'text-gray-500'}`}>
            {delta === 0
              ? 'Aucun écart : le mouvement sera enregistré pour garder la trace du comptage.'
              : `Écart de ${delta > 0 ? '+' : ''}${delta} unité(s), soit ${formatEUR(delta * product.costPrice)} au CMP. Disponible après : ${product.stock + delta}.`}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default Stock;
