
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Pencil, Ban, ArrowRight, AlertCircle, Clock, FileText, Mail, PackageCheck, Printer, Wallet } from 'lucide-react';
import { CompanySettings, PurchaseOrder, PurchaseStatus, Supplier, WholesaleProduct } from '../../types';
import { formatDate, formatEUR, todayISO, weightedAverageCost } from '../../services/wholesalePricing';
import {
  computePurchaseTotals,
  isPurchaseToPay,
  landedUnitCost,
  purchaseLineTotal,
  remainingQty
} from '../../services/wholesaleStock';
import PurchaseEditor from './PurchaseEditor';
import { Field, Modal, PurchaseBadge, inputClass, parseNumber, primaryButton, secondaryButton } from './ui';

type Filter = 'all' | 'draft' | 'open' | 'received' | 'toPay' | 'canceled';

export interface PurchaseActions {
  onSave: (purchase: PurchaseOrder, order: boolean) => string | null;
  onOrder: (purchase: PurchaseOrder) => string | null;
  onCancel: (purchase: PurchaseOrder) => string | null;
  onReceive: (purchase: PurchaseOrder, received: number[]) => string | null;
  onInvoice: (purchase: PurchaseOrder, invoice: { ref: string; dueDate: string }) => string | null;
  onPay: (purchase: PurchaseOrder) => string | null;
}

interface PurchasesProps extends PurchaseActions {
  purchases: PurchaseOrder[];
  suppliers: Supplier[];
  products: WholesaleProduct[];
  company: CompanySettings;
  focus?: { purchaseId?: string; supplierId?: string } | null;
  onFocused?: () => void;
}

