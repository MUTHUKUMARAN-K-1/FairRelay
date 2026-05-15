const API_KEY = import.meta.env.VITE_OLA_MAPS_API_KEY as string;
const BASE = 'https://api.olamaps.io';

export interface LatLng { lat: number; lng: number; }

export interface DirectionsResult {
  distanceMeters: number;
  durationSeconds: number;
  polylinePoints: LatLng[];
}

export interface DistanceMatrixResult {
  rows: Array<{
    elements: Array<{
      distanceMeters: number;
      durationSeconds: number;
      ok: boolean;
    }>;
  }>;
}

// Google Encoded Polyline Algorithm decoder
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export async function getDirections(
  origin: LatLng,
  destination: LatLng,
  waypoints?: LatLng[],
): Promise<DirectionsResult | null> {
  try {
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: 'driving',
      overview: 'full',
      api_key: API_KEY,
    });
    if (waypoints?.length) {
      params.set('waypoints', waypoints.map(w => `${w.lat},${w.lng}`).join('|'));
    }
    const res = await fetch(`${BASE}/routing/v1/directions?${params}`, { method: 'POST' });
    const data = await res.json();
    if (data.status === 'SUCCESS' && data.routes?.length > 0) {
      const route = data.routes[0];
      return {
        distanceMeters: route.legs.reduce((s: number, l: any) => s + l.distance, 0),
        durationSeconds: route.legs.reduce((s: number, l: any) => s + l.duration, 0),
        polylinePoints: decodePolyline(route.overview_polyline),
      };
    }
  } catch (err) {
    console.error('Ola Maps Directions error:', err);
  }
  return null;
}

export async function getDistanceMatrix(
  origins: LatLng[],
  destinations: LatLng[],
): Promise<DistanceMatrixResult | null> {
  try {
    const params = new URLSearchParams({
      origins: origins.map(o => `${o.lat},${o.lng}`).join('|'),
      destinations: destinations.map(d => `${d.lat},${d.lng}`).join('|'),
      api_key: API_KEY,
    });
    const res = await fetch(`${BASE}/routing/v1/distanceMatrix?${params}`);
    const data = await res.json();
    if (data.status === 'SUCCESS' && data.rows) {
      return {
        rows: data.rows.map((row: any) => ({
          elements: row.elements.map((el: any) => ({
            distanceMeters: el.distance,
            durationSeconds: el.duration,
            ok: el.status === 'OK',
          })),
        })),
      };
    }
  } catch (err) {
    console.error('Ola Maps Distance Matrix error:', err);
  }
  return null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({ latlng: `${lat},${lng}`, api_key: API_KEY });
    const res = await fetch(`${BASE}/places/v1/reverse-geocode?${params}`);
    const data = await res.json();
    if (data.results?.length > 0) {
      return data.results[0].formatted_address || data.results[0].name || null;
    }
  } catch (err) {
    console.error('Ola Maps Reverse Geocode error:', err);
  }
  return null;
}
