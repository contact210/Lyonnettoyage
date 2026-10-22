
import React, { useMemo, useState } from 'react';
import { Plus, Search, Package, AlertTriangle, Trash2, Pencil } from 'lucide-react';
import { ProductCategory, Supplier, WholesaleProduct, WholesaleSettings } from '../../types';
import { basePrice, formatEUR, marginRate, sortedTiers } from '../../services/wholesalePricing';
import {
  Field,
  Modal,
  StockBadge,
  inputClass,
  newId,
  parseNumber,
  primaryButton,
  secondaryButton,
  stockLevel
} from './ui';

export const CATEGORIES: ProductCategory[] = [
  'Sols',
  'Sanitaires',
  'Vitres',
  'Désinfection',
  'Hygiène',
  'Consommables',
  'Matériel'
];

interface CatalogProps {
  products: WholesaleProduct[];
  suppliers: Supplier[];
  settings: WholesaleSettings;
  onSave: (product: WholesaleProduct) => void;
}

const Catalog: React.FC<CatalogProps> = ({ products, suppliers, settings, onSave }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [editing, setEditing] = useState<WholesaleProduct | 'new' | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter(p => category === 'all' || p.category === category)
      .filter(p => !onlyAlerts || stockLevel(p) !== 'ok')
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'fr'));
  }, [products, query, category, onlyAlerts]);

  const stockValue = products.reduce((sum, p) => sum + Math.max(p.stock, 0) * p.costPrice, 0);
  const alerts = products.filter(p => p.active && stockLevel(p) !== 'ok').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Références actives</p>
          <h3 className="text-2xl font-black">{products.filter(p => p.active).length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Stock disponible (au CMP)</p>
          <h3 className="text-2xl font-black text-indigo-600">{formatEUR(stockValue)}</h3>
        </div>
        <button
          onClick={() => setOnlyAlerts(!onlyAlerts)}
          className={`text-left p-6 rounded-2xl border shadow-sm transition-colors ${
            onlyAlerts ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-100 hover:border-amber-200'
          }`}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Alertes de stock</p>
          <h3 className={`text-2xl font-black ${alerts > 0 ? 'text-amber-500' : 'text-green-600'}`}>{alerts}</h3>
          <p className="text-[11px] text-gray-400 mt-1">{onlyAlerts ? 'Afficher tout le catalogue' : 'Voir les produits à commander'}</p>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 space-y-3">
          <div className="flex gap-3 items-center justify-between">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-full max-w-sm">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un produit ou une référence"
                className="bg-transparent border-none focus:ring-0 outline-none text-sm w-full"
              />
            </div>
            <button onClick={() => setEditing('new')} className={primaryButton}>
              <Plus size={16} /> Produit
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', ...CATEGORIES] as const).map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  category === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {c === 'all' ? 'Toutes' : c}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Produit</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Prix de vente HT par palier</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Coût (CMP)</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Marge</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Stock</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map(p => {
                const rate = marginRate(basePrice(p), p.costPrice);
                return (
                  <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${p.active ? '' : 'opacity-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-indigo-50 p-2 rounded-lg mr-3">
                          <Package className="text-indigo-600" size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            <span className="font-mono">{p.sku}</span> · {p.packaging} · {p.category}
                            {!p.active && ' · archivé'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {sortedTiers(p).map(t => (
                          <span key={t.minQty} className="text-xs bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
                            <span className="text-gray-400">{t.minQty === 1 ? 'dès 1' : `dès ${t.minQty}`}</span>{' '}
                            <span className="font-bold">{formatEUR(t.unitPrice)}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-gray-600">{formatEUR(p.costPrice)}</p>
                      {p.lastPurchasePrice !== undefined && (
                        <p className="text-[10px] text-gray-400 whitespace-nowrap">dernier achat {formatEUR(p.lastPurchasePrice)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${rate < settings.minMarginRate ? 'text-red-600' : 'text-green-600'}`}>
                        {rate.toLocaleString('fr-FR')} %
                      </span>
                      <p className="text-[10px] text-gray-400 whitespace-nowrap">au prix de base</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold">{p.stock}</p>
                      <div className="flex justify-end items-center gap-1 mt-0.5">
                        <StockBadge product={p} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">seuil {p.minStock}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditing(p)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        aria-label={`Modifier ${p.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    Aucun produit ne correspond à ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProductForm
          product={editing === 'new' ? undefined : editing}
          products={products}
          suppliers={suppliers}
          settings={settings}
          onCancel={() => setEditing(null)}
          onSave={p => {
            onSave(p);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

interface TierDraft {
  minQty: string;
  unitPrice: string;
}

const ProductForm: React.FC<{
  product?: WholesaleProduct;
  products: WholesaleProduct[];
  suppliers: Supplier[];
  settings: WholesaleSettings;
  onCancel: () => void;
  onSave: (product: WholesaleProduct) => void;
}> = ({ product, products, suppliers, settings, onCancel, onSave }) => {
  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? 'Sols');
  const [packaging, setPackaging] = useState(product?.packaging ?? '');
  const [costPrice, setCostPrice] = useState(product ? String(product.costPrice) : '');
  const [vatRate, setVatRate] = useState(String(product?.vatRate ?? 20));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [minStock, setMinStock] = useState(String(product?.minStock ?? 10));
  const [active, setActive] = useState(product?.active ?? true);
  const [supplierId, setSupplierId] = useState(product?.supplierId ?? '');
  const [tiers, setTiers] = useState<TierDraft[]>(
    product
      ? sortedTiers(product).map(t => ({ minQty: String(t.minQty), unitPrice: String(t.unitPrice) }))
      : [{ minQty: '1', unitPrice: '' }]
  );
  const [errors, setErrors] = useState<string[]>([]);

  const cost = parseNumber(costPrice);

  const updateTier = (index: number, patch: Partial<TierDraft>) =>
    setTiers(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)));

  const submit = () => {
    const problems: string[] = [];
    const cleanSku = sku.trim().toUpperCase();
    if (!name.trim()) problems.push('Le nom est obligatoire.');
    if (!cleanSku) problems.push('La référence est obligatoire.');
    if (products.some(p => p.sku.toUpperCase() === cleanSku && p.id !== product?.id)) {
      problems.push(`La référence ${cleanSku} existe déjà.`);
    }
    if (!packaging.trim()) problems.push("L'unité de vente est obligatoire (ex : Bidon 5 L).");
    if (!(cost >= 0)) problems.push("Le prix d'achat doit être un nombre positif.");

    const parsedTiers = tiers.map(t => ({ minQty: parseNumber(t.minQty), unitPrice: parseNumber(t.unitPrice) }));
    if (parsedTiers.some(t => !Number.isInteger(t.minQty) || t.minQty < 1)) {
      problems.push('Chaque palier doit commencer à une quantité entière ≥ 1.');
    }
    if (parsedTiers.some(t => !(t.unitPrice > 0))) problems.push('Chaque palier doit avoir un prix supérieur à 0.');
    if (new Set(parsedTiers.map(t => t.minQty)).size !== parsedTiers.length) {
      problems.push('Deux paliers ne peuvent pas commencer à la même quantité.');
    }
    if (!parsedTiers.some(t => t.minQty === 1)) problems.push('Il faut un prix de base (palier « dès 1 »).');

    // Le stock d'un produit existant ne bouge que par des mouvements (onglet Stock).
    const parsedStock = product ? product.stock : parseNumber(stock);
    const parsedMin = parseNumber(minStock);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) problems.push('Le stock doit être un entier positif.');
    if (!Number.isInteger(parsedMin) || parsedMin < 0) problems.push("Le seuil d'alerte doit être un entier positif.");

    setErrors(problems);
    if (problems.length > 0) return;

    onSave({
      id: product?.id ?? newId('prd'),
      sku: cleanSku,
      name: name.trim(),
      category,
      packaging: packaging.trim(),
      costPrice: cost,
      tiers: parsedTiers.sort((a, b) => a.minQty - b.minQty),
      vatRate: Number(vatRate),
      stock: parsedStock,
      minStock: parsedMin,
      active,
      supplierId: supplierId || undefined,
      lastPurchasePrice: product?.lastPurchasePrice ?? cost
    });
  };

  return (
    <Modal
      title={product ? `Modifier ${product.name}` : 'Nouveau produit'}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Nom du produit" className="md:col-span-2">
            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Détergent sols neutre" />
          </Field>
          <Field label="Référence (SKU)">
            <input className={`${inputClass} font-mono uppercase`} value={sku} onChange={e => setSku(e.target.value)} placeholder="SOL-NEU-5L" />
          </Field>
          <Field label="Catégorie">
            <select className={inputClass} value={category} onChange={e => setCategory(e.target.value as ProductCategory)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Unité de vente">
            <input className={inputClass} value={packaging} onChange={e => setPackaging(e.target.value)} placeholder="Bidon 5 L" />
          </Field>
          <Field label="TVA">
            <select className={inputClass} value={vatRate} onChange={e => setVatRate(e.target.value)}>
              <option value="20">20 %</option>
              <option value="10">10 %</option>
              <option value="5.5">5,5 %</option>
            </select>
          </Field>
          <Field label="Fournisseur principal" className="md:col-span-3">
            <select className={inputClass} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">Aucun</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
            </select>
          </Field>
          <Field
            label={product ? 'Coût moyen pondéré HT (€)' : "Coût d'achat HT (€)"}
            hint={product ? 'Recalculé à chaque réception. Ne corrigez qu’en cas d’erreur.' : undefined}
          >
            <input className={inputClass} inputMode="decimal" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="9,80" />
          </Field>
          <Field label={product ? 'Stock disponible' : 'Stock initial'} hint={product ? 'Se modifie dans l’onglet Stock (inventaire, perte…).' : undefined}>
            <input className={`${inputClass} ${product ? 'text-gray-400' : ''}`} inputMode="numeric" value={stock} disabled={!!product} onChange={e => setStock(e.target.value)} />
          </Field>
          <Field label="Seuil d'alerte" hint="Alerte « stock bas » à ce niveau.">
            <input className={inputClass} inputMode="numeric" value={minStock} onChange={e => setMinStock(e.target.value)} />
          </Field>
        </div>

        <div>
          <p className="block text-xs font-bold text-gray-400 uppercase mb-2">Prix de vente HT par quantité</p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <div className="grid grid-cols-12 gap-3 text-[10px] font-bold text-gray-400 uppercase">
              <div className="col-span-4">À partir de (unités)</div>
              <div className="col-span-4">Prix unitaire HT (€)</div>
              <div className="col-span-3 text-right">Marge</div>
              <div className="col-span-1"></div>
            </div>
            {tiers.map((t, i) => {
              const price = parseNumber(t.unitPrice);
              const rate = price > 0 && cost >= 0 ? marginRate(price, cost) : null;
              return (
                <div key={i} className="grid grid-cols-12 gap-3 items-center">
                  <input
                    className={`${inputClass} col-span-4 bg-white`}
                    inputMode="numeric"
                    value={t.minQty}
                    onChange={e => updateTier(i, { minQty: e.target.value })}
                  />
                  <input
                    className={`${inputClass} col-span-4 bg-white`}
                    inputMode="decimal"
                    value={t.unitPrice}
                    onChange={e => updateTier(i, { unitPrice: e.target.value })}
                    placeholder="0,00"
                  />
                  <span
                    className={`col-span-3 text-right text-sm font-bold ${
                      rate === null ? 'text-gray-300' : rate < settings.minMarginRate ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {rate === null ? '—' : `${rate.toLocaleString('fr-FR')} %`}
                  </span>
                  <button
                    onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                    disabled={tiers.length === 1}
                    className="col-span-1 text-red-400 hover:text-red-600 disabled:opacity-30 flex justify-center"
                    aria-label="Supprimer le palier"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => setTiers([...tiers, { minQty: '', unitPrice: '' }])}
              className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:bg-white px-3 py-1.5 rounded-lg transition-all"
            >
              <Plus size={14} /> Ajouter un palier
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            La remise négociée du client s'applique en plus du palier. Marge minimale conseillée : {settings.minMarginRate} %.
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          Produit en vente (décocher pour l'archiver sans perdre l'historique)
        </label>
      </div>
    </Modal>
  );
};

export default Catalog;
