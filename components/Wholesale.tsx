
import React, { useState } from 'react';
import { Boxes } from 'lucide-react';
import {
  Activity,
  ActivityType,
  CompanySettings,
  CrmTask,
  Lead,
  LeadStage,
  OrderStatus,
  PurchaseOrder,
  StockMovement,
  StockMovementType,
  Supplier,
  WholesaleCustomer,
  WholesaleOrder,
  WholesaleProduct
} from '../types';
import {
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_WHOLESALE_SETTINGS,
  MOCK_ACTIVITIES,
  MOCK_CRM_TASKS,
  MOCK_LEADS,
  MOCK_PURCHASES,
  MOCK_STOCK_MOVEMENTS,
  MOCK_SUPPLIERS,
  MOCK_WHOLESALE_CUSTOMERS,
  MOCK_WHOLESALE_ORDERS,
  MOCK_WHOLESALE_PRODUCTS
} from '../constants';
import { usePersistentState } from '../hooks/usePersistentState';
import { applyStatusChange, newId, todayISO } from '../services/wholesalePricing';
import {
  AdjustmentKind,
  adjustStock,
  cancelPurchase,
  draftPurchase,
  markPurchaseOrdered,
  markPurchasePaid,
  receivePurchase,
  recordSupplierInvoice,
  reservedQuantities
} from '../services/wholesaleStock';
import { completeTask, convertLead, moveLead } from '../services/wholesaleCrm';
import Catalog from './wholesale/Catalog';
import Crm from './wholesale/Crm';
import { ConvertDetails, CrmActions } from './wholesale/CrmPipeline';
import { LogInput } from './wholesale/CrmShared';
import Customers from './wholesale/Customers';
import Orders from './wholesale/Orders';
import Overview from './wholesale/Overview';
import Profitability from './wholesale/Profitability';
import Purchases from './wholesale/Purchases';
import Settings, { WholesaleBackup } from './wholesale/Settings';
import Stock from './wholesale/Stock';
import Suppliers from './wholesale/Suppliers';

type SubTab = 'overview' | 'crm' | 'orders' | 'customers' | 'purchases' | 'suppliers' | 'stock' | 'catalog' | 'profitability' | 'settings';

const STORAGE = 'cleanmanager.wholesale.v1';

// Remplace l'élément de même id, ou l'ajoute.
const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some(x => x.id === item.id) ? list.map(x => (x.id === item.id ? item : x)) : [...list, item];

