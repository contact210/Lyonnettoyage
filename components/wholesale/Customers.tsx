
import React, { useMemo, useState } from 'react';
import { Plus, Search, Mail, Phone, MapPin, Pencil, ShoppingCart, AlertTriangle, Building } from 'lucide-react';
import { CustomerSegment, OrderStatus, WholesaleCustomer, WholesaleOrder, WholesaleSettings } from '../../types';
import { computeTotals, formatDate, formatEUR, isOverdue, todayISO } from '../../services/wholesalePricing';
import { Field, Modal, inputClass, newId, parseNumber, primaryButton, secondaryButton } from './ui';

const SEGMENT_COLORS: Record<CustomerSegment, string> = {
  [CustomerSegment.RESELLER]: 'bg-purple-50 text-purple-600',
  [CustomerSegment.COMPANY]: 'bg-blue-50 text-blue-600',
  [CustomerSegment.PUBLIC]: 'bg-green-50 text-green-600'
};

// Délais légaux en B2B : 60 jours date de facture au maximum (art. L441-10 du Code de commerce).
const PAYMENT_TERMS = [0, 15, 30, 45, 60];

interface CustomersProps {
  customers: WholesaleCustomer[];
  orders: WholesaleOrder[];
  settings: WholesaleSettings;
  onSave: (customer: WholesaleCustomer) => void;
  onNewOrder?: (customerId: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, orders, settings, onSave, onNewOrder }) => {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<WholesaleCustomer | 'new' | null>(null);

  const stats = useMemo(() => {
    const today = todayISO();
    const map = new Map<string, { revenueHT: number; dueTTC: number; overdue: boolean; count: number; lastDate?: string }>();
    orders
      .filter(o => o.status !== OrderStatus.CANCELED && o.status !== OrderStatus.QUOTE)
      .forEach(o => {
        const s = map.get(o.customerId) ?? { revenueHT: 0, dueTTC: 0, overdue: false, count: 0 };
        const totals = computeTotals(o.lines, settings);
        s.count += 1;
        if (o.status === OrderStatus.INVOICED || o.status === OrderStatus.PAID) s.revenueHT += totals.totalHT;
        if (o.status === OrderStatus.INVOICED) s.dueTTC += totals.totalTTC;
        if (isOverdue(o, today)) s.overdue = true;
        if (!s.lastDate || o.date > s.lastDate) s.lastDate = o.date;
        map.set(o.customerId, s);
      });
    return map;
  }, [orders, settings]);

  const visible = customers
    .filter(c => {
      const q = query.trim().toLowerCase();
      return !q || c.companyName.toLowerCase().includes(q) || c.contactName.toLowerCase().includes(q) || c.siret.replace(/\s/g, '').includes(q.replace(/\s/g, ''));
    })
    .sort((a, b) => a.companyName.localeCompare(b.companyName, 'fr'));

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center justify-between">
        <div className="flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 w-full max-w-sm">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un client, un contact, un SIRET"
            className="bg-transparent border-none focus:ring-0 outline-none text-sm w-full"
          />
        </div>
        <button onClick={() => setEditing('new')} className={primaryButton}>
          <Plus size={16} /> Client pro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visible.map(c => {
          const s = stats.get(c.id);
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-indigo-200 transition-all flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="bg-indigo-50 p-2.5 rounded-lg">
                    <Building className="text-indigo-600" size={20} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${SEGMENT_COLORS[c.segment]}`}>{c.segment}</span>
                </div>
                <h3 className="text-lg font-bold">{c.companyName}</h3>
                <p className="text-xs text-gray-400 font-mono">SIRET {c.siret}</p>

                <div className="mt-4 space-y-2">
                  {c.contactName && <p className="text-sm text-gray-700 font-medium">{c.contactName}</p>}
                  {c.email && <p className="flex items-center text-sm text-gray-600"><Mail size={14} className="mr-2 text-gray-400 shrink-0" /> {c.email}</p>}
                  {c.phone && <p className="flex items-center text-sm text-gray-600"><Phone size={14} className="mr-2 text-gray-400 shrink-0" /> {c.phone}</p>}
                  <p className="flex items-center text-sm text-gray-600"><MapPin size={14} className="mr-2 text-gray-400 shrink-0" /> {c.address}</p>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-50 grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Remise</p>
                    <p className="text-sm font-bold text-gray-700">{c.discountRate.toLocaleString('fr-FR')} %</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Paiement</p>
                    <p className="text-sm font-bold text-gray-700">{c.paymentTermsDays === 0 ? 'Comptant' : `${c.paymentTermsDays} j`}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Commandes</p>
                    <p className="text-sm font-bold text-gray-700">{s?.count ?? 0}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Facturé : <span className="font-bold text-gray-800">{formatEUR(s?.revenueHT ?? 0)} HT</span>
                  {s?.lastDate && <> · dernière commande le {formatDate(s.lastDate)}</>}
                </p>
                {!!s?.dueTTC && (
                  <p className={`text-xs mt-1 font-bold ${s.overdue ? 'text-red-600' : 'text-amber-600'}`}>
                    À encaisser : {formatEUR(s.dueTTC)} TTC{s.overdue && ' · en retard'}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => setEditing(c)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-600 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={14} /> Modifier
                </button>
                {onNewOrder && (
                  <button
                    onClick={() => onNewOrder(c.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <ShoppingCart size={14} /> Nouvelle commande
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full text-center text-sm text-gray-400 py-12">Aucun client ne correspond à cette recherche.</p>
        )}
      </div>

      {editing && (
        <CustomerForm
          customer={editing === 'new' ? undefined : editing}
          customers={customers}
          onCancel={() => setEditing(null)}
          onSave={c => {
            onSave(c);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

const CustomerForm: React.FC<{
  customer?: WholesaleCustomer;
  customers: WholesaleCustomer[];
  onCancel: () => void;
  onSave: (customer: WholesaleCustomer) => void;
}> = ({ customer, customers, onCancel, onSave }) => {
  const [form, setForm] = useState({
    companyName: customer?.companyName ?? '',
    siret: customer?.siret ?? '',
    tvaIntra: customer?.tvaIntra ?? '',
    address: customer?.address ?? '',
    contactName: customer?.contactName ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    segment: customer?.segment ?? CustomerSegment.COMPANY,
    discountRate: String(customer?.discountRate ?? 0),
    paymentTermsDays: String(customer?.paymentTermsDays ?? 30)
  });
  const [errors, setErrors] = useState<string[]>([]);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const submit = () => {
    const problems: string[] = [];
    const siretDigits = form.siret.replace(/\s/g, '');
    const discount = parseNumber(form.discountRate);
    if (!form.companyName.trim()) problems.push('La raison sociale est obligatoire.');
    if (!/^\d{14}$/.test(siretDigits)) problems.push('Le SIRET doit compter 14 chiffres.');
    if (customers.some(c => c.siret.replace(/\s/g, '') === siretDigits && c.id !== customer?.id)) {
      problems.push('Un client avec ce SIRET existe déjà.');
    }
    const tva = form.tvaIntra.replace(/\s/g, '').toUpperCase();
    if (tva && !/^FR[0-9A-Z]{2}\d{9}$/.test(tva)) {
      problems.push('Le numéro de TVA doit avoir la forme FR 12 123456789.');
    }
    if (!form.address.trim()) problems.push("L'adresse de facturation est obligatoire.");
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) problems.push("L'e-mail n'est pas valide.");
    if (!(discount >= 0 && discount <= 50)) problems.push('La remise doit être comprise entre 0 et 50 %.');

    setErrors(problems);
    if (problems.length > 0) return;

    onSave({
      id: customer?.id ?? newId('cli'),
      companyName: form.companyName.trim(),
      siret: siretDigits.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, '$1 $2 $3 $4'),
      tvaIntra: tva.replace(/^FR(\w{2})(\d{9})$/, 'FR $1 $2'),
      address: form.address.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      segment: form.segment,
      discountRate: discount,
      paymentTermsDays: Number(form.paymentTermsDays)
    });
  };

  return (
    <Modal
      title={customer ? `Modifier ${customer.companyName}` : 'Nouveau client professionnel'}
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
            {errors.map(e => (
              <p key={e} className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {e}</p>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Raison sociale" className="md:col-span-2">
            <input className={inputClass} value={form.companyName} onChange={e => set({ companyName: e.target.value })} />
          </Field>
          <Field label="SIRET">
            <input className={`${inputClass} font-mono`} inputMode="numeric" value={form.siret} onChange={e => set({ siret: e.target.value })} placeholder="123 456 789 00012" />
          </Field>
          <Field label="TVA intracommunautaire" hint="Facultatif pour les collectivités.">
            <input className={`${inputClass} font-mono`} value={form.tvaIntra} onChange={e => set({ tvaIntra: e.target.value })} placeholder="FR 12 123456789" />
          </Field>
          <Field label="Adresse de facturation" className="md:col-span-2">
            <input className={inputClass} value={form.address} onChange={e => set({ address: e.target.value })} placeholder="12 Rue de la République, 69002 Lyon" />
          </Field>
          <Field label="Contact">
            <input className={inputClass} value={form.contactName} onChange={e => set({ contactName: e.target.value })} />
          </Field>
          <Field label="Téléphone">
            <input className={inputClass} value={form.phone} onChange={e => set({ phone: e.target.value })} />
          </Field>
          <Field label="E-mail (envoi des factures)" className="md:col-span-2">
            <input className={inputClass} type="email" value={form.email} onChange={e => set({ email: e.target.value })} />
          </Field>
          <Field label="Segment">
            <select className={inputClass} value={form.segment} onChange={e => set({ segment: e.target.value as CustomerSegment })}>
              {Object.values(CustomerSegment).map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Remise négociée (%)" hint="S'ajoute aux prix par quantité.">
            <input className={inputClass} inputMode="decimal" value={form.discountRate} onChange={e => set({ discountRate: e.target.value })} />
          </Field>
          <Field label="Délai de paiement" hint="60 jours maximum à compter de la facture (art. L441-10).">
            <select className={inputClass} value={form.paymentTermsDays} onChange={e => set({ paymentTermsDays: e.target.value })}>
              {PAYMENT_TERMS.map(d => <option key={d} value={d}>{d === 0 ? 'Comptant' : `${d} jours`}</option>)}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
};

export default Customers;
