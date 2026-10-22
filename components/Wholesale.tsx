
import React, { useState } from 'react';
import { Boxes } from 'lucide-react';
import { WholesaleProduct } from '../types';
import { DEFAULT_WHOLESALE_SETTINGS, MOCK_WHOLESALE_PRODUCTS } from '../constants';
import { usePersistentState } from '../hooks/usePersistentState';
import Catalog from './wholesale/Catalog';

type SubTab = 'catalog';

const STORAGE = 'cleanmanager.wholesale.v1';

// Remplace l'élément de même id, ou l'ajoute.
const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some(x => x.id === item.id) ? list.map(x => (x.id === item.id ? item : x)) : [...list, item];

const Wholesale: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('catalog');
  const [products, setProducts] = usePersistentState<WholesaleProduct[]>(`${STORAGE}.products`, MOCK_WHOLESALE_PRODUCTS);
  const [settings] = usePersistentState(`${STORAGE}.settings`, DEFAULT_WHOLESALE_SETTINGS);

  const tabs: { id: SubTab; label: string }[] = [{ id: 'catalog', label: 'Catalogue' }];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Boxes className="text-indigo-600" /> Vente en gros
          </h1>
          <p className="text-sm text-gray-500">Produits d'entretien pour les professionnels : catalogue, clients, commandes et factures</p>
        </div>
        <div className="bg-gray-100 p-1 rounded-lg flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                activeSubTab === t.id ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'catalog' && (
        <Catalog products={products} settings={settings} onSave={p => setProducts(list => upsert(list, p))} />
      )}
    </div>
  );
};

export default Wholesale;
