
import React, { useEffect, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Phone, Mail, Clock, AlertTriangle, UserCheck, Ban, RotateCcw, Pencil, ShoppingCart } from 'lucide-react';
import { Activity, CrmTask, CustomerSegment, Lead, LeadSource, LeadStage } from '../../types';
import { formatDate, formatEUR, todayISO } from '../../services/wholesalePricing';
import {
  LEAD_SOURCES,
  OPEN_STAGES,
  STAGE_PROBABILITY,
  conversionRate,
  daysBetween,
  nextTaskFor,
  pipelineSummary,
  sourceStats,
  taskBuckets,
  weightedPipeline
} from '../../services/wholesaleCrm';
import { ActivityLogger, LogInput, TaskAdder, TaskList, Timeline, dueClass } from './CrmShared';
import { Field, Modal, inputClass, newId, parseNumber, primaryButton, secondaryButton } from './ui';

const STAGE_COLORS: Record<LeadStage, string> = {
  [LeadStage.NEW]: 'bg-gray-100 text-gray-700',
  [LeadStage.CONTACTED]: 'bg-blue-100 text-blue-700',
  [LeadStage.MEETING]: 'bg-amber-100 text-amber-700',
  [LeadStage.PROPOSAL]: 'bg-purple-100 text-purple-700',
  [LeadStage.NEGOTIATION]: 'bg-indigo-100 text-indigo-700',
  [LeadStage.WON]: 'bg-green-100 text-green-700',
  [LeadStage.LOST]: 'bg-red-100 text-red-700'
};

