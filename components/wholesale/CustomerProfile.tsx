
import React from 'react';
import { Phone, Mail, MapPin, Pencil, ShoppingCart } from 'lucide-react';
import { Activity, CrmTask, WholesaleCustomer, WholesaleOrder, WholesaleSettings } from '../../types';
import { computeTotals, formatDate, formatEUR, todayISO } from '../../services/wholesalePricing';
import { CustomerHealth, customerInsights } from '../../services/wholesaleCrm';
import { profitability } from '../../services/wholesaleStock';
import { ActivityLogger, LogInput, TaskAdder, TaskList, Timeline } from './CrmShared';
import { Modal, StatusBadge, primaryButton, secondaryButton } from './ui';

export const HEALTH_COLORS: Record<CustomerHealth, string> = {
  'Actif': 'bg-green-100 text-green-700',
  'À relancer': 'bg-amber-100 text-amber-700',
  'Inactif': 'bg-red-100 text-red-700',
  'Sans commande': 'bg-gray-100 text-gray-600'
};

export const HealthBadge: React.FC<{ health: CustomerHealth }> = ({ health }) => (
  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${HEALTH_COLORS[health]}`}>{health}</span>
);

interface CustomerProfileProps {
  customer: WholesaleCustomer;
  orders: WholesaleOrder[];
  activities: Activity[];
  tasks: CrmTask[];
  settings: WholesaleSettings;
  onEdit: () => void;
  onNewOrder?: () => void;
  onLog: (input: LogInput) => void;
  onAddTask: (title: string, dueDate: string) => void;
  onCompleteTask: (task: CrmTask) => void;
  onClose: () => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customer: c,
  orders,
  activities,
  tasks,
  settings,
  onEdit,
  onNewOrder,
  onLog,
  onAddTask,
  onCompleteTask,
  onClose
}) => {
  const today = todayISO();
  const own = orders.filter(o => o.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number));
  const i = customerInsights(c.id, orders, settings, today);
  const products = profitability(own, 'product').sort((a, b) => b.quantity - a.quantity).slice(0, 6);
  const marginRate = i.revenueHT > 0 ? (i.marginHT / i.revenueHT) * 100 : 0;

  const kpis: [string, string, string?, boolean?][] = [
    ['Ventes HT', formatEUR(i.revenueHT), `${i.orderCount} commande${i.orderCount > 1 ? 's' : ''}`],
    ['Marge', formatEUR(i.marginHT), `${marginRate.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`, i.revenueHT > 0 && marginRate < settings.minMarginRate],
    ['Panier moyen', formatEUR(i.averageBasketHT), i.averageIntervalDays ? `tous les ${i.averageIntervalDays} j` : 'rythme à établir'],
    ['Dernière commande', i.lastOrder ? formatDate(i.lastOrder) : '—', i.daysSinceLast !== undefined ? `il y a ${i.daysSinceLast} j` : undefined],
    ['À encaisser', formatEUR(i.dueTTC), i.overdueTTC ? `dont ${formatEUR(i.overdueTTC)} en retard` : 'TTC', i.overdueTTC > 0]
  ];

  return (
    <Modal
      wide
      title={c.companyName}
      onClose={onClose}
      footer={
        <>
          <button onClick={onEdit} className={`${secondaryButton} mr-auto`}><Pencil size={16} /> Modifier la fiche</button>
          {onNewOrder && <button onClick={onNewOrder} className={primaryButton}><ShoppingCart size={16} /> Nouvelle commande</button>}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <HealthBadge health={i.health} />
          <span className="text-sm text-gray-500">
            {c.segment} · remise {c.discountRate.toLocaleString('fr-FR')} % · paiement {c.paymentTermsDays === 0 ? 'comptant' : `${c.paymentTermsDays} j`} · SIRET {c.siret}
            {c.tvaIntra && <> · TVA {c.tvaIntra}</>}
          </span>
          {i.openQuotes > 0 && <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{i.openQuotes} devis en attente</span>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {kpis.map(([label, value, sub, warn]) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
              <p className={`text-lg font-black ${warn ? 'text-red-600' : ''}`}>{value}</p>
              {sub && <p className={`text-[11px] ${warn ? 'text-red-600 font-bold' : 'text-gray-500'}`}>{sub}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <ActivityLogger onLog={onLog} />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Historique des contacts</p>
              <Timeline activities={activities} />
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
              <p className="font-bold">{c.contactName || 'Contact à préciser'}</p>
              {c.phone && <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-indigo-600"><Phone size={14} /> {c.phone}</a>}
              {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-indigo-600"><Mail size={14} /> {c.email}</a>}
              <p className="flex items-start gap-2 text-xs text-gray-500"><MapPin size={14} className="shrink-0" /> {c.address}</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Prochaines actions</p>
              <TaskList tasks={tasks} today={today} onComplete={onCompleteTask} />
              <TaskAdder onAdd={onAddTask} />
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Commandes</p>
              {own.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune commande.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {own.slice(0, 8).map(o => (
                    <li key={o.id} className="py-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-indigo-600">{o.number}</p>
                        <p className="text-[11px] text-gray-400">{formatDate(o.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{formatEUR(computeTotals(o.lines, settings).totalTTC)}</p>
                        <StatusBadge status={o.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {products.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Produits achetés</p>
                <ul className="space-y-1">
                  {products.map(p => (
                    <li key={p.id} className="text-xs flex justify-between gap-2">
                      <span className="truncate">{p.label}</span>
                      <b className="whitespace-nowrap">{p.quantity} u.</b>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerProfile;