const Wholesale: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [newOrderFor, setNewOrderFor] = useState<string | null>(null);
  const [purchaseFocus, setPurchaseFocus] = useState<{ purchaseId?: string; supplierId?: string } | null>(null);
  const [products, setProducts] = usePersistentState<WholesaleProduct[]>(`${STORAGE}.products`, MOCK_WHOLESALE_PRODUCTS);
  const [customers, setCustomers] = usePersistentState<WholesaleCustomer[]>(`${STORAGE}.customers`, MOCK_WHOLESALE_CUSTOMERS);
  const [orders, setOrders] = usePersistentState<WholesaleOrder[]>(`${STORAGE}.orders`, MOCK_WHOLESALE_ORDERS);
  const [suppliers, setSuppliers] = usePersistentState<Supplier[]>(`${STORAGE}.suppliers`, MOCK_SUPPLIERS);
  const [purchases, setPurchases] = usePersistentState<PurchaseOrder[]>(`${STORAGE}.purchases`, MOCK_PURCHASES);
  const [movements, setMovements] = usePersistentState<StockMovement[]>(`${STORAGE}.movements`, MOCK_STOCK_MOVEMENTS);
  const [leads, setLeads] = usePersistentState<Lead[]>(`${STORAGE}.leads`, MOCK_LEADS);
  const [activities, setActivities] = usePersistentState<Activity[]>(`${STORAGE}.activities`, MOCK_ACTIVITIES);
  const [crmTasks, setCrmTasks] = usePersistentState<CrmTask[]>(`${STORAGE}.crmTasks`, MOCK_CRM_TASKS);
  const [settings, setSettings] = usePersistentState(`${STORAGE}.settings`, DEFAULT_WHOLESALE_SETTINGS);
  const [company, setCompany] = usePersistentState<CompanySettings>(`${STORAGE}.company`, DEFAULT_COMPANY_SETTINGS);

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
      setMovements(list => [...list, ...result.movements]);
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

  // Exécute une action d'achat ; renvoie le message d'erreur éventuel.
  const attempt = (action: () => void): string | null => {
    try {
      action();
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  };

  // Le calcul (qui peut échouer) se fait avant la mise à jour de l'état, pour que l'erreur soit attrapée ici.
  const savePurchase = (compute: () => PurchaseOrder) =>
    attempt(() => {
      const updated = compute();
      setPurchases(list => upsert(list, updated));
    });

  const purchaseActions = {
    onSave: (purchase: PurchaseOrder, order: boolean) => {
      setPurchases(list => upsert(list, purchase)); // le brouillon est gardé même si la commande échoue
      return order ? savePurchase(() => markPurchaseOrdered(purchase, todayISO())) : null;
    },
    onOrder: (purchase: PurchaseOrder) => savePurchase(() => markPurchaseOrdered(purchase, todayISO())),
    onCancel: (purchase: PurchaseOrder) => savePurchase(() => cancelPurchase(purchase, todayISO())),
    onReceive: (purchase: PurchaseOrder, received: number[]) =>
      attempt(() => {
        const result = receivePurchase(purchase, received, {
          products,
          supplier: suppliers.find(s => s.id === purchase.supplierId),
          today: todayISO()
        });
        setPurchases(list => upsert(list, result.purchase));
        setProducts(result.products);
        setMovements(list => [...list, ...result.movements]);
      }),
    onInvoice: (purchase: PurchaseOrder, invoice: { ref: string; dueDate: string }) =>
      savePurchase(() => recordSupplierInvoice(purchase, invoice)),
    onPay: (purchase: PurchaseOrder) => savePurchase(() => markPurchasePaid(purchase, todayISO()))
  };

  const saveProduct = (product: WholesaleProduct) => {
    const isNew = !products.some(p => p.id === product.id);
    setProducts(list => upsert(list, product));
    if (isNew && product.stock > 0) {
      setMovements(list => [
        ...list,
        {
          id: newId('mvt'),
          date: todayISO(),
          productId: product.id,
          sku: product.sku,
          type: StockMovementType.INITIAL,
          quantity: product.stock,
          unitCost: product.costPrice,
          stockAfter: product.stock
        }
      ]);
    }
  };

  const adjust = (product: WholesaleProduct, adjustment: { kind: AdjustmentKind; quantity: number; note?: string }) =>
    attempt(() => {
      const result = adjustStock(product, adjustment, {
        reserved: reservedQuantities(orders).get(product.id) ?? 0,
        today: todayISO()
      });
      setProducts(list => upsert(list, result.product));
      setMovements(list => [...list, result.movement]);
    });

  const createDraftPurchase = (supplierId: string, items: { product: WholesaleProduct; quantity: number }[]) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    const draft = draftPurchase(supplier, items, { purchases, today: todayISO() });
    setPurchases(list => [...list, draft]);
    setPurchaseFocus({ purchaseId: draft.id });
    setActiveSubTab('purchases');
  };

  const startQuote = (customerId: string) => {
    setNewOrderFor(customerId);
    setActiveSubTab('orders');
  };

  const newTask = (ref: { leadId?: string; customerId?: string }, title: string, dueDate: string): CrmTask => ({
    id: newId('task'),
    dueDate,
    title,
    ...ref,
    done: false,
    createdDate: todayISO()
  });

  const crmActions: CrmActions = {
    onSaveLead: lead => setLeads(list => upsert(list, lead)),
    onMoveLead: (lead: Lead, to: LeadStage, lostReason?: string) =>
      attempt(() => {
        const moved = moveLead(lead, to, todayISO(), lostReason);
        setLeads(list => upsert(list, moved));
      }),
    onConvert: (lead: Lead, details: ConvertDetails) =>
      attempt(() => {
        const today = todayISO();
        const result = convertLead(lead, details, { customers, today });
        setLeads(list => upsert(list, result.lead));
        setCustomers(list => [...list, result.customer]);
        // L'historique du prospect suit le nouveau client.
        setActivities(list => [
          ...list.map(a => (a.leadId === lead.id ? { ...a, customerId: result.customer.id } : a)),
          { id: newId('act'), date: today, type: ActivityType.NOTE, subject: 'Prospect converti en client', leadId: lead.id, customerId: result.customer.id }
        ]);
        setCrmTasks(list => list.map(t => (t.leadId === lead.id ? { ...t, customerId: result.customer.id } : t)));
      }),
    onLog: (ref, input: LogInput) => {
      setActivities(list => [...list, { id: newId('act'), ...input.activity, ...ref }]);
      if (input.followUp) {
        const followUp = input.followUp;
        setCrmTasks(list => [...list, newTask(ref, followUp.title, followUp.dueDate)]);
      }
    },
    onAddTask: (ref, title, dueDate) => setCrmTasks(list => [...list, newTask(ref, title, dueDate)]),
    onCompleteTask: task => setCrmTasks(list => upsert(list, completeTask(task, todayISO()))),
    onStartQuote: startQuote
  };

  const restore = (data: WholesaleBackup) => {
    setProducts(data.products);
    setCustomers(data.customers);
    setOrders(data.orders);
    setSuppliers(data.suppliers);
    setPurchases(data.purchases);
    setMovements(data.movements);
    setSettings(data.settings);
    setCompany(data.company);
  };

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'crm', label: 'CRM' },
    { id: 'orders', label: 'Ventes' },
    { id: 'customers', label: 'Clients' },
    { id: 'purchases', label: 'Achats' },
    { id: 'suppliers', label: 'Fournisseurs' },
    { id: 'stock', label: 'Stock' },
    { id: 'catalog', label: 'Catalogue' },
    { id: 'profitability', label: 'Rentabilité' },
    { id: 'settings', label: 'Réglages' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Boxes className="text-indigo-600" /> Vente en gros
          </h1>
          <p className="text-sm text-gray-500">Produits d'entretien pour les professionnels : achats, stock, ventes et rentabilité</p>
        </div>
        <div className="bg-gray-100 p-1 rounded-lg inline-flex flex-wrap gap-1">
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

      {activeSubTab === 'overview' && (
        <Overview orders={orders} products={products} purchases={purchases} settings={settings} onGoTo={setActiveSubTab} />
      )}

      {activeSubTab === 'crm' && <Crm leads={leads} activities={activities} tasks={crmTasks} {...crmActions} />}

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

      {activeSubTab === 'stock' && (
        <Stock
          products={products}
          orders={orders}
          purchases={purchases}
          suppliers={suppliers}
          movements={movements}
          onAdjust={adjust}
          onCreateDraft={createDraftPurchase}
        />
      )}

      {activeSubTab === 'catalog' && (
        <Catalog products={products} suppliers={suppliers} settings={settings} onSave={saveProduct} />
      )}

      {activeSubTab === 'customers' && (
        <Customers
          customers={customers}
          orders={orders}
          settings={settings}
          onSave={c => setCustomers(list => upsert(list, c))}
          onNewOrder={startQuote}
        />
      )}

      {activeSubTab === 'purchases' && (
        <Purchases
          purchases={purchases}
          suppliers={suppliers}
          products={products}
          company={company}
          focus={purchaseFocus}
          onFocused={() => setPurchaseFocus(null)}
          {...purchaseActions}
        />
      )}

      {activeSubTab === 'suppliers' && (
        <Suppliers
          suppliers={suppliers}
          purchases={purchases}
          products={products}
          onSave={s => setSuppliers(list => upsert(list, s))}
          onNewPurchase={supplierId => {
            setPurchaseFocus({ supplierId });
            setActiveSubTab('purchases');
          }}
        />
      )}

      {activeSubTab === 'profitability' && <Profitability orders={orders} movements={movements} settings={settings} />}

      {activeSubTab === 'settings' && (
        <Settings
          settings={settings}
          company={company}
          backup={{ products, customers, orders, suppliers, purchases, movements, settings, company }}
          onSaveSettings={setSettings}
          onSaveCompany={setCompany}
          onRestore={restore}
          onReset={() =>
            restore({
              products: MOCK_WHOLESALE_PRODUCTS,
              customers: MOCK_WHOLESALE_CUSTOMERS,
              orders: MOCK_WHOLESALE_ORDERS,
              suppliers: MOCK_SUPPLIERS,
              purchases: MOCK_PURCHASES,
              movements: MOCK_STOCK_MOVEMENTS,
              settings: DEFAULT_WHOLESALE_SETTINGS,
              company: DEFAULT_COMPANY_SETTINGS
            })
          }
        />
      )}
    </div>
  );
};

export default Wholesale;
