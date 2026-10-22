
import React, { useState } from 'react';
import { Boxes } from 'lucide-react';
import {
  CompanySettings,
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
import Catalog from './wholesale/Catalog';
import Customers from './wholesale/Customers';
import Orders from './wholesale/Orders';
import Overview from './wholesale/Overview';
import Purchases from './wholesale/Purchases';
import Settings, { WholesaleBackup } from './wholesale/Settings';
import Stock from './wholesale/Stock';
import Suppliers from './wholesale/Suppliers';

type SubTab = 'overview' | 'orders' | 'customers' | 'purchases' | 'suppliers' | 'stock' | 'catalog' | 'settings';

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

  const restore = (data: WholesaleBackup) => {
    setProducts(data.products);
    setCustomers(data.customers);
    setOrders(data.orders);
    setSettings(data.settings);
    setCompany(data.company);
  };

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'orders', label: 'Ventes' },
    { id: 'customers', label: 'Clients' },
    { id: 'purchases', label: 'Achats' },
    { id: 'suppliers', label: 'Fournisseurs' },
    { id: 'stock', label: 'Stock' },
    { id: 'catalog', label: 'Catalogue' },
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
        <Overview orders={orders} products={products} settings={settings} onGoTo={setActiveSubTab} />
      )}

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
          onNewOrder={customerId => {
            setNewOrderFor(customerId);
            setActiveSubTab('orders');
          }}
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

      {activeSubTab === 'settings' && (
        <Settings
          settings={settings}
          company={company}
          backup={{ products, customers, orders, settings, company }}
          onSaveSettings={setSettings}
          onSaveCompany={setCompany}
          onRestore={restore}
          onReset={() =>
            restore({
              products: MOCK_WHOLESALE_PRODUCTS,
              customers: MOCK_WHOLESALE_CUSTOMERS,
              orders: MOCK_WHOLESALE_ORDERS,
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
