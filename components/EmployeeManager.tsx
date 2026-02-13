
import React from 'react';
import { MOCK_EMPLOYEES } from '../constants';
import { UserPlus, Mail, Phone, MapPin, MoreVertical, FileText } from 'lucide-react';

const EmployeeManager: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Salariés</h1>
          <p className="text-sm text-gray-500">Gérez vos équipes, contrats et documents RH</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <UserPlus size={18} />
          Ajouter un salarié
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {MOCK_EMPLOYEES.map((employee) => (
          <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:border-indigo-200 transition-all">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <img src={employee.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-50 ring-offset-2" />
                <button className="p-1 hover:bg-gray-100 rounded text-gray-400"><MoreVertical size={20} /></button>
              </div>
              <h3 className="text-lg font-bold">{employee.firstName} {employee.lastName}</h3>
              <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">{employee.role}</p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail size={16} className="mr-3 text-gray-400" /> {employee.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone size={16} className="mr-3 text-gray-400" /> {employee.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={16} className="mr-3 text-gray-400" /> {employee.address}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                <div className="text-center p-2 rounded-lg bg-gray-50">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Contrat</p>
                  <p className="text-sm font-bold text-gray-700">{employee.contractType}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-gray-50">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Taux Horaire</p>
                  <p className="text-sm font-bold text-gray-700">{employee.hourlyRate} €</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-600 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-colors">
                <FileText size={14} /> Dossier
              </button>
              <button className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                Planning
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeManager;
