import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Trash2, X } from 'lucide-react';
import { getAllVirtualHubs, createVirtualHub, deleteVirtualHub } from '../services/apiClient';
import { useToast } from '../context/ToastContext';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom hub icon
const createHubIcon = (status: string = 'active') => {
  const color = status === 'Authorized' || status === 'active' ? '#10B981' : '#6B7280';
  return L.divIcon({
    className: 'custom-hub-marker',
    html: `
      <div class="relative flex flex-col items-center">
        <div class="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${color};">
          <div class="text-white text-xl">🤝</div>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
  });
};

interface Hub {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  type?: string | null;
  radius?: number | null;
  createdAt: string;
}

interface AdminHubMapProps {
  onHubAdded?: (hub: Hub) => void;
  onHubRemoved?: (hubId: string) => void;
  addMode: boolean;
}

// Component to handle map clicks
function MapClickHandler({ 
  addMode, 
  onMapClick 
}: { 
  addMode: boolean; 
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (addMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export function AdminHubMap({ onHubAdded, onHubRemoved, addMode }: AdminHubMapProps) {
  const { showToast } = useToast();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'Distribution',
    radius: 5
  });

  // Fetch hubs on mount
  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      setLoading(true);
      const data = await getAllVirtualHubs();
      setHubs(data);
    } catch (error) {
      console.error('Failed to fetch virtual hubs:', error);
      showToast('Error', 'Failed to load virtual hubs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingLocation({ lat, lng });
    setFormData({
      name: '',
      address: '',
      type: 'Distribution',
      radius: 5
    });
    setShowDialog(true);
  }, []);

  const handleCreateHub = async () => {
    if (!pendingLocation || !formData.name) {
      showToast('Validation Error', 'Hub name is required', 'error');
      return;
    }

    try {
      const newHub = await createVirtualHub({
        name: formData.name,
        address: formData.address || null,
        latitude: pendingLocation.lat,
        longitude: pendingLocation.lng,
        type: formData.type || null,
        radius: formData.radius || null
      });

      setHubs(prev => [...prev, newHub]);
      onHubAdded?.(newHub);
      setShowDialog(false);
      setPendingLocation(null);
      showToast('Success', `${formData.name} added successfully!`, 'success');
    } catch (error) {
      console.error('Failed to create virtual hub:', error);
      showToast('Error', 'Failed to create virtual hub', 'error');
    }
  };

  const handleRemoveHub = useCallback(async (hubId: string) => {
    try {
      await deleteVirtualHub(hubId);
      setHubs(prev => prev.filter(h => h.id !== hubId));
      onHubRemoved?.(hubId);
      showToast('Success', 'Hub removed successfully', 'success');
    } catch (error) {
      console.error('Failed to delete hub:', error);
      showToast('Error', 'Failed to delete hub', 'error');
    }
  }, [onHubRemoved, showToast]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-eco-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-brand-orange"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden">
      <MapContainer
        center={[20.5, 73.0]}
        zoom={6}
        style={{ height: '100%', width: '100%', background: '#111620' }}
        zoomControl={true}
        className="leaflet-dark-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapClickHandler addMode={addMode} onMapClick={handleMapClick} />
        
        {hubs.map((hub) => (
          <Marker
            key={hub.id}
            position={[hub.latitude, hub.longitude]}
            icon={createHubIcon('active')}
          >
            <Popup>
              <div className="text-sm min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-green-500">{hub.name}</strong>
                  <button
                    onClick={() => handleRemoveHub(hub.id)}
                    className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10"
                    title="Remove hub"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {hub.address && (
                  <div className="text-xs text-gray-400 mb-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {hub.address}
                  </div>
                )}
                <div className="text-xs text-gray-400 mb-2">
                  Coordinates: {hub.latitude.toFixed(4)}, {hub.longitude.toFixed(4)}
                </div>
                {hub.type && (
                  <div className="text-xs mb-1">
                    Type: <span className="text-white">{hub.type}</span>
                  </div>
                )}
                {hub.radius && (
                  <div className="text-xs mb-2">
                    Radius: <span className="text-white">{hub.radius} km</span>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Created: {new Date(hub.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {addMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-eco-brand-orange/95 backdrop-blur text-white px-4 py-2 rounded-lg shadow-lg z-[1000] flex items-center gap-2 animate-pulse">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-semibold">Click on map to add new hub</span>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-eco-card/95 backdrop-blur border border-eco-card-border rounded-lg p-3 shadow-lg z-[1000]">
        <div className="text-xs text-eco-text-secondary uppercase font-bold tracking-wider mb-1">Hub Network</div>
        <div className="text-white font-mono text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Total Hubs:</span>
            <span className="font-bold">{hubs.length}</span>
          </div>
        </div>
      </div>

      {/* Add Hub Dialog */}
      {showDialog && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]" onClick={() => setShowDialog(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-eco-card border border-eco-card-border rounded-xl p-6 shadow-2xl z-[2001] w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add New Virtual Hub</h3>
              <button onClick={() => setShowDialog(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Hub Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-eco-secondary border border-eco-card-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-eco-brand-orange"
                  placeholder="e.g., Virtual Hub Mumbai"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-eco-secondary border border-eco-card-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-eco-brand-orange"
                  placeholder="e.g., Mumbai, Maharashtra"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-eco-secondary border border-eco-card-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-eco-brand-orange"
                >
                  <option value="Distribution" className="bg-gray-900 text-white">Distribution</option>
                  <option value="Collection" className="bg-gray-900 text-white">Collection</option>
                  <option value="Transfer" className="bg-gray-900 text-white">Transfer</option>
                  <option value="Storage" className="bg-gray-900 text-white">Storage</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1">Radius (km)</label>
                <input
                  type="number"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: parseFloat(e.target.value) })}
                  className="w-full bg-eco-secondary border border-eco-card-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-eco-brand-orange"
                  min="1"
                  max="50"
                />
              </div>
              
              {pendingLocation && (
                <div className="text-xs text-gray-400">
                  Location: {pendingLocation.lat.toFixed(4)}, {pendingLocation.lng.toFixed(4)}
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateHub}
                  className="flex-1 bg-eco-brand-orange hover:bg-eco-brand-orange-hover text-white py-2 rounded-lg font-semibold transition-all"
                >
                  Create Hub
                </button>
                <button
                  onClick={() => setShowDialog(false)}
                  className="flex-1 bg-eco-secondary border border-eco-card-border hover:border-white/30 text-white py-2 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      <style>{`
        .leaflet-dark-map {
          background: #111620 !important;
        }
        .leaflet-control-attribution {
          background: rgba(17, 22, 32, 0.8) !important;
          color: #8B92A8 !important;
        }
        .leaflet-control-attribution a {
          color: #FF6B35 !important;
        }
        .leaflet-popup-content-wrapper {
          background: #1a1f2e !important;
          color: white !important;
          border: 1px solid #2A3142 !important;
        }
        .leaflet-popup-tip {
          background: #1a1f2e !important;
        }
        .custom-hub-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          cursor: ${addMode ? 'crosshair' : 'grab'} !important;
        }
      `}</style>
    </div>
  );
}