const Purchases: React.FC<PurchasesProps> = props => {
  const { purchases, suppliers, products, company, focus, onFocused } = props;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editor, setEditor] = useState<{ purchase?: PurchaseOrder; supplierId?: string } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = todayISO();

  // Ouverture directe depuis un fournisseur (« Commander ») ou une suggestion de réappro.
  useEffect(() => {
    if (!focus) return;
    if (focus.purchaseId) setViewingId(focus.purchaseId);
    else if (focus.supplierId) setEditor({ supplierId: focus.supplierId });
    onFocused?.();
  }, [focus]);

  const isOpen = (p: PurchaseOrder) => p.status === PurchaseStatus.ORDERED || p.status === PurchaseStatus.PARTIAL;
  const filters: { id: Filter; label: string; test: (p: PurchaseOrder) => boolean }[] = [
    { id: 'all', label: 'Tous', test: () => true },
    { id: 'draft', label: 'Brouillons', test: p => p.status === PurchaseStatus.DRAFT },
    { id: 'open', label: 'À recevoir', test: isOpen },
    { id: 'received', label: 'Reçus', test: p => p.status === PurchaseStatus.RECEIVED },
    { id: 'toPay', label: 'À payer', test: isPurchaseToPay },
    { id: 'canceled', label: 'Annulés', test: p => p.status === PurchaseStatus.CANCELED }
  ];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = filters.find(f => f.id === filter)!.test;
    return purchases
      .filter(test)
      .filter(p => !q || p.number.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q) || (p.supplierInvoiceRef ?? '').toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number));
  }, [purchases, query, filter]);

  const viewing = purchases.find(p => p.id === viewingId);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center justify-between">
        <div className="flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 w-full max-w-sm">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="N° d'achat, fournisseur, facture fournisseur"
            className="bg-transparent border-none focus:ring-0 outline-none text-sm w-full"
          />
        </div>
        <button onClick={() => setEditor({})} className={primaryButton}>
          <Plus size={16} /> Commande fournisseur
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              filter === f.id ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {f.label} <span className="opacity-70">{purchases.filter(f.test).length}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Achat</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Fournisseur</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Commandé le</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Attendu le</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Total HT</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Total TTC</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Statut</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map(p => {
              const t = computePurchaseTotals(p);
              const lateDelivery = isOpen(p) && !!p.expectedDate && p.expectedDate < today;
              const latePayment = isPurchaseToPay(p) && !!p.dueDate && p.dueDate < today;
              return (
                <tr key={p.id} onClick={() => setViewingId(p.id)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-indigo-600">{p.number}</p>
                    {p.supplierInvoiceRef && <p className="text-[11px] text-gray-400">Fact. {p.supplierInvoiceRef}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{p.supplierName}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{formatDate(p.date)}</td>
                  <td className={`px-6 py-4 text-xs ${lateDelivery ? 'text-red-600 font-bold' : 'text-gray-500'}`}>{formatDate(p.expectedDate)}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatEUR(t.totalHT)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-right">{formatEUR(t.totalTTC)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <PurchaseBadge status={p.status} />
                      {p.paidDate && <span className="text-[10px] font-bold text-green-600">Payé le {formatDate(p.paidDate)}</span>}
                      {latePayment && (
                        <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><Clock size={11} /> à payer depuis le {formatDate(p.dueDate)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right"><Eye size={16} className="text-gray-400 inline" /></td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">Aucun achat dans cette vue.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <PurchaseDetail
          purchase={viewing}
          supplier={suppliers.find(s => s.id === viewing.supplierId)}
          products={products}
          company={company}
          today={today}
          error={error}
          onClose={() => {
            setViewingId(null);
            setError(null);
          }}
          onEdit={() => {
            setEditor({ purchase: viewing });
            setViewingId(null);
          }}
          run={action => setError(action())}
          actions={props}
        />
      )}

      {editor && (
        <PurchaseEditor
          purchase={editor.purchase}
          initialSupplierId={editor.supplierId}
          suppliers={suppliers}
          products={products}
          purchases={purchases}
          onCancel={() => setEditor(null)}
          onSave={(purchase, order) => {
            setError(props.onSave(purchase, order));
            setEditor(null);
            setViewingId(purchase.id);
          }}
        />
      )}
    </div>
  );
};

// Brouillon d'e-mail de commande : il s'ouvre dans la messagerie, rien ne part sans validation.
const orderMailto = (p: PurchaseOrder, supplier: Supplier, company: CompanySettings) => {
  const body = [
    `Bonjour${supplier.contactName ? ` ${supplier.contactName}` : ''},`,
    '',
    `Veuillez trouver ci-dessous notre commande ${p.number}${p.expectedDate ? `, à livrer pour le ${formatDate(p.expectedDate)}` : ''} :`,
    '',
    ...p.lines.map(l => `- ${l.quantity} × ${l.label} (réf. ${l.sku}) à ${formatEUR(l.unitCost)} HT`),
    '',
    `Adresse de livraison : ${company.address}`,
    'Merci de rappeler notre numéro de commande sur le bon de livraison et la facture.',
    '',
    'Bien cordialement,',
    company.name,
    company.phone
  ].join('\n');
  return `mailto:${supplier.email}?subject=${encodeURIComponent(`Commande ${p.number} — ${company.name}`)}&body=${encodeURIComponent(body)}`;
};

const PurchaseDetail: React.FC<{
  purchase: PurchaseOrder;
  supplier?: Supplier;
  products: WholesaleProduct[];
  company: CompanySettings;
  today: string;
  error: string | null;
  onClose: () => void;
  onEdit: () => void;
  run: (action: () => string | null) => void;
  actions: PurchaseActions;
}> = ({ purchase: p, supplier, products, company, today, error, onClose, onEdit, run, actions }) => {
  const [receiving, setReceiving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [invoiceRef, setInvoiceRef] = useState(p.supplierInvoiceRef ?? '');
  const [dueDate, setDueDate] = useState(p.dueDate ?? '');
  const t = computePurchaseTotals(p);
  const canReceive = p.status === PurchaseStatus.ORDERED || p.status === PurchaseStatus.PARTIAL;
  const canCancel = p.status === PurchaseStatus.DRAFT || p.status === PurchaseStatus.ORDERED;
  const received = p.status === PurchaseStatus.RECEIVED || p.status === PurchaseStatus.PARTIAL;

  useEffect(() => {
    setInvoiceRef(p.supplierInvoiceRef ?? '');
    setDueDate(p.dueDate ?? '');
  }, [p.supplierInvoiceRef, p.dueDate]);

  return (
    <Modal
      wide
      title={`Achat ${p.number}`}
      onClose={onClose}
      footer={
        <>
          {canCancel && (
            <button
              onClick={() => window.confirm('Annuler cette commande fournisseur ?') && run(() => actions.onCancel(p))}
              className={`${secondaryButton.replace('text-gray-600', 'text-red-600')} mr-auto`}
            >
              <Ban size={16} /> Annuler
            </button>
          )}
          {p.status === PurchaseStatus.DRAFT && (
            <>
              <button onClick={onEdit} className={secondaryButton}><Pencil size={16} /> Modifier</button>
              <button onClick={() => run(() => actions.onOrder(p))} className={primaryButton}>Passer la commande <ArrowRight size={16} /></button>
            </>
          )}
          {canReceive && (
            <button onClick={() => setReceiving(true)} className={primaryButton}>
              <PackageCheck size={16} /> {p.status === PurchaseStatus.PARTIAL ? 'Réceptionner le reste' : 'Réceptionner'}
            </button>
          )}
          {isPurchaseToPay(p) && (
            <button
              onClick={() =>
                window.confirm(`Confirmez-vous le paiement de ${formatEUR(t.totalTTC)} TTC à ${p.supplierName} ?`) && run(() => actions.onPay(p))
              }
              className={primaryButton}
            >
              <Wallet size={16} /> Marquer payé
            </button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-start gap-2 whitespace-pre-line">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <PurchaseBadge status={p.status} />
          {p.paidDate && <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">Payé</span>}
          <div className="ml-auto flex flex-wrap gap-2">
            {p.status !== PurchaseStatus.CANCELED && (
              <button onClick={() => setPrinting(true)} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100">
                <FileText size={14} /> Bon de commande
              </button>
            )}
            {p.status === PurchaseStatus.ORDERED && supplier?.email && (
              <a href={orderMailto(p, supplier, company)} className="flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-100">
                <Mail size={14} /> Préparer l'e-mail au fournisseur
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fournisseur</p>
            <p className="font-bold">{p.supplierName}</p>
            {supplier && (
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                <p>{supplier.address}</p>
                {supplier.contactName && <p>{supplier.contactName} · {supplier.phone}</p>}
              </div>
            )}
          </div>
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ['Commandé le', formatDate(p.date)],
              ['Attendu le', formatDate(p.expectedDate)],
              ['Reçu le', formatDate(p.receivedDate)],
              ['Échéance', formatDate(p.dueDate)],
              ['Payé le', formatDate(p.paidDate)],
              ['Facture fournisseur', p.supplierInvoiceRef ?? '—']
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
                <p className={`text-sm font-bold ${label === 'Échéance' && isPurchaseToPay(p) && p.dueDate && p.dueDate < today ? 'text-red-600' : ''}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Désignation</th>
              <th className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase">Commandé</th>
              <th className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase">Reçu</th>
              <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase">P.U. HT</th>
              <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Coût de revient</th>
              <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {p.lines.map((l, i) => (
              <tr key={l.productId}>
                <td className="py-3">
                  <p className="text-sm font-bold text-gray-800">{l.label}</p>
                  <p className="text-[11px] text-gray-400 font-mono">{l.sku}</p>
                </td>
                <td className="py-3 text-center text-sm">{l.quantity}</td>
                <td className={`py-3 text-center text-sm font-bold ${l.receivedQty === l.quantity ? 'text-teal-600' : l.receivedQty > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {l.receivedQty}
                </td>
                <td className="py-3 text-right text-sm">{formatEUR(l.unitCost)}</td>
                <td className="py-3 text-right text-sm text-gray-500">{formatEUR(landedUnitCost(p, i))}</td>
                <td className="py-3 text-right text-sm font-bold">{formatEUR(purchaseLineTotal(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4 flex-1">
            {received && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Facture du fournisseur</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <Field label="N° de facture">
                    <input className={`${inputClass} bg-white`} value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} />
                  </Field>
                  <Field label="Échéance">
                    <input type="date" className={`${inputClass} bg-white`} value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </Field>
                  <button onClick={() => run(() => actions.onInvoice(p, { ref: invoiceRef, dueDate }))} className={secondaryButton}>
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
            {p.notes && <p className="bg-amber-50 text-amber-800 rounded-lg p-3 text-xs"><b>Notes :</b> {p.notes}</p>}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Historique</p>
              <ol className="space-y-1">
                {p.history.map((h, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-3"><span className="text-gray-400 w-20">{formatDate(h.date)}</span> {h.status}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="w-full md:w-72 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Marchandises HT</span><span className="font-bold">{formatEUR(t.subtotalHT)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Frais de port HT</span><span className="font-bold">{formatEUR(t.shippingHT)}</span></div>
            {t.vat.map(v => (
              <div key={v.rate} className="flex justify-between"><span className="text-gray-500">TVA {v.rate.toLocaleString('fr-FR')} %</span><span className="font-bold">{formatEUR(v.vat)}</span></div>
            ))}
            <div className="flex justify-between text-lg pt-3 border-t-2 border-teal-600">
              <span className="font-black text-teal-700">TOTAL TTC</span><span className="font-black text-teal-700">{formatEUR(t.totalTTC)}</span>
            </div>
          </div>
        </div>
      </div>

      {receiving && (
        <ReceiveForm
          purchase={p}
          products={products}
          onCancel={() => setReceiving(false)}
          onConfirm={quantities => {
            run(() => actions.onReceive(p, quantities));
            setReceiving(false);
          }}
        />
      )}
      {printing && <PurchaseDocument purchase={p} supplier={supplier} company={company} onClose={() => setPrinting(false)} />}
    </Modal>
  );
};

const ReceiveForm: React.FC<{
  purchase: PurchaseOrder;
  products: WholesaleProduct[];
  onCancel: () => void;
  onConfirm: (quantities: number[]) => void;
}> = ({ purchase, products, onCancel, onConfirm }) => {
  const [values, setValues] = useState(purchase.lines.map(l => String(remainingQty(l))));
  const parsed = values.map(v => parseNumber(v));
  const invalid = parsed.some((q, i) => !Number.isInteger(q) || q < 0 || q > remainingQty(purchase.lines[i]));
  const nothing = parsed.every(q => !q);

  return (
    <Modal
      title={`Réception ${purchase.number}`}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className={secondaryButton}>Annuler</button>
          <button onClick={() => onConfirm(parsed)} disabled={invalid || nothing} className={primaryButton}>
            <PackageCheck size={16} /> Entrer en stock
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Comptez les colis reçus. Une quantité inférieure laisse l'achat « reçu en partie » pour le reliquat.
        </p>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-2 text-left text-[10px] font-bold text-gray-400 uppercase">Produit</th>
              <th className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase">Attendu</th>
              <th className="py-2 text-left text-[10px] font-bold text-gray-400 uppercase w-24">Reçu</th>
              <th className="py-2 text-right text-[10px] font-bold text-gray-400 uppercase">Nouveau CMP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {purchase.lines.map((l, i) => {
              const product = products.find(x => x.id === l.productId);
              const q = parsed[i];
              const cmp = product && Number.isInteger(q) && q > 0 ? weightedAverageCost(product.stock, product.costPrice, q, landedUnitCost(purchase, i)) : product?.costPrice;
              return (
                <tr key={l.productId}>
                  <td className="py-2">
                    <p className="text-sm font-bold">{l.label}</p>
                    <p className="text-[11px] text-gray-400">stock actuel {product?.stock ?? '—'}</p>
                  </td>
                  <td className="py-2 text-center text-sm">{remainingQty(l)}</td>
                  <td className="py-2">
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      value={values[i]}
                      disabled={remainingQty(l) === 0}
                      onChange={e => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
                      aria-label={`Reçu ${l.sku}`}
                    />
                  </td>
                  <td className="py-2 text-right text-sm">
                    {cmp !== undefined && formatEUR(cmp)}
                    {product && cmp !== undefined && Math.abs(cmp - product.costPrice) >= 0.005 && (
                      <p className="text-[11px] text-gray-400">avant {formatEUR(product.costPrice)}</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {invalid && <p className="text-xs text-red-600">Chaque quantité doit être un entier entre 0 et la quantité attendue.</p>}
      </div>
    </Modal>
  );
};

const PurchaseDocument: React.FC<{
  purchase: PurchaseOrder;
  supplier?: Supplier;
  company: CompanySettings;
  onClose: () => void;
}> = ({ purchase: p, supplier, company, onClose }) => {
  const t = computePurchaseTotals(p);
  return (
    <Modal
      wide
      printable
      title={`Bon de commande ${p.number}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={secondaryButton}>Fermer</button>
          <button onClick={() => window.print()} className={primaryButton}><Printer size={16} /> Imprimer / PDF</button>
        </>
      }
    >
      <div className="print-area bg-white text-gray-900 max-w-[800px] mx-auto">
        <div className="flex justify-between items-start mb-10 gap-8">
          <div>
            <h3 className="text-xl font-black text-indigo-900 mb-3">{company.name}</h3>
            <div className="text-xs text-gray-500 space-y-0.5">
              <p>{company.address}</p>
              <p>SIRET : {company.siret}</p>
              <p>TVA intracommunautaire : {company.tvaIntra}</p>
              <p>{company.email} · {company.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-gray-200 uppercase mb-3">Bon de commande</h1>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-gray-400 uppercase tracking-widest">Fournisseur</p>
              <p className="text-base font-bold">{p.supplierName}</p>
              {supplier && (
                <>
                  <p className="text-gray-500">{supplier.address}</p>
                  <p className="text-gray-500">SIRET : {supplier.siret}</p>
                  {supplier.contactName && <p className="text-gray-500">À l'attention de {supplier.contactName}</p>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8 py-4 border-y border-gray-100">
          {[
            ['N° de commande', p.number],
            ['Date', formatDate(p.date)],
            ['Livraison souhaitée', formatDate(p.expectedDate)]
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
              <p className="text-sm font-bold whitespace-nowrap">{value}</p>
            </div>
          ))}
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Désignation</th>
              <th className="py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Réf.</th>
              <th className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase">Qté</th>
              <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase">P.U. HT</th>
              <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {p.lines.map(l => (
              <tr key={l.productId}>
                <td className="py-3 text-sm font-medium">{l.label}</td>
                <td className="py-3 text-xs font-mono text-gray-500">{l.sku}</td>
                <td className="py-3 text-center text-sm">{l.quantity}</td>
                <td className="py-3 text-right text-sm">{formatEUR(l.unitCost)}</td>
                <td className="py-3 text-right text-sm font-bold">{formatEUR(purchaseLineTotal(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Marchandises HT</span><span className="font-bold">{formatEUR(t.subtotalHT)}</span></div>
            {t.shippingHT > 0 && <div className="flex justify-between"><span className="text-gray-500">Frais de port HT</span><span className="font-bold">{formatEUR(t.shippingHT)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">TVA</span><span className="font-bold">{formatEUR(t.totalVAT)}</span></div>
            <div className="flex justify-between text-lg pt-2 border-t-2 border-indigo-600">
              <span className="font-black text-indigo-600">TOTAL TTC</span><span className="font-black text-indigo-600">{formatEUR(t.totalTTC)}</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 text-xs text-gray-500 space-y-1">
          <p><b>Livraison :</b> {company.address}</p>
          {p.notes && <p><b>Notes :</b> {p.notes}</p>}
          <p>Merci de rappeler notre numéro de commande {p.number} sur le bon de livraison et sur la facture.</p>
          {supplier && <p>Règlement à {supplier.paymentTermsDays} jours selon nos conditions convenues.</p>}
        </div>
      </div>
    </Modal>
  );
};

export default Purchases;
