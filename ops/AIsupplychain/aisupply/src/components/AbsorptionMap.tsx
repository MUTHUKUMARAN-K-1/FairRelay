import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAbsorptionMapData, getLiveTrackingGPS, getActiveRoute } from '../services/apiClient';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon creator using divIcon for better styling
const createCustomIcon = (color: string, icon: string, label?: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative flex flex-col items-center">
        <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${color};">
          <div class="text-white text-sm">${icon}</div>
        </div>
        ${label ? `<div class="mt-1 px-2 py-0.5 bg-gray-900 text-white text-[10px] font-semibold rounded shadow-lg whitespace-nowrap">${label}</div>` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Map auto-fit bounds component
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  
  return null;
}

export function AbsorptionMap() {
  const [data, setData] = useState<{ routes: any[], hubs: any[] }>({ routes: [], hubs: [] });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mapData, vehicleData] = await Promise.all([
            getAbsorptionMapData(),
            getLiveTrackingGPS()
        ]);
        setData(mapData);
        setVehicles(vehicleData);
      } catch (err: unknown) {
        const e = err as { response?: { status: number }; friendlyMessage?: string };
        console.error('Failed to fetch map data:', err);
        if (e?.response?.status === 403 && e?.friendlyMessage) {
          setData({ routes: [], hubs: [] });
        }
      }
    };

    fetchData();
    
    // Poll for vehicle updates every 30 seconds
    const interval = setInterval(async () => {
        try {
            const vehicleData = await getLiveTrackingGPS();
            setVehicles(vehicleData);
        } catch (err) {
            console.error('Failed to update vehicle locations:', err);
        }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleVehicleClick = async (truckId: string) => {
      try {
          // Reset previous selection
          setSelectedRoute(null);
          
          const routeData = await getActiveRoute(truckId);
          if (routeData) {
              // Parse polyline if needed or use straight line if checkpoints exist
              let positions: [number, number][] = [];
              
              if (routeData.polyline) {
                  try {
                      const parsed = JSON.parse(routeData.polyline);
                      if (Array.isArray(parsed)) positions = parsed;
                  } catch (e) {
                       // decoding logic if it is encoded string? For now assume JSON array or skip
                  }
              }
              
              if (positions.length === 0 && routeData.checkpoints?.length >= 2) {
                   // Fallback: Create path from checkpoints
                   positions = routeData.checkpoints.map((cp: any) => [cp.lat, cp.lng]);
              }
              
              setSelectedRoute({ ...routeData, positions });
          }
      } catch (err) {
          console.error('Failed to fetch vehicle route:', err);
      }
  };

  const allPositions: [number, number][] = [];

  // Helper to parse coordinates
  const getCoords = (lat: any, lng: any): [number, number] | null => {
    if (lat && lng) return [parseFloat(lat), parseFloat(lng)];
    return null;
  };

  // Process routes for bounds and lines
  const routePolylines = data.routes.map(route => {
    const start = getCoords(route.source?.lat, route.source?.lng);
    const end = getCoords(route.destination?.lat, route.destination?.lng);
    
    if (start) allPositions.push(start);
    if (end) allPositions.push(end);

    // If polyline string exists and is JSON, parse it. Otherwise use straight line for MVP
    let positions: [number, number][] = [];
    if (route.polyline) {
      try {
        const parsed = JSON.parse(route.polyline);
        if (Array.isArray(parsed)) {
           // Assume simplified [lat, lng] array
           positions = parsed;
           positions.forEach(p => allPositions.push(p));
        }
      } catch (e) {
        // Not JSON, assume straight line if start/end exist
        if (start && end) positions = [start, end];
      }
    } else if (start && end) {
      positions = [start, end];
    }

    return { ...route, positions };
  });

  // Add hubs to bounds
  data.hubs.forEach(hub => {
    const pos = getCoords(hub.latitude, hub.longitude);
    if (pos) allPositions.push(pos);
  });
  
  // Add vehicles to bounds
  vehicles.forEach(v => {
      if (v.location?.lat && v.location?.lng) {
          allPositions.push([v.location.lat, v.location.lng]);
      }
  });

  // Default center if no data
  const defaultCenter: [number, number] = [21.0, 73.0];

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={7}
        style={{ height: '100%', width: '100%', background: '#111620' }}
        zoomControl={false}
        className="leaflet-dark-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {allPositions.length > 0 && <FitBounds positions={allPositions} />}
        
        {/* Absorption Candidate Routes (Faded when vehicle selected) */}
        {routePolylines.map((route, idx) => (
          route.positions.length > 0 && (
            <div key={route.id} style={{ opacity: selectedRoute ? 0.3 : 1, transition: 'opacity 0.3s' }}>
              <Polyline
                positions={route.positions}
                pathOptions={{
                  color: ['#FF6B35', '#3B82F6', '#06B6D4', '#FBBF24', '#EC4899'][idx % 5],
                  weight: 3,
                  opacity: 0.8,
                }}
              />
              
              {/* Origin */}
              {route.positions[0] && (
                <Marker position={route.positions[0]} icon={createCustomIcon('#EF4444', '📍', route.source.location)}>
                  <Popup>
                     <div className="text-sm">
                       <strong>Origin: {route.source.location}</strong>
                       <div className="text-xs text-gray-400">Truck: {route.truckPlate}</div>
                     </div>
                  </Popup>
                </Marker>
              )}

              {/* Destination */}
              {route.positions[route.positions.length - 1] && (
                <Marker position={route.positions[route.positions.length - 1]} icon={createCustomIcon('#f97316', '⚓', route.destination.location)}>
                   <Popup><div className="text-sm"><strong>Dest: {route.destination.location}</strong></div></Popup>
                </Marker>
              )}
            </div>
          )
        ))}
        
        {/* Real-time Vehicles */}
        {vehicles.map(vehicle => {
            if (!vehicle.location?.lat || !vehicle.location?.lng) return null;
            return (
                <Marker
                    key={vehicle.id}
                    position={[vehicle.location.lat, vehicle.location.lng]}
                    icon={createCustomIcon('#EAB308', '🚛', vehicle.name.split('•')[0])}
                    eventHandlers={{
                        click: () => handleVehicleClick(vehicle.id),
                    }}
                >
                    <Popup>
                        <div className="text-sm">
                            <strong>{vehicle.name}</strong>
                            <div className="text-xs text-gray-400">Speed: {vehicle.location.speed} km/h</div>
                            <div className="text-xs text-green-400">Click to view route</div>
                        </div>
                    </Popup>
                </Marker>
            );
        })}
        
        {/* Selected Vehicle Route */}
        {selectedRoute && selectedRoute.positions && (
            <>
                <Polyline
                    positions={selectedRoute.positions}
                    pathOptions={{ color: '#EAB308', weight: 4, dashArray: '10, 10' }}
                />
                
                {selectedRoute.checkpoints?.map((cp: any, idx: number) => (
                     <Marker 
                        key={idx} 
                        position={[cp.lat, cp.lng]}
                        icon={createCustomIcon('#10B981', idx + 1 + '', cp.name)}
                     >
                        <Popup>{cp.name} ({cp.type})</Popup>
                     </Marker>
                ))}
            </>
        )}
        
        {/* Virtual Hubs */}
        {data.hubs.map(hub => {
            const pos = getCoords(hub.latitude, hub.longitude);
            if (!pos) return null;
            return (
                <div key={hub.id}>
                    <Marker 
                      position={pos}
                      icon={createCustomIcon('#10B981', '🤝', hub.name)}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong className="text-green-500">{hub.name}</strong>
                          <div className="text-xs text-gray-400">Type: {hub.type}</div>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={pos}
                      radius={(hub.radius || 5) * 1000}
                      pathOptions={{
                        fillColor: '#10B981',
                        fillOpacity: 0.1,
                        color: '#10B981',
                        weight: 1,
                        dashArray: '5, 5'
                      }}
                    />
                </div>
            );
        })}

      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-eco-card/95 backdrop-blur border border-eco-card-border rounded-lg p-3 shadow-lg z-[1000]">
        <div className="text-xs font-bold text-white mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-300">Origins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-300">Virtual Hubs</span>
          </div>
           <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-300">Live Vehicles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-300">Destinations</span>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for dark theme */}
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
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
