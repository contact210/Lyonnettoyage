
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Wallet, Truck, FileText, AlertTriangle, Package, Clock, Warehouse, Receipt, Target, ArrowRight } from 'lucide-react';
import { CrmTask, Lead, OrderStatus, PurchaseOrder, WholesaleCustomer, WholesaleOrder, WholesaleProduct, WholesaleSettings } from '../../types';
import { computeTotals, formatDate, formatEUR, isOverdue, lineTotalHT, todayISO } from '../../services/wholesalePricing';
import { computePurchaseTotals, isPurchaseToPay, reorderSuggestions, reservedQuantities } from '../../services/wholesaleStock';
import { OPEN_STAGES, customersToReactivate, quotesToChase, taskBuckets, weightedPipeline } from '../../services/wholesaleCrm';

interface OverviewProps {
  orders: WholesaleOrder[];
  products: WholesaleProduct[];
  purchases: PurchaseOrder[];
  customers: WholesaleCustomer[];
  leads: Lead[];
  tasks: CrmTask[];
  settings: WholesaleSettings;
  onGoTo: (tab: 'crm' | 'orders' | 'purchases' | 'stock') => void;
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const daysBetween = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000);

const Overview: React.FC<OverviewProps> = ({ orders, products, purchases, customers, leads, tasks, settings, onGoTo }) => {
  const today = todayISO();
  const month = today.slice(0, 7);

  const data = useMemo(() => {
    const invoiced = orders.filter(o => o.status === OrderStatus.INVOICED || o.status === OrderStatus.PAID);
    const withTotals = (list: WholesaleOrder[]) => list.map(o => ({ order: o, totals: computeTotals(o.lines, settings) }));

    const thisMonth = withTotals(invoiced.filter(o => o.invoiceDate?.startsWith(month)));
    const revenueHT = thisMonth.reduce((s, x) => s + x.totals.totalHT, 0);
    const marginHT = thisMonth.reduce((s, x) => s + x.totals.marginHT, 0);
    const goodsHT = thisMonth.reduce((s, x) => s + x.totals.subtotalHT, 0);

    const toCollect = withTotals(orders.filter(o => o.status === OrderStatus.INVOICED));
    const overdue = toCollect.filter(x => isOverdue(x.order, today));

    const open = withTotals(orders.filter(o => [OrderStatus.CONFIRMED, OrderStatus.PREPARED, OrderStatus.DELIVERED].includes(o.status)));
    const quotes = withTotals(orders.filter(o => o.status === OrderStatus.QUOTE));

    // Chiffre d'affaires facturé des 6 derniers mois.
    const [y, m] = month.split('-').map(Number);
    const chart = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(y, m - 1 - (5 - i), 1));
      const key = d.toISOString().slice(0, 7);
      const ht = invoiced
        .filter(o => o.invoiceDate?.startsWith(key))
        .reduce((s, o) => s + computeTotals(o.lines, settings).totalHT, 0);
      return { name: MONTHS[d.getUTCMonth()], ca: Math.round(ht * 100) / 100 };
    });

    // Meilleures ventes (commandes confirmées et suivantes).
    const sold = new Map<string, { label: string; qty: number; ht: number }>();
    orders
      .filter(o => o.status !== OrderStatus.QUOTE && o.status !== OrderStatus.CANCELED)
      .forEach(o =>
        o.lines.forEach(l => {
          const s = sold.get(l.productId) ?? { label: l.label, qty: 0, ht: 0 };
          s.qty += l.quantity;
          s.ht += lineTotalHT(l);
          sold.set(l.productId, s);
        })
      );
    const top = [...sold.values()].sort((a, b) => b.ht - a.ht).slice(0, 5);

    // Réappro en tenant compte des achats déjà en route.
    const restock = [...reorderSuggestions(products, purchases).values()].flat();

    const reserved = reservedQuantities(orders);
    const stockValue = products
      .filter(p => p.active)
      .reduce((s, p) => s + (p.stock + (reserved.get(p.id) ?? 0)) * p.costPrice, 0);
    const toPay = purchases.filter(isPurchaseToPay).map(p => ({ purchase: p, ttc: computePurchaseTotals(p).totalTTC }));
    const toPayLate = toPay.filter(x => x.purchase.dueDate && x.purchase.dueDate < today);

    return { revenueHT, marginHT, goodsHT, toCollect, overdue, open, quotes, chart, top, restock, stockValue, toPay, toPayLate };
  }, [orders, products, purchases, settings, today, month]);

  const sum = (list: { totals: { totalTTC: number } }[]) => list.reduce((s, x) => s + x.totals.totalTTC, 0);
  const marginRate = data.goodsHT > 0 ? (data.marginHT / data.goodsHT) * 100 : 0;
  const monthLabel = new Date(`${today}T00:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const sumTTC = (list: { ttc: number }[]) => list.reduce((s, x) => s + x.ttc, 0);

  const kpis = [
    { label: `CA facturé · ${monthLabel}`, value: `${formatEUR(data.revenueHT)} HT`, sub: `Marge ${formatEUR(data.marginHT)} · ${marginRate.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', warn: data.goodsHT > 0 && marginRate < settings.minMarginRate },
    { label: 'À encaisser', value: `${formatEUR(sum(data.toCollect))} TTC`, sub: data.overdue.length ? `dont ${formatEUR(sum(data.overdue))} en retard` : `${data.toCollect.length} facture(s), aucune en retard`, icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50', warn: data.overdue.length > 0 },
    { label: 'Commandes en cours', value: String(data.open.length), sub: `${formatEUR(sum(data.open))} TTC à livrer ou facturer`, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', warn: false },
    { label: 'Devis en attente', value: String(data.quotes.length), sub: `${formatEUR(sum(data.quotes))} TTC à transformer`, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', warn: false },
    { label: 'Valeur du stock', value: formatEUR(data.stockValue), sub: `${data.restock.length} produit(s) à réapprovisionner`, icon: Warehouse, color: 'text-indigo-600', bg: 'bg-indigo-50', warn: false, tab: 'stock' as const },
    { label: 'À payer aux fournisseurs', value: `${formatEUR(sumTTC(data.toPay))} TTC`, sub: data.toPayLate.length ? `dont ${formatEUR(sumTTC(data.toPayLate))} échus` : `${data.toPay.length} facture(s) fournisseur`, icon: Receipt, color: 'text-teal-600', bg: 'bg-teal-50', warn: data.toPayLate.length > 0, tab: 'purchases' as const }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map(k => (
          <button key={k.label} onClick={() => onGoTo('tab' in k ? k.tab : 'orders')} className="text-left bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className={`${k.bg} p-2 rounded-lg`}><k.icon className={k.color} size={22} /></div>
              {k.warn && <AlertTriangle className="text-red-500" size={18} />}
            </div>
            <p className="text-sm text-gray-500 mb-1 first-letter:uppercase">{k.label}</p>
            <h3 className="text-xl font-bold">{k.value}</h3>
            <p className={`text-xs mt-1 ${k.warn ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>{k.sub}</p>
          </button>
        ))}
      </div>

      <CrmBand
        tasks={tasks}
        leads={leads}
        quotes={quotesToChase(orders, today).length}
        dormant={customersToReactivate(customers, orders, settings, today).length}
        today={today}
        onOpen={() => onGoTo('crm')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Chiffre d'affaires facturé (HT)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} width={60} />
                <Tooltip
                  formatter={(v: number) => [formatEUR(v), 'CA HT']}
                  cursor={{ fill: '#eef2ff' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="ca" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Meilleures ventes</h3>
          {data.top.length === 0 && <p className="text-sm text-gray-400">Pas encore de ventes confirmées.</p>}
          <ol className="space-y-3">
            {data.top.map((t, i) => (
              <li key={t.label} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.label}</p>
                  <p className="text-xs text-gray-400">{t.qty} unités</p>
                </div>
                <span className="text-sm font-bold whitespace-nowrap">{formatEUR(t.ht)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Factures en retard</h3>
            <button onClick={() => onGoTo('orders')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Voir les commandes</button>
          </div>
          {data.overdue.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune facture en retard.</p>
          ) : (
            <div className="space-y-2">
              {data.overdue.map(({ order, totals }) => (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
                  <Clock className="text-red-500 shrink-0" size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{order.customerName}</p>
                    <p className="text-xs text-red-600">{order.invoiceNumber} · échue le {formatDate(order.dueDate)} ({daysBetween(order.dueDate!, today)} j)</p>
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">{formatEUR(totals.totalTTC)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Stock à réapprovisionner</h3>
            <button onClick={() => onGoTo('stock')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Voir le stock</button>
          </div>
          {data.restock.length === 0 ? (
            <p className="text-sm text-gray-400">Rien à commander : stock et achats en cours couvrent les seuils.</p>
          ) : (
            <div className="space-y-2">
              {data.restock.map(({ product, quantity, incoming }) => (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
                  <Package className="text-amber-600 shrink-0" size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name} — {product.packaging}</p>
                    <p className="text-xs text-amber-700">Stock {product.stock}{incoming ? ` + ${incoming} en commande` : ''} · seuil {product.minStock}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-800 whitespace-nowrap">Commander ~{quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Résumé commercial du jour, qui renvoie vers le CRM.
const CrmBand: React.FC<{ tasks: CrmTask[]; leads: Lead[]; quotes: number; dormant: number; today: string; onOpen: () => void }> = ({
  tasks,
  leads,
  quotes,
  dormant,
  today,
  onOpen
}) => {
  const buckets = taskBuckets(tasks, today);
  const open = leads.filter(l => OPEN_STAGES.includes(l.stage));
  const items = [
    { label: 'Actions du jour', value: `${buckets.today.length + buckets.overdue.length}`, sub: buckets.overdue.length ? `dont ${buckets.overdue.length} en retard` : 'à jour', warn: buckets.overdue.length > 0 },
    { label: 'Prospects en cours', value: String(open.length), sub: `${formatEUR(weightedPipeline(leads))} / mois pondérés` },
    { label: 'Devis à relancer', value: String(quotes), sub: 'sans réponse depuis 3 jours ou plus', warn: quotes > 0 },
    { label: 'Clients à relancer', value: String(dormant), sub: 'commandent moins que d’habitude', warn: dormant > 0 }
  ];
  return (
    <div className="bg-indigo-900 text-white rounded-xl p-5 flex flex-col lg:flex-row lg:items-center gap-5">
      <div className="flex items-center gap-3 lg:w-48 shrink-0">
        <div className="bg-indigo-800 p-2 rounded-lg"><Target size={20} className="text-indigo-200" /></div>
        <div>
          <p className="font-bold">Commercial</p>
          <p className="text-xs text-indigo-300">Aujourd'hui</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
        {items.map(i => (
          <div key={i.label}>
            <p className="text-[11px] uppercase tracking-wider text-indigo-300 font-bold">{i.label}</p>
            <p className={`text-2xl font-black ${i.warn ? 'text-amber-300' : ''}`}>{i.value}</p>
            <p className="text-[11px] text-indigo-200">{i.sub}</p>
          </div>
        ))}
      </div>
      <button onClick={onOpen} className="bg-white text-indigo-900 font-bold text-sm px-4 py-2 rounded-lg hover:bg-indigo-50 flex items-center gap-2 justify-center">
        Ouvrir le CRM <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default Overview;
