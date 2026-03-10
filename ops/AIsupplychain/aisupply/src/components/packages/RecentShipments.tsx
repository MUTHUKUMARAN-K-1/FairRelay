import { useEffect, useState } from 'react';
import { Package, Clock, Calendar } from 'lucide-react';
import { getPackageHistory } from '../../services/apiClient';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PackageHistory {
  id: string;
  packageId: string;
  pickup: {
    location: string;
    lat: number | null;
    lng: number | null;
  };
  delivery: {
    location: string;
    lat: number | null;
    lng: number | null;
  };
  cargoType: string;
  weight: number;
  status: string;
  createdAt: string;
}

export function RecentShipments() {
  const [packages, setPackages] = useState<PackageHistory[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await getPackageHistory();
      if (Array.isArray(response)) {
        setPackages(response);
        if (response.length > 0) {
          setSelectedPackage(response[0]);
        }
      } else {
        setPackages([]);
      }
    } catch (err) {
      console.error('Failed to load package history', err);
      setError('Could not load history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="animate-spin w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full mr-2"></div>
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
          <Clock className="w-5 h-5 text-orange-500" />
          <span>Package History</span>
        </h3>
        <button 
          onClick={fetchHistory} 
          className="text-xs text-orange-500 hover:text-orange-400 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Map View */}
      {selectedPackage && selectedPackage.pickup.lat && selectedPackage.delivery.lat && (
        <div className="h-64 rounded-lg overflow-hidden border border-white/10 mb-4">
          <MapContainer
            center={[
              (selectedPackage.pickup.lat + selectedPackage.delivery.lat) / 2,
              (selectedPackage.pickup.lng + selectedPackage.delivery.lng) / 2
            ]}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
            className="leaflet-dark-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* Pickup Marker */}
            <Marker position={[selectedPackage.pickup.lat, selectedPackage.pickup.lng]}>
              <Popup>
                <div className="text-sm">
                  <strong>Pickup</strong><br />
                  {selectedPackage.pickup.location}
                </div>
              </Popup>
            </Marker>
            
            {/* Delivery Marker */}
            <Marker position={[selectedPackage.delivery.lat, selectedPackage.delivery.lng]}>
              <Popup>
                <div className="text-sm">
                  <strong>Delivery</strong><br />
                  {selectedPackage.delivery.location}
                </div>
              </Popup>
            </Marker>
            
            {/* Route Line */}
            <Polyline
              positions={[
                [selectedPackage.pickup.lat, selectedPackage.pickup.lng],
                [selectedPackage.delivery.lat, selectedPackage.delivery.lng]
              ]}
              pathOptions={{ color: '#f97316', weight: 3, opacity: 0.7 }}
            />
          </MapContainer>
        </div>
      )}

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {packages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No packages found.
          </div>
        ) : (
          packages.map((pkg) => (
            <div 
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className={`bg-white/5 border rounded-lg p-4 hover:border-orange-500/30 transition-all duration-200 group cursor-pointer ${
                selectedPackage?.id === pkg.id ? 'border-orange-500/50 bg-white/10' : 'border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg ${
                    pkg.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-500' :
                    pkg.status === 'CANCELLED' ? 'bg-red-500/20 text-red-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{pkg.cargoType}</div>
                    <div className="text-xs text-gray-400">ID: {pkg.packageId}</div>
                  </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                   pkg.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                   pkg.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                   'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {pkg.status}
                </div>
              </div>

              <div className="space-y-2 relative">
                <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-white/10" />
                
                <div className="flex items-start space-x-3 relative z-10">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-800 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400">Pickup</div>
                    <div className="text-sm text-gray-200 truncate">{pkg.pickup.location}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 relative z-10">
                  <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-slate-800 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400">Delivery</div>
                    <div className="text-sm text-gray-200 truncate">{pkg.delivery.location}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(pkg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-white">{pkg.weight} kg</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
