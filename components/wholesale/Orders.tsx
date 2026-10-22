
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Pencil, Ban, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { OrderStatus, WholesaleCustomer, WholesaleOrder, WholesaleProduct, WholesaleSettings } from '../../types';
import {
  ALLOWED_TRANSITIONS,
  computeTotals,
  formatDate,
  formatEUR,
  isOverdue,
  lineTotalHT,
  todayISO
} from '../../services/wholesalePricing';
import OrderEditor from './OrderEditor';
import { Modal, StatusBadge, primaryButton, secondaryButton } from './ui';

// Action principale proposée à chaque étape.
const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string; confirm?: string }>> = {
  [OrderStatus.QUOTE]: { to: OrderStatus.CONFIRMED, label: 'Confirmer la commande' },
  [OrderStatus.CONFIRMED]: { to: OrderStatus.PREPARED, label: 'Marquer préparée' },
  [OrderStatus.PREPARED]: { to: OrderStatus.DELIVERED, label: 'Marquer livrée' },
  [OrderStatus.DELIVERED]: {
    to: OrderStatus.INVOICED,
    label: 'Émettre la facture',
    confirm: "Émettre la facture ? Une fois émise, elle reçoit un numéro définitif et ne peut plus être modifiée (il faudra un avoir)."
  },
  [OrderStatus.INVOICED]: {
    to: OrderStatus.PAID,
    label: 'Enregistrer le paiement',
    confirm: 'Confirmez-vous avoir reçu le paiement sur le compte bancaire ?'
  }
};

type Filter = 'all' | 'open' | 'overdue' | OrderStatus;

interface OrdersProps {
  orders: WholesaleOrder[];
  products: WholesaleProduct[];
  customers: WholesaleCustomer[];
  settings: WholesaleSettings;
  startWithCustomer?: string | null;
  onStarted?: () => void;
  onSave: (order: WholesaleOrder, confirm: boolean) => string | null;
  onChangeStatus: (order: WholesaleOrder, to: OrderStatus) => string | null;
}

