
import React, { useMemo, useState } from 'react';
import { Plus, Search, Mail, Phone, MapPin, Pencil, Truck, AlertTriangle, Factory } from 'lucide-react';
import { PurchaseOrder, PurchaseStatus, Supplier, WholesaleProduct } from '../../types';
import { formatEUR, todayISO } from '../../services/wholesalePricing';
import { computePurchaseTotals, isPurchaseToPay } from '../../services/wholesaleStock';
import { Field, Modal, inputClass, newId, parseNumber, primaryButton, secondaryButton } from './ui';

const PAYMENT_TERMS = [0, 15, 30, 45, 60];

interface SuppliersProps {
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  products: WholesaleProduct[];
  onSave: (supplier: Supplier) => void;
  onNewPurchase?: (supplierId: string) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, purchases, products, onSave, onNewPurchase }) => {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Supplier | 'new' | null>(null);

  const stats = useMemo(() => {
    const today = todayISO();
    const map = new Map<string, { boughtHT: number; open: number; dueTTC: number; late: boolean }>();
    purchases
      .filter(p => p.status !== PurchaseStatus.CANCELED && p.status !== PurchaseStatus.DRAFT)
      .forEach(p => {
        const s = map.get(p.supplierId) ?? { boughtHT: 0, open: 0, dueTTC: 0, late: false };
        if (p.status === PurchaseStatus.ORDERED || p.status === PurchaseStatus.PARTIAL) s.open += 1;
        // Acheté = ce qui a été reçu, au prix d'achat.
        s.boughtHT += p.lines.reduce((sum, l) => sum + l.receivedQty * l.unitCost, 0);
        if (isPurchaseToPay(p)) {
          s.dueTTC += computePurchaseTotals(p).totalTTC;
          if (p.dueDate && p.dueDate < today) s.late = true;
        }
        map.set(p.supplierId, s);
      });
    return map;
  }, [purchases]);

  const visible = suppliers
    .filter(s => {
      const q = query.trim().toLowerCase();
      return !q || s.companyName.toLowerCase().includes(q) || s.contactName.toLowerCase().includes(q);
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
            placeholder="Rechercher un fournisseur ou un contact"
            className="bg-transparent border-none focus:ring-0 outline-none text-sm w-full"
          />
        </div>
        <button onClick={() => setEditing('new')} className={primaryButton}>
          <Plus size={16} /> Fournisseur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visible.map(s => {
          const st = stats.get(s.id);
          const supplied = products.filter(p => p.supplierId === s.id && p.active).length;
          return (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-indigo-200 transition-all flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="bg-teal-50 p-2.5 rounded-lg">
                    <Factory className="text-teal-600" size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                    {supplied} produit{supplied > 1 ? 's' : ''}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{s.companyName}</h3>
                <p className="text-xs text-gray-400 font-mono">SIRET {s.siret}</p>

                <div className="mt-4 space-y-2">
                  {s.contactName && <p className="text-sm text-gray-700 font-medium">{s.contactName}</p>}
                  {s.email && <p className="flex items-center text-sm text-gray-600"><Mail size={14} className="mr-2 text-gray-400 shrink-0" /> {s.email}</p>}
                  {s.phone && <p className="flex items-center text-sm text-gray-600"><Phone size={14} className="mr-2 text-gray-400 shrink-0" /> {s.phone}</p>}
                  <p className="flex items-center text-sm text-gray-600"><MapPin size={14} className="mr-2 text-gray-400 shrink-0" /> {s.address}</p>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-50 grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Délai</p>
                    <p className="text-sm font-bold text-gray-700">{s.leadTimeDays} j</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Paiement</p>
                    <p className="text-sm font-bold text-gray-700">{s.paymentTermsDays === 0 ? 'Comptant' : `${s.paymentTermsDays} j`}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">En cours</p>
                    <p className="text-sm font-bold text-gray-700">{st?.open ?? 0}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Acheté (reçu) : <span className="font-bold text-gray-800">{formatEUR(st?.boughtHT ?? 0)} HT</span>
                </p>
                {!!st?.dueTTC && (
                  <p className={`text-xs mt-1 font-bold ${st.late ? 'text-red-600' : 'text-amber-600'}`}>
                    À payer : {formatEUR(st.dueTTC)} TTC{st.late && ' · échéance dépassée'}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => setEditing(s)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-600 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={14} /> Modifier
                </button>
                {onNewPurchase && (
                  <button
                    onClick={() => onNewPurchase(s.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-teal-50 text-teal-700 py-2 rounded-lg text-xs font-bold hover:bg-teal-100 transition-colors"
                  >
                    <Truck size={14} /> Commander
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full text-center text-sm text-gray-400 py-12">Aucun fournisseur ne correspond à cette recherche.</p>
        )}
      </div>

      {editing && (
        <SupplierForm
          supplier={editing === 'new' ? undefined : editing}
          suppliers={suppliers}
          onCancel={() => setEditing(null)}
          onSave={s => {
            onSave(s);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

const SupplierForm: React.FC<{
  supplier?: Supplier;
  suppliers: Supplier[];
  onCancel: () => void;
  onSave: (supplier: Supplier) => void;
}> = ({ supplier, suppliers, onCancel, onSave }) => {
  const [form, setForm] = useState({
    companyName: supplier?.companyName ?? '',
    siret: supplier?.siret ?? '',
    tvaIntra: supplier?.tvaIntra ?? '',
    address: supplier?.address ?? '',
    contactName: supplier?.contactName ?? '',
    email: supplier?.email ?? '',
    phone: supplier?.phone ?? '',
    paymentTermsDays: String(supplier?.paymentTermsDays ?? 30),
    leadTimeDays: String(supplier?.leadTimeDays ?? 5)
  });
  const [errors, setErrors] = useState<string[]>([]);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const submit = () => {
    const problems: string[] = [];
    const siretDigits = form.siret.replace(/\s/g, '');
    const tva = form.tvaIntra.replace(/\s/g, '').toUpperCase();
    const lead = parseNumber(form.leadTimeDays);
    if (!form.companyName.trim()) problems.push('La raison sociale est obligatoire.');
    if (!/^\d{14}$/.test(siretDigits)) problems.push('Le SIRET doit compter 14 chiffres.');
    if (suppliers.some(s => s.siret.replace(/\s/g, '') === siretDigits && s.id !== supplier?.id)) {
      problems.push('Un fournisseur avec ce SIRET existe déjà.');
    }
    if (tva && !/^[A-Z]{2}[0-9A-Z]{2,13}$/.test(tva)) problems.push("Le numéro de TVA n'est pas valide.");
    if (!form.address.trim()) problems.push("L'adresse est obligatoire.");
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) problems.push("L'e-mail n'est pas valide.");
    if (!Number.isInteger(lead) || lead < 0) problems.push('Le délai de livraison doit être un nombre de jours entier.');

    setErrors(problems);
    if (problems.length > 0) return;

    onSave({
      id: supplier?.id ?? newId('sup'),
      companyName: form.companyName.trim(),
      siret: siretDigits.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, '$1 $2 $3 $4'),
      tvaIntra: tva.replace(/^FR(\w{2})(\d{9})$/, 'FR $1 $2'),
      address: form.address.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      paymentTermsDays: Number(form.paymentTermsDays),
      leadTimeDays: lead
    });
  };

  return (
    <Modal
      title={supplier ? `Modifier ${supplier.companyName}` : 'Nouveau fournisseur'}
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
          <Field label="TVA intracommunautaire" hint="Un fournisseur étranger de l'UE garde son préfixe (BE, DE…).">
            <input className={`${inputClass} font-mono`} value={form.tvaIntra} onChange={e => set({ tvaIntra: e.target.value })} placeholder="FR 12 123456789" />
          </Field>
          <Field label="Adresse" className="md:col-span-2">
            <input className={inputClass} value={form.address} onChange={e => set({ address: e.target.value })} />
          </Field>
          <Field label="Contact">
            <input className={inputClass} value={form.contactName} onChange={e => set({ contactName: e.target.value })} />
          </Field>
          <Field label="Téléphone">
            <input className={inputClass} value={form.phone} onChange={e => set({ phone: e.target.value })} />
          </Field>
          <Field label="E-mail (envoi des commandes)" className="md:col-span-2">
            <input className={inputClass} type="email" value={form.email} onChange={e => set({ email: e.target.value })} />
          </Field>
          <Field label="Délai de livraison (jours)">
            <input className={inputClass} inputMode="numeric" value={form.leadTimeDays} onChange={e => set({ leadTimeDays: e.target.value })} />
          </Field>
          <Field label="Délai de paiement accordé">
            <select className={inputClass} value={form.paymentTermsDays} onChange={e => set({ paymentTermsDays: e.target.value })}>
              {PAYMENT_TERMS.map(d => <option key={d} value={d}>{d === 0 ? 'Comptant' : `${d} jours`}</option>)}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
};

export default Suppliers;
