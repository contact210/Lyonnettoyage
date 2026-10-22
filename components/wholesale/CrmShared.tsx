
import React, { useState } from 'react';
import { Phone, Mail, MapPin, FlaskConical, StickyNote, CheckCircle2, Circle, Plus } from 'lucide-react';
import { Activity, ActivityType, CrmTask } from '../../types';
import { addDays, formatDate, todayISO } from '../../services/wholesalePricing';
import { inputClass, primaryButton } from './ui';

export const ACTIVITY_ICONS: Record<ActivityType, React.FC<{ size?: number; className?: string }>> = {
  [ActivityType.CALL]: Phone,
  [ActivityType.EMAIL]: Mail,
  [ActivityType.VISIT]: MapPin,
  [ActivityType.SAMPLE]: FlaskConical,
  [ActivityType.NOTE]: StickyNote
};

export interface LogInput {
  activity: Pick<Activity, 'type' | 'date' | 'subject' | 'notes'>;
  followUp?: { title: string; dueDate: string };
}

// Saisie rapide d'un contact (appel, e-mail, visite…) avec, si besoin, la prochaine action.
export const ActivityLogger: React.FC<{ onLog: (input: LogInput) => void }> = ({ onLog }) => {
  const today = todayISO();
  const [type, setType] = useState<ActivityType>(ActivityType.CALL);
  const [date, setDate] = useState(today);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [plan, setPlan] = useState(true);
  const [nextTitle, setNextTitle] = useState('');
  const [nextDate, setNextDate] = useState(addDays(today, 3));

  const canLog = subject.trim().length > 0 && (!plan || (nextTitle.trim().length > 0 && !!nextDate));

  const submit = () => {
    if (!canLog) return;
    onLog({
      activity: { type, date, subject: subject.trim(), notes: notes.trim() || undefined },
      followUp: plan ? { title: nextTitle.trim(), dueDate: nextDate } : undefined
    });
    setSubject('');
    setNotes('');
    setNextTitle('');
    setNextDate(addDays(today, 3));
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {Object.values(ActivityType).map(t => {
          const Icon = ACTIVITY_ICONS[t];
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon size={13} /> {t}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className={`${inputClass} bg-white md:col-span-3`} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ce qui s'est dit, en une phrase" aria-label="Résumé du contact" />
        <input type="date" className={`${inputClass} bg-white`} value={date} max={today} onChange={e => setDate(e.target.value || today)} aria-label="Date du contact" />
      </div>
      <textarea className={`${inputClass} bg-white h-16`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Détails (facultatif)" aria-label="Détails du contact" />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={plan} onChange={e => setPlan(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
        Prévoir la prochaine action
      </label>
      {plan && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className={`${inputClass} bg-white md:col-span-3`} value={nextTitle} onChange={e => setNextTitle(e.target.value)} placeholder="Ex. : rappeler pour fixer la visite" aria-label="Prochaine action" />
          <input type="date" className={`${inputClass} bg-white`} value={nextDate} min={today} onChange={e => setNextDate(e.target.value)} aria-label="Date de la prochaine action" />
        </div>
      )}
      <div className="flex justify-end">
        <button onClick={submit} disabled={!canLog} className={`${primaryButton} text-sm`}>Enregistrer le contact</button>
      </div>
    </div>
  );
};

export const Timeline: React.FC<{ activities: Activity[]; label?: (a: Activity) => string | undefined }> = ({ activities, label }) => {
  const sorted = activities.map((a, i) => ({ a, i })).sort((x, y) => y.a.date.localeCompare(x.a.date) || y.i - x.i).map(x => x.a);
  if (sorted.length === 0) return <p className="text-sm text-gray-400">Aucun contact enregistré pour l'instant.</p>;
  return (
    <ol className="space-y-3">
      {sorted.map(a => {
        const Icon = ACTIVITY_ICONS[a.type];
        const context = label?.(a);
        return (
          <li key={a.id} className="flex gap-3">
            <div className="bg-indigo-50 text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
              <Icon size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">{a.subject}</p>
              <p className="text-[11px] text-gray-400">
                {a.type} · {formatDate(a.date)}{context && <> · {context}</>}
              </p>
              {a.notes && <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{a.notes}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export const dueClass = (dueDate: string, today: string) =>
  dueDate < today ? 'text-red-600' : dueDate === today ? 'text-amber-600' : 'text-gray-500';

export const TaskList: React.FC<{
  tasks: CrmTask[];
  today: string;
  label?: (t: CrmTask) => React.ReactNode;
  onComplete: (task: CrmTask) => void;
  showDone?: boolean;
}> = ({ tasks, today, label, onComplete, showDone }) => {
  const visible = tasks
    .filter(t => showDone || !t.done)
    .sort((a, b) => Number(a.done) - Number(b.done) || a.dueDate.localeCompare(b.dueDate));
  if (visible.length === 0) return <p className="text-sm text-gray-400">Aucune action prévue.</p>;
  return (
    <ul className="space-y-2">
      {visible.map(t => (
        <li key={t.id} className={`flex items-start gap-3 ${t.done ? 'opacity-50' : ''}`}>
          <button
            onClick={() => !t.done && onComplete(t)}
            disabled={t.done}
            className="mt-0.5 text-gray-400 hover:text-green-600 disabled:cursor-default"
            aria-label={t.done ? `Fait : ${t.title}` : `Marquer fait : ${t.title}`}
          >
            {t.done ? <CheckCircle2 size={18} className="text-green-600" /> : <Circle size={18} />}
          </button>
          <div className="min-w-0 flex-1">
            <p className={`text-sm ${t.done ? 'line-through' : 'font-medium text-gray-800'}`}>{t.title}</p>
            <p className="text-[11px]">
              <span className={t.done ? 'text-gray-400' : `font-bold ${dueClass(t.dueDate, today)}`}>
                {t.done ? `Fait le ${formatDate(t.doneDate)}` : t.dueDate < today ? `En retard · prévu le ${formatDate(t.dueDate)}` : t.dueDate === today ? "Aujourd'hui" : formatDate(t.dueDate)}
              </span>
              {label && <span className="text-gray-400"> · {label(t)}</span>}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export const TaskAdder: React.FC<{ onAdd: (title: string, dueDate: string) => void }> = ({ onAdd }) => {
  const today = todayISO();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(addDays(today, 1));
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <input className={`${inputClass} col-span-2`} value={title} onChange={e => setTitle(e.target.value)} placeholder="Nouvelle action" aria-label="Nouvelle action" />
      <input type="date" className={inputClass} value={date} min={today} onChange={e => setDate(e.target.value)} aria-label="Échéance" />
      <button
        onClick={() => {
          if (!title.trim() || !date) return;
          onAdd(title.trim(), date);
          setTitle('');
        }}
        disabled={!title.trim() || !date}
        className={primaryButton}
        aria-label="Ajouter l'action"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
