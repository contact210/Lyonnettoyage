
import React, { useEffect, useRef, useState } from 'react';
import { Save, Download, Upload, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  Activity,
  CompanySettings,
  CrmTask,
  Lead,
  PurchaseOrder,
  StockMovement,
  Supplier,
  WholesaleCustomer,
  WholesaleOrder,
  WholesaleProduct,
  WholesaleSettings
} from '../../types';
import { todayISO } from '../../services/wholesalePricing';
import { Field, inputClass, parseNumber, primaryButton, secondaryButton } from './ui';

export interface WholesaleBackup {
  products: WholesaleProduct[];
  customers: WholesaleCustomer[];
  orders: WholesaleOrder[];
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  movements: StockMovement[];
  leads: Lead[];
  activities: Activity[];
  crmTasks: CrmTask[];
  settings: WholesaleSettings;
  company: CompanySettings;
}

interface SettingsProps {
  settings: WholesaleSettings;
  company: CompanySettings;
  backup: WholesaleBackup;
  onSaveSettings: (settings: WholesaleSettings) => void;
  onSaveCompany: (company: CompanySettings) => void;
  onRestore: (backup: WholesaleBackup) => void;
  onReset: () => void;
}

const COMPANY_FIELDS: { key: keyof CompanySettings; label: string; wide?: boolean }[] = [
  { key: 'name', label: 'Raison sociale', wide: true },
  { key: 'address', label: 'Adresse du siège', wide: true },
  { key: 'siret', label: 'SIRET' },
  { key: 'tvaIntra', label: 'TVA intracommunautaire' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'iban', label: 'IBAN' },
  { key: 'bic', label: 'BIC' }
];

const isBackup = (data: any) =>
  data &&
  Array.isArray(data.products) &&
  Array.isArray(data.customers) &&
  Array.isArray(data.orders) &&
  typeof data.settings === 'object' &&
  typeof data.company === 'object';

// Les sauvegardes plus anciennes n'ont pas les achats ni le CRM.
const list = (value: unknown) => (Array.isArray(value) ? value : []);
const withDefaults = (data: any): WholesaleBackup => ({
  ...data,
  suppliers: list(data.suppliers),
  purchases: list(data.purchases),
  movements: list(data.movements),
  leads: list(data.leads),
  activities: list(data.activities),
  crmTasks: list(data.crmTasks)
});

