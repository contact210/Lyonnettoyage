
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Users, Building2, Clock, AlertTriangle } from 'lucide-react';

const data = [
  { name: 'Lun', ca: 4000, costs: 2400 },
  { name: 'Mar', ca: 3000, costs: 1398 },
  { name: 'Mer', ca: 2000, costs: 9800 },
  { name: 'Jeu', ca: 2780, costs: 3908 },
  { name: 'Ven', ca: 1890, costs: 4800 },
  { name: 'Sam', ca: 2390, costs: 3800 },
  { name: 'Dim', ca: 3490, costs: 4300 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tableau de Bord - Lyon Métropole</h1>
        <div className="text-sm text-gray-500">Dernière mise à jour: {new Date().toLocaleString()}</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Chantiers Actifs', value: '24', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Chiffre d\'Affaires (Mois)', value: '12,450 €', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Salariés en Poste', value: '18', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Heures Planifiées', value: '342h', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`${kpi.bg} p-2 rounded-lg`}>
                <kpi.icon className={`${kpi.color}`} size={24} />
              </div>
              <span className="text-xs font-semibold text-green-500 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Rentabilité Hebdomadaire (Lyon)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="ca" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCa)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts / Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Alertes Opérationnelles</h3>
          <div className="space-y-4">
            {[
              { type: 'warning', msg: 'Absence non remplacée - Site Tour Incity', time: 'Il y a 10 min' },
              { type: 'error', msg: 'Dépassement d\'heures - Marie Lefebvre', time: 'Il y a 1h' },
              { type: 'info', msg: 'Nouveau chantier à valider - Lyon 6ème', time: 'Il y a 3h' },
              { type: 'warning', msg: 'Badgeage hors zone - Jean Dupont', time: 'Il y a 4h' },
            ].map((alert, i) => (
              <div key={i} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`mt-0.5 mr-3 p-1.5 rounded-full ${
                  alert.type === 'error' ? 'bg-red-100 text-red-600' : 
                  alert.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                  'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.msg}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
            Voir toutes les notifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
