
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import {
  Activity,
  ActivityType,
  CompanySettings,
  CrmTask,
  Lead,
  WholesaleCustomer,
  WholesaleOrder,
  WholesaleSettings
} from '../../types';
import { taskBuckets } from '../../services/wholesaleCrm';
import { todayISO } from '../../services/wholesalePricing';
import CrmAgenda from './CrmAgenda';
import CrmPipeline, { CrmActions } from './CrmPipeline';
import { Timeline } from './CrmShared';
import { inputClass } from './ui';

type CrmView = 'agenda' | 'pipeline' | 'journal';

interface CrmProps extends CrmActions {
  leads: Lead[];
  activities: Activity[];
  tasks: CrmTask[];
  customers: WholesaleCustomer[];
  orders: WholesaleOrder[];
  settings: WholesaleSettings;
  company: CompanySettings;
}

const Crm: React.FC<CrmProps> = props => {
  const { leads, activities, tasks, customers } = props;
  const [view, setView] = useState<CrmView>('agenda');
  const [focusLead, setFocusLead] = useState<string | null>(null);
  const buckets = taskBuckets(tasks, todayISO());
  const urgent = buckets.overdue.length + buckets.today.length;

  const views: { id: CrmView; label: string; badge?: number }[] = [
    { id: 'agenda', label: 'À faire', badge: urgent },
    { id: 'pipeline', label: 'Prospects' },
    { id: 'journal', label: 'Historique' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-gray-200">
        {views.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px flex items-center gap-2 ${
              view === v.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {v.label}
            {!!v.badge && <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">{v.badge}</span>}
          </button>
        ))}
      </div>

      {view === 'agenda' && (
        <CrmAgenda
          tasks={tasks}
          leads={leads}
          customers={customers}
          orders={props.orders}
          settings={props.settings}
          company={props.company}
          onAddTask={props.onAddTask}
          onCompleteTask={props.onCompleteTask}
          onOpenLead={id => {
            setFocusLead(id);
            setView('pipeline');
          }}
        />
      )}
      {view === 'pipeline' && <CrmPipeline {...props} focusLeadId={focusLead} onFocused={() => setFocusLead(null)} />}
      {view === 'journal' && <Journal activities={activities} leads={leads} customers={customers} />}
    </div>
  );
};

const Journal: React.FC<{ activities: Activity[]; leads: Lead[]; customers: WholesaleCustomer[] }> = ({ activities, leads, customers }) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const who = (a: Activity) =>
    customers.find(c => c.id === a.customerId)?.companyName ?? leads.find(l => l.id === a.leadId)?.companyName;
  const q = query.trim().toLowerCase();
  const visible = activities
    .filter(a => !type || a.type === type)
    .filter(a => !q || a.subject.toLowerCase().includes(q) || (a.notes ?? '').toLowerCase().includes(q) || (who(a) ?? '').toLowerCase().includes(q));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h3 className="font-bold">Tous les contacts <span className="text-gray-400 font-medium">{visible.length}</span></h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-72">
            <Search size={16} className="text-gray-400 mr-2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un client, un sujet" className="bg-transparent border-none focus:ring-0 outline-none text-sm w-full" />
          </div>
          <select className={`${inputClass} w-auto`} value={type} onChange={e => setType(e.target.value)} aria-label="Type de contact">
            <option value="">Tous les types</option>
            {Object.values(ActivityType).map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <Timeline activities={visible} label={who} />
    </div>
  );
};

export default Crm;
