
import React from 'react';
import { CalendarPlus, Mail, FileText, UserX, Clock, Target, CheckCircle2 } from 'lucide-react';
import { CompanySettings, CrmTask, Lead, WholesaleCustomer, WholesaleOrder, WholesaleSettings } from '../../types';
import { computeTotals, formatDate, formatEUR, isOverdue, todayISO } from '../../services/wholesalePricing';
import { OPEN_STAGES, customersToReactivate, daysBetween, nextTaskFor, quotesToChase, taskBuckets } from '../../services/wholesaleCrm';
import { TaskAdder, TaskList } from './CrmShared';

interface AgendaProps {
  tasks: CrmTask[];
  leads: Lead[];
  customers: WholesaleCustomer[];
  orders: WholesaleOrder[];
  settings: WholesaleSettings;
  company: CompanySettings;
  onAddTask: (ref: { leadId?: string; customerId?: string }, title: string, dueDate: string) => void;
  onCompleteTask: (task: CrmTask) => void;
  onOpenLead: (leadId: string) => void;
}

// Brouillon de relance de devis : s'ouvre dans la messagerie, rien ne part sans validation.
const quoteMailto = (order: WholesaleOrder, customer: WholesaleCustomer, company: CompanySettings, totalTTC: number) => {
  const body = [
    `Bonjour${customer.contactName ? ` ${customer.contactName}` : ''},`,
    '',
    `Je reviens vers vous au sujet de notre devis ${order.number} du ${formatDate(order.date)}, d'un montant de ${formatEUR(totalTTC)} TTC.`,
    'Avez-vous pu en prendre connaissance ? Je reste disponible pour l’ajuster (quantités, livraison) si besoin.',
    '',
    'Bien cordialement,',
    company.name,
    company.phone
  ].join('\n');
  return `mailto:${customer.email}?subject=${encodeURIComponent(`Votre devis ${order.number} — ${company.name}`)}&body=${encodeURIComponent(body)}`;
};

