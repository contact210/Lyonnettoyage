
import React from 'react';
import { Printer } from 'lucide-react';
import { CompanySettings, OrderStatus, WholesaleCustomer, WholesaleOrder, WholesaleSettings } from '../../types';
import { addDays, computeTotals, formatDate, formatEUR, lineTotalHT } from '../../services/wholesalePricing';
import { Modal, primaryButton, secondaryButton } from './ui';

export type DocumentKind = 'quote' | 'order' | 'delivery' | 'invoice';

export const DOCUMENT_TITLES: Record<DocumentKind, string> = {
  quote: 'Devis',
  order: 'Confirmation de commande',
  delivery: 'Bon de livraison',
  invoice: 'Facture'
};

export const QUOTE_VALIDITY_DAYS = 30;

export const documentsFor = (status: OrderStatus): DocumentKind[] => {
  switch (status) {
    case OrderStatus.QUOTE: return ['quote'];
    case OrderStatus.CONFIRMED: return ['order'];
    case OrderStatus.PREPARED:
    case OrderStatus.DELIVERED: return ['order', 'delivery'];
    case OrderStatus.INVOICED:
    case OrderStatus.PAID: return ['invoice', 'delivery'];
    default: return [];
  }
};

interface OrderDocumentProps {
  kind: DocumentKind;
  order: WholesaleOrder;
  customer?: WholesaleCustomer;
  company: CompanySettings;
  settings: WholesaleSettings;
  onClose: () => void;
}

