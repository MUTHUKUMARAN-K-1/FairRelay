/**
 * Geocoding via OpenStreetMap Nominatim (replaces Google Maps Geocoding).
 * Kept filename for minimal import changes; no Google dependency.
 */

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  displayName?: string;
  placeId?: string;
  raw?: unknown;
}

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'EcoLogiq-DeliveryApp/1.0';

export async function geocodeAddress(address: string): Promise<PlaceResult | null> {
  if (!address?.trim()) return null;
  try {
    const params = new URLSearchParams({
      q: address.trim(),
      format: 'json',
      limit: '1',
    });
    const res = await fetch(`${NOMINATIM_SEARCH}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const r = data[0];
      return {
        address: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        displayName: r.display_name,
      };
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  return null;
}

export async function geocodeAddressManually(address: string): Promise<PlaceResult | null> {
  return geocodeAddress(address);
}