const CrmAgenda: React.FC<AgendaProps> = ({ tasks, leads, customers, orders, settings, company, onAddTask, onCompleteTask, onOpenLead }) => {
  const today = todayISO();
  const buckets = taskBuckets(tasks, today);
  const customerName = (id?: string) => customers.find(c => c.id === id)?.companyName;
  const leadName = (id?: string) => leads.find(l => l.id === id)?.companyName;
  const label = (t: CrmTask) => (t.leadId ? leadName(t.leadId) : customerName(t.customerId)) ?? 'Général';

  // Une suggestion déjà transformée en tâche ouverte n'est plus proposée en double.
  const planned = (title: string) => tasks.find(t => !t.done && t.title === title);

  const quotes = quotesToChase(orders, today);
  const dormant = customersToReactivate(customers, orders, settings, today);
  const lateInvoices = orders.filter(o => isOverdue(o, today));
  const idleLeads = leads.filter(l => OPEN_STAGES.includes(l.stage) && !nextTaskFor(tasks, { leadId: l.id }));
  const suggestionCount = quotes.length + dormant.length + lateInvoices.length + idleLeads.length;

  const PlanButton: React.FC<{ title: string; ref_: { leadId?: string; customerId?: string } }> = ({ title, ref_ }) => {
    const existing = planned(title);
    return existing ? (
      <span className="text-[11px] text-green-700 font-bold flex items-center gap-1 whitespace-nowrap"><CheckCircle2 size={12} /> prévu le {formatDate(existing.dueDate)}</span>
    ) : (
      <button onClick={() => onAddTask(ref_, title, today)} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 whitespace-nowrap">
        <CalendarPlus size={12} /> Planifier
      </button>
    );
  };

  const groups: { title: string; tasks: CrmTask[]; tone: string }[] = [
    { title: 'En retard', tasks: buckets.overdue, tone: 'text-red-600' },
    { title: "Aujourd'hui", tasks: buckets.today, tone: 'text-amber-600' },
    { title: '7 prochains jours', tasks: buckets.week, tone: 'text-gray-700' },
    { title: 'Plus tard', tasks: buckets.later, tone: 'text-gray-500' }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Mes actions</h3>
            <span className="text-xs text-gray-400">
              {buckets.overdue.length} en retard · {buckets.today.length} aujourd'hui
            </span>
          </div>
          {groups.map(g => (
            <div key={g.title} className="space-y-2">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${g.tone}`}>{g.title} · {g.tasks.length}</p>
              {g.tasks.length === 0 ? (
                <p className="text-xs text-gray-300">Rien ici.</p>
              ) : (
                <TaskList tasks={g.tasks} today={today} onComplete={onCompleteTask} label={label} />
              )}
            </div>
          ))}
          <div className="pt-3 border-t border-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Ajouter une action générale</p>
            <TaskAdder onAdd={(title, date) => onAddTask({}, title, date)} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-indigo-900 text-white rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Suggestions</p>
          <p className="text-2xl font-black mt-1">{suggestionCount}</p>
          <p className="text-xs text-indigo-200">relances repérées dans les ventes et le pipeline</p>
        </div>

        <Section icon={FileText} title="Devis sans réponse" empty="Aucun devis de plus de 3 jours en attente.">
          {quotes.map(({ order, age, level }) => {
            const customer = customers.find(c => c.id === order.customerId);
            const total = computeTotals(order.lines, settings).totalTTC;
            return (
              <Item key={order.id} title={order.customerName} sub={`${order.number} · ${formatEUR(total)} TTC · envoyé il y a ${age} j`} badge={level} badgeTone={level === 'J+7' ? 'red' : 'amber'}>
                <PlanButton title={`Relancer le devis ${order.number}`} ref_={{ customerId: order.customerId }} />
                {customer?.email && (
                  <a href={quoteMailto(order, customer, company, total)} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <Mail size={12} /> E-mail
                  </a>
                )}
              </Item>
            );
          })}
        </Section>

        <Section icon={Clock} title="Factures en retard" empty="Aucune facture en retard.">
          {lateInvoices.map(o => (
            <Item key={o.id} title={o.customerName} sub={`${o.invoiceNumber} · ${formatEUR(computeTotals(o.lines, settings).totalTTC)} TTC · échue depuis ${daysBetween(o.dueDate!, today)} j`} badge="Paiement" badgeTone="red">
              <PlanButton title={`Relancer le paiement ${o.invoiceNumber}`} ref_={{ customerId: o.customerId }} />
            </Item>
          ))}
        </Section>

        <Section icon={UserX} title="Clients à relancer" empty="Tous les clients commandent à leur rythme.">
          {dormant.map(({ customer, insights }) => (
            <Item
              key={customer.id}
              title={customer.companyName}
              sub={`Dernière commande il y a ${insights.daysSinceLast} j${insights.averageIntervalDays ? ` · commande en moyenne tous les ${insights.averageIntervalDays} j` : ''}`}
              badge={insights.health}
              badgeTone={insights.health === 'Inactif' ? 'red' : 'amber'}
            >
              <PlanButton title={`Appeler ${customer.companyName} pour la prochaine commande`} ref_={{ customerId: customer.id }} />
            </Item>
          ))}
        </Section>

        <Section icon={Target} title="Prospects sans action prévue" empty="Chaque prospect a sa prochaine action.">
          {idleLeads.map(l => (
            <Item key={l.id} title={l.companyName} sub={`${l.stage} · ${formatEUR(l.estimatedMonthlyHT)} HT / mois`}>
              <PlanButton title={`Relancer ${l.companyName}`} ref_={{ leadId: l.id }} />
              <button onClick={() => onOpenLead(l.id)} className="text-[11px] font-bold text-gray-500 hover:text-gray-700">Ouvrir</button>
            </Item>
          ))}
        </Section>
      </div>
    </div>
  );
};

const Section: React.FC<{ icon: React.FC<{ size?: number; className?: string }>; title: string; empty: string; children: React.ReactNode }> = ({
  icon: Icon,
  title,
  empty,
  children
}) => {
  const items = React.Children.toArray(children);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <h4 className="text-sm font-bold flex items-center gap-2"><Icon size={16} className="text-indigo-600" /> {title} <span className="text-gray-400 font-medium">{items.length}</span></h4>
      {items.length === 0 ? <p className="text-xs text-gray-400">{empty}</p> : <div className="space-y-2">{items}</div>}
    </div>
  );
};

const Item: React.FC<{ title: string; sub: string; badge?: string; badgeTone?: 'red' | 'amber'; children: React.ReactNode }> = ({ title, sub, badge, badgeTone, children }) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-medium">{title}</p>
      {badge && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${badgeTone === 'red' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{badge}</span>
      )}
    </div>
    <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
    <div className="flex gap-3 mt-2">{children}</div>
  </div>
);

export default CrmAgenda;
