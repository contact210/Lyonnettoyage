
import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, PackageX, ShoppingCart } from 'lucide-react';
import { StockMovement, StockMovementType, WholesaleOrder, WholesaleSettings } from '../../types';
import { addDays, formatEUR, round2, todayISO } from '../../services/wholesalePricing';
import { profitability, shippingRevenue } from '../../services/wholesaleStock';

type Period = 'month' | 'lastMonth' | 'year' | 'all';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'month', label: 'Ce mois' },
  { id: 'lastMonth', label: 'Mois dernier' },
  { id: 'year', label: 'Cette année' },
  { id: 'all', label: 'Tout' }
];

const periodRange = (period: Period, today: string): { from?: string; to?: string } => {
  const [y, m] = today.split('-').map(Number);
  const monthStart = `${today.slice(0, 7)}-01`;
  switch (period) {
    case 'month': return { from: monthStart, to: today };
    case 'lastMonth': {
      const start = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
      return { from: start, to: addDays(monthStart, -1) };
    }
    case 'year': return { from: `${y}-01-01`, to: today };
    default: return {};
  }
};

interface ProfitabilityProps {
  orders: WholesaleOrder[];
  movements: StockMovement[];
  settings: WholesaleSettings;
}

const Profitability: React.FC<ProfitabilityProps> = ({ orders, movements, settings }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [by, setBy] = useState<'product' | 'customer'>('product');
  const today = todayISO();
  const range = periodRange(period, today);

  const rows = useMemo(() => profitability(orders, by, range), [orders, by, period, today]);
  const inRange = (date: string) => (!range.from || date >= range.from) && (!range.to || date <= range.to);
  const periodMoves = movements.filter(m => inRange(m.date));

  const revenue = round2(rows.reduce((s, r) => s + r.revenueHT, 0));
  const cost = round2(rows.reduce((s, r) => s + r.costHT, 0));
  const margin = round2(revenue - cost);
  const rate = revenue > 0 ? (margin / revenue) * 100 : 0;
  const shipping = shippingRevenue(orders, settings, range);
  const purchased = round2(periodMoves.filter(m => m.type === StockMovementType.PURCHASE).reduce((s, m) => s + m.quantity * m.unitCost, 0));
  // Pertes, écarts d'inventaire et ajustements, valorisés au CMP (négatif = coût).
  const shrinkage = round2(
    periodMoves
      .filter(m => m.type === StockMovementType.LOSS || m.type === StockMovementType.COUNT || m.type === StockMovementType.ADJUSTMENT)
      .reduce((s, m) => s + m.quantity * m.unitCost, 0)
  );
  const maxMargin = Math.max(...rows.map(r => Math.abs(r.marginHT)), 1);

  const kpis = [
    { label: 'Ventes HT (marchandises)', value: formatEUR(revenue), sub: shipping ? `+ ${formatEUR(shipping)} de port facturé` : 'Commandes confirmées à payées', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Coût des ventes', value: formatEUR(cost), sub: 'Au CMP du jour de sortie', icon: TrendingDown, color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'Marge brute', value: formatEUR(margin), sub: `${rate.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % des ventes`, icon: TrendingUp, color: rate < settings.minMarginRate ? 'text-red-600' : 'text-green-600', bg: rate < settings.minMarginRate ? 'bg-red-50' : 'bg-green-50', warn: revenue > 0 && rate < settings.minMarginRate },
    { label: 'Achats reçus HT', value: formatEUR(purchased), sub: 'Au coût de revient (port inclus)', icon: ShoppingCart, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Pertes et écarts', value: formatEUR(shrinkage), sub: 'Casse, inventaire, ajustements', icon: PackageX, color: shrinkage < 0 ? 'text-red-600' : 'text-gray-600', bg: shrinkage < 0 ? 'bg-red-50' : 'bg-gray-100' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md ${period === p.id ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">Ventes engagées : de la confirmation au paiement, par date de commande.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`bg-white p-5 rounded-xl shadow-sm border ${k.warn ? 'border-red-200' : 'border-gray-100'}`}>
            <div className={`${k.bg} p-2 rounded-lg w-fit mb-3`}><k.icon className={k.color} size={18} /></div>
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <h3 className={`text-xl font-bold ${k.warn ? 'text-red-600' : ''}`}>{k.value}</h3>
            <p className="text-[11px] text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between gap-3">
          <h3 className="font-bold">Marge par {by === 'product' ? 'produit' : 'client'}</h3>
          <div className="bg-gray-100 p-1 rounded-lg inline-flex gap-1">
            {(['product', 'customer'] as const).map(b => (
              <button
                key={b}
                onClick={() => setBy(b)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md ${by === b ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {b === 'product' ? 'Par produit' : 'Par client'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[860px]">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase">{by === 'product' ? 'Produit' : 'Client'}</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Unités</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Ventes HT</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Coût</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Marge</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">%</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase w-48"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => {
                const low = r.marginRate < settings.minMarginRate;
                return (
                  <tr key={r.id}>
                    <td className="px-5 py-3 text-sm font-medium">{r.label}</td>
                    <td className="px-3 py-3 text-sm text-right">{r.quantity}</td>
                    <td className="px-3 py-3 text-sm text-right">{formatEUR(r.revenueHT)}</td>
                    <td className="px-3 py-3 text-sm text-right text-gray-500">{formatEUR(r.costHT)}</td>
                    <td className="px-3 py-3 text-sm text-right font-bold">{formatEUR(r.marginHT)}</td>
                    <td className={`px-3 py-3 text-sm text-right font-bold ${low ? 'text-red-600' : 'text-green-600'}`}>
                      {r.marginRate.toLocaleString('fr-FR')} %
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${low ? 'bg-red-400' : 'bg-indigo-500'}`}
                          style={{ width: `${(Math.max(r.marginHT, 0) / maxMargin) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">Aucune vente confirmée sur cette période.</td></tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-gray-50/50 border-t border-gray-100">
                <tr>
                  <td className="px-5 py-3 text-sm font-bold">Total</td>
                  <td className="px-3 py-3 text-sm text-right font-bold">{rows.reduce((s, r) => s + r.quantity, 0)}</td>
                  <td className="px-3 py-3 text-sm text-right font-bold">{formatEUR(revenue)}</td>
                  <td className="px-3 py-3 text-sm text-right font-bold text-gray-500">{formatEUR(cost)}</td>
                  <td className="px-3 py-3 text-sm text-right font-bold">{formatEUR(margin)}</td>
                  <td className="px-3 py-3 text-sm text-right font-bold">{rate.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Profitability;
