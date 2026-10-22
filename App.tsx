
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Calendar, 
  Map as MapIcon, 
  Euro, 
  ShieldCheck,
  Bell,
  Search,
  Menu,
  X,
  Sparkles,
  Boxes
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import EmployeeManager from './components/EmployeeManager';
import SiteManager from './components/SiteManager';
import MapModule from './components/MapModule';
import Planner from './components/Planner';
import Financials from './components/Financials';
import AIAssistant from './components/AIAssistant';
import Wholesale from './components/Wholesale';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'employees', label: 'Salariés / RH', icon: Users },
    { id: 'sites', label: 'Clients & Chantiers', icon: Building2 },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'map', label: 'Carte GIS', icon: MapIcon },
    { id: 'financials', label: 'Finance & Factures', icon: Euro },
    { id: 'wholesale', label: 'Vente en gros', icon: Boxes },
    { id: 'ai-assistant', label: 'Assistant IA', icon: Sparkles },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'employees': return <EmployeeManager />;
      case 'sites': return <SiteManager />;
      case 'planning': return <Planner />;
      case 'map': return <MapModule />;
      case 'financials': return <Financials />;
      case 'wholesale': return <Wholesale />;
      case 'ai-assistant': return <AIAssistant />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-indigo-900 text-white transition-all duration-300 ease-in-out flex flex-col fixed h-full z-50`}
      >
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight">CleanLyon Pro</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-indigo-800 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-4 px-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-indigo-700 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              }`}
            >
              <item.icon size={20} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">AD</div>
            {isSidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">Admin Lyon</p>
                <p className="text-xs text-indigo-300 truncate">admin@cleanlyon.fr</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-96">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Rechercher salarié, chantier, facture..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-indigo-600">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
              <span className="text-sm font-medium">Agence Lyon Centre</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
