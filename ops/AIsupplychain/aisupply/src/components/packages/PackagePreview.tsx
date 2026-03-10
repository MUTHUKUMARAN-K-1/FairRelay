import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, MapPin, Flag, Clock, Weight, Box, Leaf } from 'lucide-react';
import type { PackageFormData } from './PackageForm';

// Fix default marker icons in Leaflet
delete (L.Icon.Default.prototype as L.Icon & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const pickupIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
const deliveryIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div class="w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow-lg"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
    }
  }, [map, positions]);
  return null;
}

interface PackagePreviewProps {
  data: PackageFormData;
}

export function PackagePreview({ data }: PackagePreviewProps) {
  const formatTime = (datetime: string) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDistance = (lat1?: number, lng1?: number, lat2?: number, lng2?: number) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const estimateDuration = (distance: string | null) => {
    if (!distance) return '-';
    const km = parseFloat(distance);
    const minutes = Math.round((km / 40) * 60);
    return `${minutes} min`;
  };

  const estimateCarbon = () => {
    const weight = parseFloat(data.weight) || 0;
    return (weight * 0.18).toFixed(1);
  };

  const distance = calculateDistance(
    data.pickupLat,
    data.pickupLng,
    data.deliveryLat,
    data.deliveryLng
  );

  const hasPickup = data.pickupLat != null && data.pickupLng != null;
  const hasDelivery = data.deliveryLat != null && data.deliveryLng != null;
  const center: [number, number] = useMemo(() => {
    if (hasPickup && hasDelivery) {
      return [
        (data.pickupLat! + data.deliveryLat!) / 2,
        (data.pickupLng! + data.deliveryLng!) / 2,
      ];
    }
    if (hasPickup) return [data.pickupLat!, data.pickupLng!];
    if (hasDelivery) return [data.deliveryLat!, data.deliveryLng!];
    return [20.5937, 78.9629];
  }, [hasPickup, hasDelivery, data.pickupLat, data.pickupLng, data.deliveryLat, data.deliveryLng]);

  const polylinePositions: [number, number][] = useMemo(() => {
    if (hasPickup && hasDelivery)
      return [
        [data.pickupLat!, data.pickupLng!],
        [data.deliveryLat!, data.deliveryLng!],
      ];
    return [];
  }, [hasPickup, hasDelivery, data.pickupLat, data.pickupLng, data.deliveryLat, data.deliveryLng]);

  const mapContent =
    hasPickup || hasDelivery ? (
      <MapContainer
        center={center}
        zoom={hasPickup && hasDelivery ? 6 : 10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        className="rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {polylinePositions.length === 2 && (
          <>
            <FitBounds positions={polylinePositions} />
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: '#EA580C', weight: 4, opacity: 0.9 }}
            />
          </>
        )}
        {hasPickup && (
          <Marker
            position={[data.pickupLat!, data.pickupLng!]}
            icon={pickupIcon}
            title="Pickup"
          />
        )}
        {hasDelivery && (
          <Marker
            position={[data.deliveryLat!, data.deliveryLng!]}
            icon={deliveryIcon}
            title="Delivery"
          />
        )}
      </MapContainer>
    ) : (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        <div className="text-center p-4">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Add pickup and delivery locations to see map</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-orange-600/20 rounded-lg">
          <Package className="w-6 h-6 text-orange-500" />
        </div>
        <h3 className="text-xl font-semibold text-white">Package Summary</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pickup</div>
            <div className="text-white font-medium text-sm">{data.pickupLocation || 'Not set'}</div>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Flag className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Delivery</div>
            <div className="text-white font-medium text-sm">{data.deliveryLocation || 'Not set'}</div>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Time Window</div>
            <div className="text-white font-medium text-sm">
              {formatTime(data.pickupTimeStart)} - {formatTime(data.deliveryTimeStart)}
            </div>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Weight className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Weight</div>
            <div className="text-white font-medium text-sm">{data.weight || '0'} kg</div>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Box className="w-5 h-5 text-cyan-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Volume</div>
            <div className="text-white font-medium text-sm">{data.volume || '0'} m³</div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden h-48">
        {mapContent}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Estimated Distance</span>
          <span className="text-white font-semibold">{distance ? `${distance} km` : '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Duration</span>
          <span className="text-white font-semibold">{estimateDuration(distance)}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-400 text-sm">Carbon Footprint</span>
          </div>
          <span className="text-emerald-400 font-semibold">~{estimateCarbon()} kg CO₂</span>
        </div>
      </div>

      {data.urgent && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 font-semibold text-sm">Urgent Delivery</span>
        </div>
      )}
    </div>
  );
}
