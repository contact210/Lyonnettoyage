
import React from 'react';
import { MOCK_SITES } from '../constants';
import { Building2, MapPin, Calendar, Clock, Filter, Plus } from 'lucide-react';

const SiteManager: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Chantiers & Clients</h1>
          <p className="text-sm text-gray-500">Gérez vos sites d'intervention sur la métropole lyonnaise</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            Filtrer
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={18} />
            Nouveau chantier
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Site / Client</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type / Fréquence</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Durée / Staff</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tarification</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_SITES.map((site) => (
              <tr key={site.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                      <Building2 className="text-indigo-600" size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{site.clientName}</p>
                      <p className="text-xs text-gray-500 flex items-center mt-0.5">
                        <MapPin size={10} className="mr-1" /> {site.address}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold w-fit uppercase">{site.type}</span>
                    <span className="text-xs text-gray-600 flex items-center">
                      <Calendar size={12} className="mr-1 text-gray-400" /> {site.frequency}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium flex items-center">
                      <Clock size={14} className="mr-1.5 text-gray-400" /> {site.duration}h par intervention
                    </div>
                    <div className="text-xs text-gray-500">{site.agentsRequired} agent(s) requis</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">{site.hourlyRate} € / h</p>
                  <p className="text-xs text-green-600 font-semibold">Rentabilité: ~28%</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    site.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {site.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">Modifier</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SiteManager;