export const StageBadge: React.FC<{ stage: LeadStage }> = ({ stage }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${STAGE_COLORS[stage]}`}>{stage}</span>
);

export interface ConvertDetails {
  siret: string;
  tvaIntra?: string;
  discountRate: number;
  paymentTermsDays: number;
}

export interface CrmActions {
  onSaveLead: (lead: Lead) => void;
  onMoveLead: (lead: Lead, to: LeadStage, lostReason?: string) => string | null;
  onConvert: (lead: Lead, details: ConvertDetails) => string | null;
  onLog: (ref: { leadId?: string; customerId?: string }, input: LogInput) => void;
  onAddTask: (ref: { leadId?: string; customerId?: string }, title: string, dueDate: string) => void;
  onCompleteTask: (task: CrmTask) => void;
  onStartQuote: (customerId: string) => void;
}

interface PipelineProps extends CrmActions {
  leads: Lead[];
  activities: Activity[];
  tasks: CrmTask[];
  focusLeadId?: string | null;
  onFocused?: () => void;
}

const CrmPipeline: React.FC<PipelineProps> = props => {
  const { leads, activities, tasks, onMoveLead } = props;
  const [query, setQuery] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [editing, setEditing] = useState<Lead | 'new' | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = todayISO();

  // Ouverture directe d'un prospect depuis « À faire ».
  useEffect(() => {
    if (props.focusLeadId) {
      setOpenId(props.focusLeadId);
      props.onFocused?.();
    }
  }, [props.focusLeadId]);

  const q = query.trim().toLowerCase();
  const visible = leads.filter(l => !q || l.companyName.toLowerCase().includes(q) || l.contactName.toLowerCase().includes(q));
  const stages = showClosed ? [...OPEN_STAGES, LeadStage.WON, LeadStage.LOST] : OPEN_STAGES;
  const summary = pipelineSummary(visible);
  const openLeads = leads.filter(l => OPEN_STAGES.includes(l.stage));
  const overdueTasks = taskBuckets(tasks, today).overdue.length;
  const rate = conversionRate(leads);
  const opened = leads.find(l => l.id === openId);

  const step = (lead: Lead, dir: -1 | 1) => {
    const i = OPEN_STAGES.indexOf(lead.stage);
    const to = OPEN_STAGES[i + dir];
    if (to) setError(onMoveLead(lead, to));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Prospects en cours', value: String(openLeads.length), sub: `${formatEUR(openLeads.reduce((s, l) => s + l.estimatedMonthlyHT, 0))} HT / mois de potentiel` },
          { label: 'Potentiel pondéré', value: `${formatEUR(weightedPipeline(leads))} / mois`, sub: 'Potentiel × probabilité de l’étape' },
          { label: 'Taux de conversion', value: rate === null ? '—' : `${rate.toLocaleString('fr-FR')} %`, sub: `${leads.filter(l => l.stage === LeadStage.WON).length} gagnés · ${leads.filter(l => l.stage === LeadStage.LOST).length} perdus` },
          { label: 'Actions en retard', value: String(overdueTasks), sub: overdueTasks ? 'À traiter dans « À faire »' : 'Tout est à jour', warn: overdueTasks > 0 }
        ].map(k => (
          <div key={k.label} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{k.label}</p>
            <h3 className={`text-xl font-black ${k.warn ? 'text-red-600' : ''}`}>{k.value}</h3>
            <p className="text-[11px] text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 w-full max-w-sm">
          <Search size={16} className="text-gray-400 mr-2" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un prospect ou un contact" className="bg-transparent border-none focus:ring-0 outline-none text-sm w-full" />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            Afficher gagnés et perdus
          </label>
          <button onClick={() => setEditing('new')} className={primaryButton}><Plus size={16} /> Prospect</button>
        </div>
      </div>

      {error && (
        <p className="bg-red-50 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2"><AlertTriangle size={16} /> {error}</p>
      )}

      <div className="overflow-x-auto pb-2">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(230px, 1fr))` }}>
          {stages.map(stage => {
            const s = summary.find(x => x.stage === stage)!;
            const cards = visible.filter(l => l.stage === stage).sort((a, b) => a.stageDate.localeCompare(b.stageDate));
            return (
              <div key={stage} className="bg-gray-100/70 rounded-2xl p-3 space-y-3 min-h-[200px]">
                <div className="px-1">
                  <div className="flex items-center justify-between">
                    <StageBadge stage={stage} />
                    <span className="text-xs font-bold text-gray-500">{s.count}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {formatEUR(s.monthlyHT)} / mois · {STAGE_PROBABILITY[stage]} %
                  </p>
                </div>
                {cards.map(l => {
                  const next = nextTaskFor(tasks, { leadId: l.id });
                  const idle = daysBetween(l.stageDate, today);
                  const i = OPEN_STAGES.indexOf(l.stage);
                  return (
                    <div key={l.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-2">
                      <button onClick={() => setOpenId(l.id)} className="text-left w-full">
                        <p className="text-sm font-bold text-gray-900 hover:text-indigo-600">{l.companyName}</p>
                        <p className="text-xs text-gray-500">{l.contactName || '—'} · {l.source}</p>
                      </button>
                      <p className="text-xs"><b>{formatEUR(l.estimatedMonthlyHT)}</b><span className="text-gray-400"> HT / mois</span></p>
                      {OPEN_STAGES.includes(l.stage) && (
                        next ? (
                          <div className={`text-[11px] ${dueClass(next.dueDate, today)}`}>
                            <p className="font-bold flex items-center gap-1"><Clock size={11} /> {formatDate(next.dueDate)}</p>
                            <p className="truncate text-gray-600">{next.title}</p>
                          </div>
                        ) : (
                          <p className="text-[11px] font-bold text-red-500">Aucune action prévue</p>
                        )
                      )}
                      {l.stage === LeadStage.LOST && <p className="text-[11px] text-red-600">{l.lostReason}</p>}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                        <span className={`text-[10px] ${idle > 14 && OPEN_STAGES.includes(l.stage) ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                          {idle === 0 ? "aujourd'hui" : `depuis ${idle} j`}
                        </span>
                        {OPEN_STAGES.includes(l.stage) && (
                          <div className="flex gap-1">
                            <button onClick={() => step(l, -1)} disabled={i === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" aria-label={`Reculer ${l.companyName}`}>
                              <ChevronLeft size={14} />
                            </button>
                            <button onClick={() => step(l, 1)} disabled={i === OPEN_STAGES.length - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" aria-label={`Avancer ${l.companyName}`}>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold mb-3">D'où viennent les prospects</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-2 text-[10px] font-bold text-gray-400 uppercase">Origine</th>
              <th className="py-2 text-[10px] font-bold text-gray-400 uppercase text-right">Prospects</th>
              <th className="py-2 text-[10px] font-bold text-gray-400 uppercase text-right">Gagnés</th>
              <th className="py-2 text-[10px] font-bold text-gray-400 uppercase text-right">Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sourceStats(leads).map(s => (
              <tr key={s.source}>
                <td className="py-2 text-sm">{s.source}</td>
                <td className="py-2 text-sm text-right">{s.count}</td>
                <td className="py-2 text-sm text-right">{s.won}</td>
                <td className="py-2 text-sm text-right font-bold">{s.rate === null ? 'en cours' : `${s.rate.toLocaleString('fr-FR')} %`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {opened && (
        <LeadDetail
          lead={opened}
          activities={activities.filter(a => a.leadId === opened.id)}
          tasks={tasks.filter(t => t.leadId === opened.id)}
          today={today}
          actions={props}
          onEdit={() => {
            setEditing(opened);
            setOpenId(null);
          }}
          onClose={() => setOpenId(null)}
        />
      )}

      {editing && (
        <LeadForm
          lead={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSave={l => {
            props.onSaveLead(l);
            setEditing(null);
            setOpenId(l.id);
          }}
        />
      )}
    </div>
  );
};

const LeadDetail: React.FC<{
  lead: Lead;
  activities: Activity[];
  tasks: CrmTask[];
  today: string;
  actions: CrmActions;
  onEdit: () => void;
  onClose: () => void;
}> = ({ lead, activities, tasks, today, actions, onEdit, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [losing, setLosing] = useState(false);
  const [reason, setReason] = useState('');
  const [converting, setConverting] = useState(false);
  const isOpen = OPEN_STAGES.includes(lead.stage);

  return (
    <Modal
      wide
      title={lead.companyName}
      onClose={onClose}
      footer={
        <>
          {isOpen && (
            <button onClick={() => setLosing(true)} className={`${secondaryButton.replace('text-gray-600', 'text-red-600')} mr-auto`}>
              <Ban size={16} /> Perdu
            </button>
          )}
          {lead.stage === LeadStage.LOST && (
            <button onClick={() => setError(actions.onMoveLead(lead, LeadStage.CONTACTED))} className={`${secondaryButton} mr-auto`}>
              <RotateCcw size={16} /> Rouvrir
            </button>
          )}
          {lead.stage !== LeadStage.WON && <button onClick={onEdit} className={secondaryButton}><Pencil size={16} /> Modifier</button>}
          {isOpen && (
            <button onClick={() => setConverting(true)} className={primaryButton}><UserCheck size={16} /> Convertir en client</button>
          )}
          {lead.stage === LeadStage.WON && lead.customerId && (
            <button onClick={() => actions.onStartQuote(lead.customerId!)} className={primaryButton}><ShoppingCart size={16} /> Nouveau devis</button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {error && <p className="bg-red-50 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2"><AlertTriangle size={16} /> {error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <StageBadge stage={lead.stage} />
          <span className="text-sm text-gray-500">
            {lead.segment} · {lead.source} · potentiel <b className="text-gray-800">{formatEUR(lead.estimatedMonthlyHT)} HT / mois</b> · créé le {formatDate(lead.createdDate)}
          </span>
        </div>

        {isOpen && (
          <div className="flex flex-wrap gap-1.5">
            {OPEN_STAGES.map(s => (
              <button
                key={s}
                onClick={() => setError(actions.onMoveLead(lead, s))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  lead.stage === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {losing && (
          <div className="bg-red-50 rounded-xl p-4 flex flex-col md:flex-row gap-2">
            <input className={`${inputClass} bg-white flex-1`} value={reason} onChange={e => setReason(e.target.value)} placeholder="Pourquoi ? (prix, concurrent, pas de besoin…)" aria-label="Motif de perte" autoFocus />
            <button
              onClick={() => {
                const err = actions.onMoveLead(lead, LeadStage.LOST, reason);
                setError(err);
                if (!err) setLosing(false);
              }}
              className={primaryButton}
            >
              Confirmer la perte
            </button>
            <button onClick={() => setLosing(false)} className={secondaryButton}>Annuler</button>
          </div>
        )}

        {lead.stage === LeadStage.LOST && <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3"><b>Perdu :</b> {lead.lostReason}</p>}
        {lead.stage === LeadStage.WON && <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">Devenu client le {formatDate(lead.stageDate)}.</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {lead.stage !== LeadStage.WON && <ActivityLogger onLog={input => actions.onLog({ leadId: lead.id }, input)} />}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Historique des contacts</p>
              <Timeline activities={activities} />
            </div>
          </div>
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
              <p className="font-bold">{lead.contactName || 'Contact à préciser'}</p>
              {lead.phone && <a href={`tel:${lead.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-indigo-600"><Phone size={14} /> {lead.phone}</a>}
              {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-indigo-600"><Mail size={14} /> {lead.email}</a>}
              {lead.address && <p className="text-xs text-gray-500">{lead.address}</p>}
              {lead.notes && <p className="text-xs text-gray-600 pt-2 border-t border-gray-200 whitespace-pre-line">{lead.notes}</p>}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Prochaines actions</p>
              <TaskList tasks={tasks} today={today} onComplete={actions.onCompleteTask} showDone />
              {lead.stage !== LeadStage.WON && <TaskAdder onAdd={(title, date) => actions.onAddTask({ leadId: lead.id }, title, date)} />}
            </div>
          </div>
        </div>
      </div>

      {converting && (
        <ConvertForm
          lead={lead}
          onCancel={() => setConverting(false)}
          onConfirm={details => {
            const err = actions.onConvert(lead, details);
            if (!err) setConverting(false);
            return err;
          }}
        />
      )}
    </Modal>
  );
};

const ConvertForm: React.FC<{
  lead: Lead;
  onCancel: () => void;
  onConfirm: (details: ConvertDetails) => string | null;
}> = ({ lead, onCancel, onConfirm }) => {
  const [siret, setSiret] = useState('');
  const [tva, setTva] = useState('');
  const [discount, setDiscount] = useState(lead.segment === CustomerSegment.RESELLER ? '10' : '0');
  const [terms, setTerms] = useState('30');
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal
      title={`Convertir ${lead.companyName} en client`}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className={secondaryButton}>Annuler</button>
          <button
            onClick={() => setError(onConfirm({ siret, tvaIntra: tva, discountRate: parseNumber(discount), paymentTermsDays: Number(terms) }))}
            className={primaryButton}
          >
            <UserCheck size={16} /> Créer le client
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Le contact, l'adresse et le segment viennent du prospect. Complétez ce qu'il faut pour facturer.
        </p>
        {error && <p className="bg-red-50 text-red-700 text-sm rounded-xl p-3">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="SIRET">
            <input className={`${inputClass} font-mono`} inputMode="numeric" value={siret} onChange={e => setSiret(e.target.value)} placeholder="123 456 789 00012" autoFocus />
          </Field>
          <Field label="TVA intracommunautaire" hint="Facultatif pour les collectivités.">
            <input className={`${inputClass} font-mono`} value={tva} onChange={e => setTva(e.target.value)} placeholder="FR 12 123456789" />
          </Field>
          <Field label="Remise négociée (%)">
            <input className={inputClass} inputMode="decimal" value={discount} onChange={e => setDiscount(e.target.value)} />
          </Field>
          <Field label="Délai de paiement">
            <select className={inputClass} value={terms} onChange={e => setTerms(e.target.value)}>
              {[0, 15, 30, 45, 60].map(d => <option key={d} value={d}>{d === 0 ? 'Comptant' : `${d} jours`}</option>)}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
};

const LeadForm: React.FC<{ lead?: Lead; onCancel: () => void; onSave: (lead: Lead) => void }> = ({ lead, onCancel, onSave }) => {
  const today = todayISO();
  const [form, setForm] = useState({
    companyName: lead?.companyName ?? '',
    contactName: lead?.contactName ?? '',
    email: lead?.email ?? '',
    phone: lead?.phone ?? '',
    address: lead?.address ?? '',
    segment: lead?.segment ?? CustomerSegment.COMPANY,
    source: lead?.source ?? ('Téléphone' as LeadSource),
    estimatedMonthlyHT: String(lead?.estimatedMonthlyHT ?? ''),
    notes: lead?.notes ?? ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const submit = () => {
    const problems: string[] = [];
    const potential = form.estimatedMonthlyHT.trim() === '' ? 0 : parseNumber(form.estimatedMonthlyHT);
    if (!form.companyName.trim()) problems.push("Le nom de l'entreprise est obligatoire.");
    if (!form.phone.trim() && !form.email.trim()) problems.push('Indiquez au moins un téléphone ou un e-mail.');
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) problems.push("L'e-mail n'est pas valide.");
    if (!(potential >= 0)) problems.push('Le potentiel mensuel doit être un montant positif.');
    setErrors(problems);
    if (problems.length) return;
    onSave({
      id: lead?.id ?? newId('lead'),
      companyName: form.companyName.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      segment: form.segment,
      source: form.source,
      stage: lead?.stage ?? LeadStage.NEW,
      estimatedMonthlyHT: potential,
      createdDate: lead?.createdDate ?? today,
      stageDate: lead?.stageDate ?? today,
      lostReason: lead?.lostReason,
      customerId: lead?.customerId,
      notes: form.notes.trim() || undefined
    });
  };

  return (
    <Modal
      title={lead ? `Modifier ${lead.companyName}` : 'Nouveau prospect'}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className={secondaryButton}>Annuler</button>
          <button onClick={submit} className={primaryButton}>Enregistrer</button>
        </>
      }
    >
      <div className="space-y-5">
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 space-y-1">
            {errors.map(e => <p key={e} className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {e}</p>)}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Entreprise" className="md:col-span-2">
            <input className={inputClass} value={form.companyName} onChange={e => set({ companyName: e.target.value })} />
          </Field>
          <Field label="Contact">
            <input className={inputClass} value={form.contactName} onChange={e => set({ contactName: e.target.value })} />
          </Field>
          <Field label="Téléphone">
            <input className={inputClass} value={form.phone} onChange={e => set({ phone: e.target.value })} />
          </Field>
          <Field label="E-mail" className="md:col-span-2">
            <input className={inputClass} type="email" value={form.email} onChange={e => set({ email: e.target.value })} />
          </Field>
          <Field label="Adresse" className="md:col-span-2">
            <input className={inputClass} value={form.address} onChange={e => set({ address: e.target.value })} />
          </Field>
          <Field label="Segment">
            <select className={inputClass} value={form.segment} onChange={e => set({ segment: e.target.value as CustomerSegment })}>
              {Object.values(CustomerSegment).map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Origine">
            <select className={inputClass} value={form.source} onChange={e => set({ source: e.target.value as LeadSource })}>
              {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Achats mensuels estimés (€ HT)" hint="Sert à pondérer le pipeline.">
            <input className={inputClass} inputMode="decimal" value={form.estimatedMonthlyHT} onChange={e => set({ estimatedMonthlyHT: e.target.value })} />
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <textarea className={`${inputClass} h-20`} value={form.notes} onChange={e => set({ notes: e.target.value })} />
          </Field>
        </div>
      </div>
    </Modal>
  );
};

export default CrmPipeline;
