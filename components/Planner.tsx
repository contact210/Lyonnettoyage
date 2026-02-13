
import React from 'react';
import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import { MOCK_EMPLOYEES, MOCK_SITES } from '../constants';

const days = ['Lun 15', 'Mar 16', 'Mer 17', 'Jeu 18', 'Ven 19', 'Sam 20', 'Dim 21'];

const Planner: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Planning d'Intervention</h1>
          <p className="text-sm text-gray-500">Affectation des agents et gestion des tournées</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <button className="p-2 hover:bg-gray-50 border-r border-gray-300"><ChevronLeft size={20} /></button>
            <span className="px-4 text-sm font-semibold">Mai 2024</span>
            <button className="p-2 hover:bg-gray-50 border-l border-gray-300"><ChevronRight size={20} /></button>
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={18} /> Exporter
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus size={18} /> Shift
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Header Row */}
          <div className="grid grid-cols-[200px_repeat(7,1fr)] bg-gray-50 border-b border-gray-200">
            <div className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-r border-gray-200">Salariés</div>
            {days.map((day, i) => (
              <div key={i} className="p-4 text-center">
                <span className="text-xs font-bold text-gray-600 uppercase block">{day.split(' ')[0]}</span>
                <span className="text-sm font-bold text-indigo-600">{day.split(' ')[1]}</span>
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          {MOCK_EMPLOYEES.map((emp) => (
            <div key={emp.id} className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-gray-100">
              <div className="p-4 border-r border-gray-100 bg-gray-50/30 flex items-center space-x-3">
                <img src={emp.photoUrl} className="w-8 h-8 rounded-full" alt="" />
                <div>
                  <p className="text-xs font-bold truncate">{emp.firstName} {emp.lastName.charAt(0)}.</p>
                  <p className="text-[10px] text-gray-500">{emp.role}</p>
                </div>
              </div>
              {days.map((_, i) => (
                <div key={i} className="p-2 h-24 border-r border-gray-50 last:border-r-0 hover:bg-gray-50/50 cursor-pointer transition-colors relative">
                   {/* Mock Shift Card */}
                   {i === 0 && emp.id === 'emp-1' && (
                     <div className="absolute inset-2 bg-indigo-100 border-l-4 border-indigo-600 p-1.5 rounded-r-md text-[10px] shadow-sm">
                       <p className="font-bold text-indigo-900 truncate">Tour Incity</p>
                       <p className="text-indigo-700">08:00 - 16:00</p>
                     </div>
                   )}
                   {i === 2 && emp.id === 'emp-2' && (
                     <div className="absolute inset-2 bg-green-100 border-l-4 border-green-600 p-1.5 rounded-r-md text-[10px] shadow-sm">
                       <p className="font-bold text-green-900 truncate">Bellecour</p>
                       <p className="text-green-700">10:00 - 14:00</p>
                     </div>
                   )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Planner;
