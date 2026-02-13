
import React, { useState } from 'react';
import { 
  FileCheck, 
  FileText, 
  Send, 
  Clock, 
  ArrowUpRight, 
  TrendingDown, 
  Plus, 
  Settings, 
  Download, 
  Trash2, 
  Eye, 
  X, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { MOCK_INVOICES, DEFAULT_COMPANY_SETTINGS, MOCK_SITES } from '../constants';
import { Invoice, InvoiceStatus, InvoiceItem } from '../types';
import { getFinancialSummaryIA } from '../services/geminiService';

const Financials: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create' | 'settings'>('list');
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Stats calculation
  const totalPaid = invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((sum, i) => sum + i.totalTTC, 0);
  const totalPending = invoices.filter(i => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.OVERDUE).reduce((sum, i) => sum + i.totalTTC, 0);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return 'bg-green-100 text-green-700';
      case InvoiceStatus.OVERDUE: return 'bg-red-100 text-red-700';
      case InvoiceStatus.SENT: return 'bg-blue-100 text-blue-700';
      case InvoiceStatus.DRAFT: return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAIAnalysis = async () => {
    setIsAIAnalyzing(true);
    const report = await getFinancialSummaryIA(invoices);
    setAiReport(report);
    setIsAIAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Finance & Facturation</h1>
          <p className="text-sm text-gray-500">Gestion conforme aux normes françaises (Loi Anti-Fraude TVA)</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
             <button 
               onClick={() => setActiveSubTab('list')}
               className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Factures
             </button>
             <button 
               onClick={() => setActiveSubTab('settings')}
               className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'settings' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Paramètres
             </button>
           </div>
           <button 
            onClick={() => setActiveSubTab('create')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
           >
             <Plus size={18} /> Nouvelle Facture
           </button>
        </div>
      </div>

      {activeSubTab === 'list' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Encaissé (Mois)</p>
              <h3 className="text-2xl font-black text-green-600">{totalPaid.toLocaleString()} €</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">En attente</p>
              <h3 className="text-2xl font-black text-amber-500">{totalPending.toLocaleString()} €</h3>
            </div>
            <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
               <div className="relative z-10 flex flex-col justify-between h-full">
                 <div>
                   <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">IA Insights</p>
                   <p className="text-xs opacity-90">Analyse de trésorerie par Gemini</p>
                 </div>
                 <button 
                  onClick={handleAIAnalysis}
                  disabled={isAIAnalyzing}
                  className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-[10px] font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-2"
                 >
                   {isAIAnalyzing ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles size={12} />}
                   Générer le rapport
                 </button>
               </div>
               <Sparkles className="absolute bottom-[-10px] right-[-10px] opacity-10" size={80} />
            </div>
          </div>

          {aiReport && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-4 animate-in slide-in-from-top-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Sparkles size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-indigo-900 leading-relaxed font-medium">{aiReport}</p>
                <button onClick={() => setAiReport(null)} className="text-[10px] text-indigo-400 font-bold uppercase mt-2 hover:text-indigo-600">Fermer</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold">Journal des Ventes</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 border border-gray-200"><Download size={16} /></button>
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Facture</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Client</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Échéance</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Montant TTC</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Statut</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{inv.number}</td>
                    <td className="px-6 py-4 text-sm font-medium">{inv.clientName}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-right">{inv.totalTTC.toLocaleString()} €</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeSubTab === 'create' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Nouvelle Facture de Prestation</h2>
            <button onClick={() => setActiveSubTab('list')} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Sélectionner un Client</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                  {MOCK_SITES.map(s => <option key={s.id}>{s.clientName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date d'émission</label>
                  <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date d'échéance</label>
                  <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm" />
                </div>
              </div>
            </div>
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col justify-center">
               <p className="text-xs font-bold text-indigo-400 uppercase mb-2 text-center">Estimation Totale</p>
               <h3 className="text-4xl font-black text-indigo-900 text-center">0.00 €</h3>
            </div>
          </div>

          <div className="mb-8">
             <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Lignes de prestation</label>
             <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
               <div className="grid grid-cols-12 gap-4 mb-2">
                 <div className="col-span-6 text-[10px] font-bold text-gray-400 uppercase">Désignation</div>
                 <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase">Qté</div>
                 <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase">P.U HT</div>
                 <div className="col-span-2"></div>
               </div>
               <div className="grid grid-cols-12 gap-4 mb-4">
                 <input className="col-span-6 p-2 rounded border border-gray-200 text-sm" placeholder="ex: Nettoyage Vitrerie - T1 2024" />
                 <input type="number" className="col-span-2 p-2 rounded border border-gray-200 text-sm" defaultValue={1} />
                 <input type="number" className="col-span-2 p-2 rounded border border-gray-200 text-sm" placeholder="0.00" />
                 <button className="col-span-2 text-red-400 hover:text-red-600 flex items-center justify-center"><Trash2 size={16} /></button>
               </div>
               <button className="text-indigo-600 text-xs font-bold flex items-center gap-2 hover:bg-white px-3 py-1.5 rounded-lg transition-all">+ Ajouter une ligne</button>
             </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">Brouillon</button>
            <button className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Émettre la facture</button>
          </div>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl mx-auto animate-in fade-in">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            <Settings className="text-gray-400" /> Paramètres Entreprise
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Raison Sociale</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm" defaultValue={DEFAULT_COMPANY_SETTINGS.name} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">SIRET</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm" defaultValue={DEFAULT_COMPANY_SETTINGS.siret} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Adresse Siège</label>
              <textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm h-24" defaultValue={DEFAULT_COMPANY_SETTINGS.address} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">IBAN</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm" defaultValue={DEFAULT_COMPANY_SETTINGS.iban} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">BIC</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm" defaultValue={DEFAULT_COMPANY_SETTINGS.bic} />
              </div>
            </div>
            <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
              Enregistrer les modifications
            </button>
          </div>
        </div>
      )}

      {/* Invoice Detail / Preview Overlay */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>
                <h2 className="font-bold text-gray-700">Facture {selectedInvoice.number}</h2>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100"><Download size={14}/> PDF</button>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 bg-white">
               {/* Real invoice layout */}
               <div className="flex justify-between items-start mb-16">
                 <div>
                   <h3 className="text-xl font-black text-indigo-900 mb-4">{DEFAULT_COMPANY_SETTINGS.name}</h3>
                   <div className="text-xs text-gray-500 space-y-1">
                     <p>{DEFAULT_COMPANY_SETTINGS.address}</p>
                     <p>SIRET : {DEFAULT_COMPANY_SETTINGS.siret}</p>
                     <p>TVA Intra : {DEFAULT_COMPANY_SETTINGS.tvaIntra}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <h1 className="text-4xl font-black text-gray-100 mb-4">FACTURE</h1>
                   <div className="text-xs space-y-1">
                     <p className="font-bold text-gray-400 uppercase tracking-widest">Facture à</p>
                     <p className="text-base font-bold text-gray-900">{selectedInvoice.clientName}</p>
                     <p className="text-gray-500">{MOCK_SITES.find(s => s.id === selectedInvoice.clientId)?.address}</p>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-8 mb-12 py-6 border-y border-gray-100">
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">N° de Facture</p>
                   <p className="text-sm font-bold">{selectedInvoice.number}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Date d'émission</p>
                   <p className="text-sm font-bold">{new Date(selectedInvoice.date).toLocaleDateString()}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Date d'échéance</p>
                   <p className="text-sm font-bold text-red-600">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                 </div>
               </div>

               <table className="w-full mb-12">
                 <thead>
                   <tr className="border-b border-gray-100">
                     <th className="py-4 text-left text-[10px] font-bold text-gray-400 uppercase">Désignation</th>
                     <th className="py-4 text-center text-[10px] font-bold text-gray-400 uppercase">Qté</th>
                     <th className="py-4 text-right text-[10px] font-bold text-gray-400 uppercase">P.U HT</th>
                     <th className="py-4 text-right text-[10px] font-bold text-gray-400 uppercase">Total HT</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {selectedInvoice.items.map((item, idx) => (
                     <tr key={idx}>
                       <td className="py-6">
                         <p className="text-sm font-bold text-gray-800">{item.description}</p>
                       </td>
                       <td className="py-6 text-center text-sm">{item.quantity}</td>
                       <td className="py-6 text-right text-sm">{item.unitPrice.toLocaleString()} €</td>
                       <td className="py-6 text-right text-sm font-bold">{(item.quantity * item.unitPrice).toLocaleString()} €</td>
                     </tr>
                   ))}
                 </tbody>
               </table>

               <div className="flex justify-end">
                 <div className="w-64 space-y-3">
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Total HT</span>
                     <span className="font-bold">{selectedInvoice.totalHT.toLocaleString()} €</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">TVA (20%)</span>
                     <span className="font-bold">{(selectedInvoice.totalTTC - selectedInvoice.totalHT).toLocaleString()} €</span>
                   </div>
                   <div className="flex justify-between text-lg pt-3 border-t-2 border-indigo-600">
                     <span className="font-black text-indigo-600">TOTAL TTC</span>
                     <span className="font-black text-indigo-600">{selectedInvoice.totalTTC.toLocaleString()} €</span>
                   </div>
                 </div>
               </div>

               <div className="mt-20 pt-12 border-t border-gray-100 grid grid-cols-2 gap-12">
                 <div>
                   <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3">Informations de paiement</h4>
                   <div className="bg-gray-50 p-4 rounded-xl text-[10px] text-gray-600 space-y-1">
                     <p><span className="font-bold">IBAN :</span> {DEFAULT_COMPANY_SETTINGS.iban}</p>
                     <p><span className="font-bold">BIC :</span> {DEFAULT_COMPANY_SETTINGS.bic}</p>
                   </div>
                 </div>
                 <div className="text-[10px] text-gray-400 leading-relaxed italic">
                   <p className="mb-2">En cas de retard de paiement, une indemnité forfaitaire pour frais de recouvrement de 40 € sera due (Art. L. 441-6 du Code de commerce).</p>
                   <p>Pénalités de retard : 3 fois le taux d'intérêt légal.</p>
                 </div>
               </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              {selectedInvoice.status !== InvoiceStatus.PAID && (
                <button className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100">Relancer le client</button>
              )}
              <button className="bg-white text-gray-600 font-bold px-6 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Marquer comme payée</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financials;