const Settings: React.FC<SettingsProps> = ({ settings, company, backup, onSaveSettings, onSaveCompany, onRestore, onReset }) => {
  const [terms, setTerms] = useState({
    francoThreshold: String(settings.francoThreshold),
    shippingFee: String(settings.shippingFee),
    minOrderHT: String(settings.minOrderHT),
    minMarginRate: String(settings.minMarginRate)
  });
  const [companyForm, setCompanyForm] = useState<CompanySettings>(company);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Après une restauration ou un retour à la démo, les formulaires reprennent les valeurs enregistrées.
  useEffect(() => {
    setTerms({
      francoThreshold: String(settings.francoThreshold),
      shippingFee: String(settings.shippingFee),
      minOrderHT: String(settings.minOrderHT),
      minMarginRate: String(settings.minMarginRate)
    });
  }, [settings]);
  useEffect(() => setCompanyForm(company), [company]);

  const saveTerms = () => {
    const parsed = {
      francoThreshold: parseNumber(terms.francoThreshold),
      shippingFee: parseNumber(terms.shippingFee),
      minOrderHT: parseNumber(terms.minOrderHT),
      minMarginRate: parseNumber(terms.minMarginRate)
    };
    if (Object.values(parsed).some(v => !(v >= 0)) || parsed.minMarginRate >= 100) {
      setMessage({ ok: false, text: 'Les conditions doivent être des nombres positifs (marge minimale sous 100 %).' });
      return;
    }
    onSaveSettings(parsed);
    setMessage({ ok: true, text: 'Conditions commerciales enregistrées.' });
  };

  const saveCompany = () => {
    if (!companyForm.name.trim() || !companyForm.siret.trim()) {
      setMessage({ ok: false, text: 'La raison sociale et le SIRET sont obligatoires sur les factures.' });
      return;
    }
    onSaveCompany(companyForm);
    setMessage({ ok: true, text: 'Informations de la société enregistrées. Elles apparaissent sur les prochains documents.' });
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vente-en-gros-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!isBackup(data)) throw new Error('format');
      if (!window.confirm('Remplacer toutes les données de la vente en gros par cette sauvegarde ?')) return;
      const backup = withDefaults(data);
      onRestore(backup);
      setMessage({
        ok: true,
        text: `Sauvegarde restaurée : ${backup.products.length} produits, ${backup.customers.length} clients, ${backup.orders.length} ventes, ${backup.suppliers.length} fournisseurs, ${backup.purchases.length} achats, ${backup.leads.length} prospects.`
      });
    } catch {
      setMessage({ ok: false, text: "Ce fichier n'est pas une sauvegarde de la vente en gros." });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {message && (
        <div className={`text-sm rounded-xl p-4 flex items-center gap-2 ${message.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {message.text}
        </div>
      )}

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Conditions commerciales</h2>
          <p className="text-sm text-gray-500">S'appliquent à toutes les nouvelles commandes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Franco de port (€ HT)" hint="Livraison offerte à partir de ce montant.">
            <input className={inputClass} inputMode="decimal" value={terms.francoThreshold} onChange={e => setTerms({ ...terms, francoThreshold: e.target.value })} />
          </Field>
          <Field label="Frais de livraison (€ HT)">
            <input className={inputClass} inputMode="decimal" value={terms.shippingFee} onChange={e => setTerms({ ...terms, shippingFee: e.target.value })} />
          </Field>
          <Field label="Minimum de commande (€ HT)">
            <input className={inputClass} inputMode="decimal" value={terms.minOrderHT} onChange={e => setTerms({ ...terms, minOrderHT: e.target.value })} />
          </Field>
          <Field label="Marge minimale (%)" hint="Alerte en dessous.">
            <input className={inputClass} inputMode="decimal" value={terms.minMarginRate} onChange={e => setTerms({ ...terms, minMarginRate: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end">
          <button onClick={saveTerms} className={primaryButton}><Save size={16} /> Enregistrer</button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Société (en-tête des devis et factures)</h2>
          <p className="text-sm text-gray-500">Vérifiez ces informations avec votre Kbis avant d'émettre une facture.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPANY_FIELDS.map(f => (
            <Field key={f.key} label={f.label} className={f.wide ? 'md:col-span-2' : ''}>
              <input
                className={inputClass}
                value={companyForm[f.key]}
                onChange={e => setCompanyForm({ ...companyForm, [f.key]: e.target.value })}
              />
            </Field>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={saveCompany} className={primaryButton}><Save size={16} /> Enregistrer</button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Données</h2>
          <p className="text-sm text-gray-500">
            Les données sont enregistrées dans ce navigateur. Exportez une sauvegarde régulièrement et avant de changer d'ordinateur.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportBackup} className={secondaryButton}><Download size={16} /> Exporter une sauvegarde</button>
          <button onClick={() => fileRef.current?.click()} className={secondaryButton}><Upload size={16} /> Restaurer une sauvegarde</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={e => importBackup(e.target.files?.[0])} />
          <button
            onClick={() => {
              if (window.confirm('Effacer toutes les données et revenir aux données de démonstration ?')) {
                onReset();
                setMessage({ ok: true, text: 'Données de démonstration rechargées.' });
              }
            }}
            className={`${secondaryButton.replace('text-gray-600', 'text-red-600')} ml-auto`}
          >
            <RotateCcw size={16} /> Revenir à la démo
          </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
