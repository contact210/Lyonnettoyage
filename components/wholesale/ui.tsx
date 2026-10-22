
import React from 'react';
import { X } from 'lucide-react';
import { OrderStatus, WholesaleProduct } from '../../types';

export const inputClass =
  'w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none';

export const labelClass = 'block text-xs font-bold text-gray-400 uppercase mb-1';

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> = ({
  label,
  hint,
  children,
  className
}) => (
  <label className={`block ${className ?? ''}`}>
    <span className={labelClass}>{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
  </label>
);

export const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  printable?: boolean; // à l'impression, seul le contenu .print-area est imprimé
}> = ({ title, onClose, children, footer, wide, printable }) => (
  <div className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 ${printable ? 'print-reset' : ''}`}>
    <div
      className={`bg-white w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'} max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 ${printable ? 'print-reset' : ''}`}
    >
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="font-bold text-gray-800">{title}</h2>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Fermer">
          <X size={20} />
        </button>
      </div>
      <div className={`flex-1 overflow-y-auto p-6 ${printable ? 'print-reset' : ''}`}>{children}</div>
      {footer && <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">{footer}</div>}
    </div>
  </div>
);

export const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.QUOTE]: 'bg-gray-100 text-gray-700',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-700',
  [OrderStatus.PREPARED]: 'bg-amber-100 text-amber-700',
  [OrderStatus.DELIVERED]: 'bg-purple-100 text-purple-700',
  [OrderStatus.INVOICED]: 'bg-indigo-100 text-indigo-700',
  [OrderStatus.PAID]: 'bg-green-100 text-green-700',
  [OrderStatus.CANCELED]: 'bg-red-100 text-red-700'
};

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${STATUS_COLORS[status]}`}>
    {status}
  </span>
);

export const stockLevel = (p: WholesaleProduct): 'out' | 'low' | 'ok' =>
  p.stock <= 0 ? 'out' : p.stock <= p.minStock ? 'low' : 'ok';

export const StockBadge: React.FC<{ product: WholesaleProduct }> = ({ product }) => {
  const level = stockLevel(product);
  const style =
    level === 'out' ? 'bg-red-100 text-red-700' : level === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
  const text = level === 'out' ? 'Rupture' : level === 'low' ? 'Stock bas' : 'En stock';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${style}`}>{text}</span>;
};

export const primaryButton =
  'flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed';

export const secondaryButton =
  'flex items-center justify-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export { newId } from '../../services/wholesalePricing';

// Lit un nombre saisi au clavier français (« 12,5 » comme « 12.5 »).
export const parseNumber = (value: string) => {
  if (value.trim() === '') return NaN;
  const n = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};