const Orders: React.FC<OrdersProps> = ({
  orders,
  products,
  customers,
  settings,
  startWithCustomer,
  onStarted,
  onSave,
  onChangeStatus
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editor, setEditor] = useState<{ order?: WholesaleOrder; customerId?: string } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = todayISO();

  // Ouverture directe depuis la fiche client (« Nouvelle commande »).
  useEffect(() => {
    if (startWithCustomer) {
      setEditor({ customerId: startWithCustomer });
      onStarted?.();
    }
  }, [startWithCustomer]);

  const isOpen = (o: WholesaleOrder) =>
    o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.PREPARED || o.status === OrderStatus.DELIVERED;

  const filters: { id: Filter; label: string; test: (o: WholesaleOrder) => boolean }[] = [
    { id: 'all', label: 'Toutes', test: () => true },
    { id: OrderStatus.QUOTE, label: 'Devis', test: o => o.status === OrderStatus.QUOTE },
    { id: 'open', label: 'En cours', test: isOpen },
    { id: OrderStatus.INVOICED, label: 'À encaisser', test: o => o.status === OrderStatus.INVOICED },
    { id: 'overdue', label: 'En retard', test: o => isOverdue(o, today) },
    { id: OrderStatus.PAID, label: 'Payées', test: o => o.status === OrderStatus.PAID },
    { id: OrderStatus.CANCELED, label: 'Annulées', test: o => o.status === OrderStatus.CANCELED }
  ];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = filters.find(f => f.id === filter)!.test;
    return orders
      .filter(test)
      .filter(o => !q || o.number.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || (o.invoiceNumber ?? '').toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number));
  }, [orders, query, filter]);

  const viewing = orders.find(o => o.id === viewingId);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center justify-between">
        <div className="flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 w-full max-w-sm">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="N° de commande, de facture ou client"
            className="bg-transparent border-none focus:ring-0 outline-none text-sm w-full"
          />
        </div>
        <button onClick={() => setEditor({})} className={primaryButton}>
          <Plus size={16} /> Nouvelle commande
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(f => {
          const count = orders.filter(f.test).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                filter === f.id
                  ? f.id === 'overdue' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f.label} <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Commande</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Client</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Total HT</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Total TTC</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Marge</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Statut</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map(o => {
              const t = computeTotals(o.lines, settings);
              const late = isOverdue(o, today);
              return (
                <tr key={o.id} onClick={() => setViewingId(o.id)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-indigo-600">{o.number}</p>
                    {o.invoiceNumber && <p className="text-[11px] text-gray-400">{o.invoiceNumber}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{o.customerName}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{formatDate(o.date)}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatEUR(t.totalHT)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-right">{formatEUR(t.totalTTC)}</td>
                  <td className={`px-6 py-4 text-sm text-right font-bold ${t.marginRate < settings.minMarginRate ? 'text-red-600' : 'text-green-600'}`}>
                    {t.marginRate.toLocaleString('fr-FR')} %
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={o.status} />
                      {late && (
                        <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                          <Clock size={11} /> échue le {formatDate(o.dueDate)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Eye size={16} className="text-gray-400 inline" />
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">Aucune commande dans cette vue.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <OrderDetail
          order={viewing}
          customer={customers.find(c => c.id === viewing.customerId)}
          settings={settings}
          today={today}
          error={error}
          onClose={() => {
            setViewingId(null);
            setError(null);
          }}
          onEdit={() => {
            setEditor({ order: viewing });
            setViewingId(null);
          }}
          onChangeStatus={to => setError(onChangeStatus(viewing, to))}
        />
      )}

      {editor && (
        <OrderEditor
          order={editor.order}
          initialCustomerId={editor.customerId}
          products={products}
          customers={customers}
          orders={orders}
          settings={settings}
          onCancel={() => setEditor(null)}
          onSave={(order, confirm) => {
            setError(onSave(order, confirm));
            setEditor(null);
            setViewingId(order.id);
          }}
        />
      )}
    </div>
  );
};

const OrderDetail: React.FC<{
  order: WholesaleOrder;
  customer?: WholesaleCustomer;
  settings: WholesaleSettings;
  today: string;
  error: string | null;
  onClose: () => void;
  onEdit: () => void;
  onChangeStatus: (to: OrderStatus) => void;
}> = ({ order, customer, settings, today, error, onClose, onEdit, onChangeStatus }) => {
  const t = computeTotals(order.lines, settings);
  const next = NEXT_STEP[order.status];
  const canCancel = ALLOWED_TRANSITIONS[order.status].includes(OrderStatus.CANCELED);
  const late = isOverdue(order, today);

  const run = (to: OrderStatus, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    onChangeStatus(to);
  };

  return (
    <Modal
      wide
      title={`Commande ${order.number}`}
      onClose={onClose}
      footer={
        <>
          {canCancel && (
            <button
              onClick={() =>
                run(
                  OrderStatus.CANCELED,
                  order.status === OrderStatus.QUOTE
                    ? 'Annuler ce devis ?'
                    : 'Annuler cette commande ? Les produits seront remis en stock.'
                )
              }
              className={`${secondaryButton.replace('text-gray-600', 'text-red-600')} mr-auto`}
            >
              <Ban size={16} /> Annuler
            </button>
          )}
          {order.status === OrderStatus.QUOTE && (
            <button onClick={onEdit} className={secondaryButton}>
              <Pencil size={16} /> Modifier
            </button>
          )}
          {next && (
            <button onClick={() => run(next.to, next.confirm)} className={primaryButton}>
              {next.label} <ArrowRight size={16} />
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
          <StatusBadge status={order.status} />
          {late && <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-red-600 text-white">En retard</span>}
          {order.invoiceNumber && <span className="text-sm text-gray-500">Facture <b className="text-gray-800">{order.invoiceNumber}</b></span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Client</p>
            <p className="font-bold">{order.customerName}</p>
            {customer && (
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                <p>{customer.address}</p>
                <p>SIRET {customer.siret}</p>
                {customer.contactName && <p>{customer.contactName} · {customer.phone}</p>}
              </div>
            )}
          </div>
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ['Commande', formatDate(order.date)],
              ['Livraison', formatDate(order.deliveryDate)],
              ['Facture', formatDate(order.invoiceDate)],
              ['Échéance', formatDate(order.dueDate)],
              ['Payée le', formatDate(order.paidDate)],
              ['Marge', `${formatEUR(t.marginHT)} · ${t.marginRate.toLocaleString('fr-FR')} %`]
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
                <p className={`text-sm font-bold ${label === 'Échéance' && late ? 'text-red-600' : ''}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Désignation</th>
              <th className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase">Qté</th>
              <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase">P.U. HT</th>
              <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {order.lines.map(l => (
              <tr key={l.productId}>
                <td className="py-3">
                  <p className="text-sm font-bold text-gray-800">{l.label}</p>
                  <p className="text-[11px] text-gray-400 font-mono">{l.sku}</p>
                </td>
                <td className="py-3 text-center text-sm">{l.quantity}</td>
                <td className="py-3 text-right text-sm">{formatEUR(l.unitPrice)}</td>
                <td className="py-3 text-right text-sm font-bold">{formatEUR(lineTotalHT(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-3 text-sm">
            {order.notes && (
              <p className="bg-amber-50 text-amber-800 rounded-lg p-3 text-xs"><b>Notes :</b> {order.notes}</p>
            )}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Historique</p>
              <ol className="space-y-1">
                {order.history.map((h, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-3">
                    <span className="text-gray-400 w-20">{formatDate(h.date)}</span> {h.status}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="w-full md:w-72 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Sous-total HT</span><span className="font-bold">{formatEUR(t.subtotalHT)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Livraison HT</span><span className="font-bold">{t.shippingHT === 0 ? 'Offerte' : formatEUR(t.shippingHT)}</span></div>
            {t.vat.map(v => (
              <div key={v.rate} className="flex justify-between">
                <span className="text-gray-500">TVA {v.rate.toLocaleString('fr-FR')} %</span><span className="font-bold">{formatEUR(v.vat)}</span>
              </div>
            ))}
            <div className="flex justify-between text-lg pt-3 border-t-2 border-indigo-600">
              <span className="font-black text-indigo-600">TOTAL TTC</span><span className="font-black text-indigo-600">{formatEUR(t.totalTTC)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Orders;
