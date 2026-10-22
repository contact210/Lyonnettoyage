
import React, { useState } from 'react';
import { Boxes } from 'lucide-react';
import { CompanySettings, OrderStatus, WholesaleCustomer, WholesaleOrder, WholesaleProduct } from '../types';
import {
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_WHOLESALE_SETTINGS,
  MOCK_WHOLESALE_CUSTOMERS,
  MOCK_WHOLESALE_ORDERS,
  MOCK_WHOLESALE_PRODUCTS
} from '../constants';
import { usePersistentState } from '../hooks/usePersistentState';
import { applyStatusChange, todayISO } from '../services/wholesalePricing';
import Catalog from './wholesale/Catalog';
import Customers from './wholesale/Customers';
import Orders from './wholesale/Orders';

type SubTab = 'orders' | 'catalog' | 'customers';

const STORAGE = 'cleanmanager.wholesale.v1';

// Remplace l'élément de même id, ou l'ajoute.
const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some(x => x.id === item.id) ? list.map(x => (x.id === item.id ? item : x)) : [...list, item];

const Wholesale: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('orders');
  const [newOrderFor, setNewOrderFor] = useState<string | null>(null);
  const [products, setProducts] = usePersistentState<WholesaleProduct[]>(`${STORAGE}.products`, MOCK_WHOLESALE_PRODUCTS);
  const [customers, setCustomers] = usePersistentState<WholesaleCustomer[]>(`${STORAGE}.customers`, MOCK_WHOLESALE_CUSTOMERS);
  const [orders, setOrders] = usePersistentState<WholesaleOrder[]>(`${STORAGE}.orders`, MOCK_WHOLESALE_ORDERS);
  const [settings] = usePersistentState(`${STORAGE}.settings`, DEFAULT_WHOLESALE_SETTINGS);
  const [company] = usePersistentState<CompanySettings>(`${STORAGE}.company`, DEFAULT_COMPANY_SETTINGS);

  // Applique un changement d'étape (stock, numéro de facture, échéance). Renvoie le message d'erreur éventuel.
  const changeStatus = (order: WholesaleOrder, to: OrderStatus, allOrders = orders): string | null => {
    try {
      const result = applyStatusChange(order, to, {
        products,
        orders: allOrders,
        customer: customers.find(c => c.id === order.customerId),
        settings,
        today: todayISO()
      });
      setOrders(list => upsert(list, result.order));
      setProducts(result.products);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  };

  const saveOrder = (order: WholesaleOrder, confirm: boolean) => {
    const allOrders = upsert(orders, order);
    setOrders(allOrders);
    return confirm ? changeStatus(order, OrderStatus.CONFIRMED, allOrders) : null;
  };

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'orders', label: 'Commandes' },
    { id: 'catalog', label: 'Catalogue' },
    { id: 'customers', label: 'Clients pro' }
  ];

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

      {activeSubTab === 'orders' && (
        <Orders
          orders={orders}
          products={products}
          customers={customers}
          settings={settings}
          company={company}
          startWithCustomer={newOrderFor}
          onStarted={() => setNewOrderFor(null)}
          onSave={saveOrder}
          onChangeStatus={changeStatus}
        />
      )}

      {activeSubTab === 'catalog' && (
        <Catalog products={products} settings={settings} onSave={p => setProducts(list => upsert(list, p))} />
      )}

      {activeSubTab === 'customers' && (
        <Customers
          customers={customers}
          orders={orders}
          settings={settings}
          onSave={c => setCustomers(list => upsert(list, c))}
          onNewOrder={customerId => {
            setNewOrderFor(customerId);
            setActiveSubTab('orders');
          }}
        />
      )}
    </div>
  );
};

export default Wholesale;