const OrderDocument: React.FC<OrderDocumentProps> = ({ kind, order, customer, company, settings, onClose }) => {
  const t = computeTotals(order.lines, settings);
  const withPrices = kind !== 'delivery';
  const number = kind === 'invoice' ? order.invoiceNumber : order.number;
  const docDate = kind === 'invoice' ? order.invoiceDate : kind === 'delivery' ? order.deliveryDate ?? order.date : order.date;

  const dates: [string, string][] = [
    [`N° ${kind === 'invoice' ? 'de facture' : kind === 'delivery' ? 'de BL' : kind === 'quote' ? 'de devis' : 'de commande'}`, number ?? '—'],
    ["Date d'émission", formatDate(docDate)]
  ];
  if (kind === 'quote') dates.push(['Valable jusqu’au', formatDate(addDays(order.date, QUOTE_VALIDITY_DAYS))]);
  if (kind === 'order') dates.push(['Livraison prévue', formatDate(order.deliveryDate)]);
  if (kind === 'invoice') {
    dates.push(['Date de livraison', formatDate(order.deliveryDate)]);
    dates.push(["Date d'échéance", formatDate(order.dueDate)]);
  }
  if (kind === 'invoice') dates.push(['Commande', order.number]);

  return (
    <Modal
      wide
      printable
      title={`${DOCUMENT_TITLES[kind]} ${number ?? ''}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={secondaryButton}>Fermer</button>
          <button onClick={() => window.print()} className={primaryButton}>
            <Printer size={16} /> Imprimer / PDF
          </button>
        </>
      }
    >
      <div className="print-area bg-white text-gray-900 max-w-[800px] mx-auto">
        <div className="flex justify-between items-start mb-10 gap-8">
          <div>
            <h3 className="text-xl font-black text-indigo-900 mb-3">{company.name}</h3>
            <div className="text-xs text-gray-500 space-y-0.5">
              <p>{company.address}</p>
              <p>SIRET : {company.siret}</p>
              <p>TVA intracommunautaire : {company.tvaIntra}</p>
              <p>{company.email} · {company.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-gray-200 uppercase mb-3">{DOCUMENT_TITLES[kind]}</h1>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-gray-400 uppercase tracking-widest">{kind === 'delivery' ? 'Livré à' : 'Client'}</p>
              <p className="text-base font-bold">{order.customerName}</p>
              {customer && (
                <>
                  <p className="text-gray-500">{customer.address}</p>
                  <p className="text-gray-500">SIRET : {customer.siret}</p>
                  {customer.tvaIntra && <p className="text-gray-500">TVA : {customer.tvaIntra}</p>}
                  {customer.contactName && <p className="text-gray-500">À l'attention de {customer.contactName}</p>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`grid gap-6 mb-8 py-4 border-y border-gray-100`} style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}>
          {dates.map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
              <p className="text-sm font-bold whitespace-nowrap">{value}</p>
            </div>
          ))}
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Désignation</th>
              <th className="py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Réf.</th>
              <th className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase">Qté</th>
              {withPrices ? (
                <>
                  <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase">P.U. HT</th>
                  <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase">TVA</th>
                  <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Total HT</th>
                </>
              ) : (
                <th className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase">Qté reçue</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.lines.map(l => (
              <tr key={l.productId}>
                <td className="py-3 text-sm font-medium">{l.label}</td>
                <td className="py-3 text-xs font-mono text-gray-500">{l.sku}</td>
                <td className="py-3 text-center text-sm">{l.quantity}</td>
                {withPrices ? (
                  <>
                    <td className="py-3 text-right text-sm">{formatEUR(l.unitPrice)}</td>
                    <td className="py-3 text-right text-sm">{l.vatRate.toLocaleString('fr-FR')} %</td>
                    <td className="py-3 text-right text-sm font-bold">{formatEUR(lineTotalHT(l))}</td>
                  </>
                ) : (
                  <td className="py-3 text-center text-sm text-gray-300">……</td>
                )}
              </tr>
            ))}
            {withPrices && t.shippingHT > 0 && (
              <tr>
                <td className="py-3 text-sm font-medium">Frais de livraison</td>
                <td></td>
                <td className="py-3 text-center text-sm">1</td>
                <td className="py-3 text-right text-sm">{formatEUR(t.shippingHT)}</td>
                <td className="py-3 text-right text-sm">20 %</td>
                <td className="py-3 text-right text-sm font-bold">{formatEUR(t.shippingHT)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {withPrices && (
          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total HT</span><span className="font-bold">{formatEUR(t.totalHT)}</span></div>
              {t.vat.map(v => (
                <div key={v.rate} className="flex justify-between">
                  <span className="text-gray-500">TVA {v.rate.toLocaleString('fr-FR')} % sur {formatEUR(v.base)}</span>
                  <span className="font-bold">{formatEUR(v.vat)}</span>
                </div>
              ))}
              <div className="flex justify-between text-lg pt-2 border-t-2 border-indigo-600">
                <span className="font-black text-indigo-600">TOTAL TTC</span>
                <span className="font-black text-indigo-600">{formatEUR(t.totalTTC)}</span>
              </div>
              {kind === 'invoice' && order.status === OrderStatus.PAID && (
                <p className="text-right text-xs font-bold text-green-600">Acquittée le {formatDate(order.paidDate)}</p>
              )}
            </div>
          </div>
        )}

        {order.notes && (
          <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 mb-8"><b>Notes :</b> {order.notes}</p>
        )}

        {kind === 'invoice' && (
          <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">Règlement</h4>
              <div className="bg-gray-50 p-3 rounded-xl text-[11px] text-gray-600 space-y-0.5">
                <p>Virement avant le <b>{formatDate(order.dueDate)}</b></p>
                <p><b>IBAN :</b> {company.iban}</p>
                <p><b>BIC :</b> {company.bic}</p>
                <p>Référence à indiquer : {order.invoiceNumber}</p>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 leading-relaxed space-y-1">
              <p>Opération : livraison de biens.</p>
              <p>Pas d'escompte pour paiement anticipé.</p>
              <p>En cas de retard de paiement : pénalités au taux de trois fois le taux d'intérêt légal et indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 du Code de commerce).</p>
            </div>
          </div>
        )}

        {(kind === 'quote' || kind === 'delivery') && (
          <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-8 text-xs">
            <div className="text-gray-500 space-y-1">
              {kind === 'quote' ? (
                <>
                  <p>Devis valable {QUOTE_VALIDITY_DAYS} jours. Prix en euros hors taxes, selon les quantités commandées.</p>
                  <p>
                    Livraison offerte dès {formatEUR(settings.francoThreshold)} HT, sinon {formatEUR(settings.shippingFee)} HT.
                    Paiement à {customer?.paymentTermsDays ? `${customer.paymentTermsDays} jours` : 'réception'} date de facture.
                  </p>
                </>
              ) : (
                <p>Merci de vérifier les colis à la livraison et de noter toute réserve ci-contre.</p>
              )}
            </div>
            <div className="border border-gray-200 rounded-xl p-3 h-28">
              <p className="text-[10px] font-bold text-gray-400 uppercase">
                {kind === 'quote' ? 'Bon pour accord — date, nom et signature' : 'Reçu conforme — date, nom, signature et réserves'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OrderDocument;
