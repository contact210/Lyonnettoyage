
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { LYON_CENTER, MOCK_SITES } from '../constants';

// Fix for default marker icon in Leaflet + React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapModule: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return <div className="h-full flex items-center justify-center">Chargement de la carte...</div>;

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Carte GIS Opérationnelle</h1>
          <p className="text-sm text-gray-500">Visualisation des chantiers et agents en temps réel sur la Métropole de Lyon</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">Optimiser les tournées</button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">Exporter la heatmap</button>
        </div>
      </div>

      <div className="flex-1 min-h-[600px] relative rounded-xl overflow-hidden border border-gray-200 shadow-inner">
        <MapContainer center={LYON_CENTER} zoom={13} scrollWheelZoom={true} className="z-10">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {MOCK_SITES.map((site) => (
            <Marker key={site.id} position={site.coords}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-indigo-600">{site.clientName}</h3>
                  <p className="text-xs text-gray-600 mb-2">{site.address}</p>
                  <div className="flex space-x-2">
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{site.type}</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{site.status}</span>
                  </div>
                  <button className="mt-3 w-full bg-indigo-50 text-indigo-600 py-1 rounded text-xs font-semibold hover:bg-indigo-100 transition-colors">Voir planning</button>
                </div>
              </Popup>
            </Marker>
          ))}
          {/* Example optimization zone */}
          <Circle 
            center={LYON_CENTER} 
            radius={2000} 
            pathOptions={{ color: 'indigo', fillColor: 'indigo', fillOpacity: 0.1 }} 
          />
        </MapContainer>

        {/* Floating Legend */}
        <div className="absolute top-4 right-4 z-20 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs">
          <h4 className="font-semibold text-sm mb-3">Légende</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> Bureaux</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Copropriété</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span> Ponctuel</div>
            <hr className="my-2" />
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white mr-2"></span> Agent en poste</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapModule;
