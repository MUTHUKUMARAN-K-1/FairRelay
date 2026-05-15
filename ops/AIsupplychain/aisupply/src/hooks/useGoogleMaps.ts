/**
 * Geocoding via Ola Maps API (https://api.olamaps.io).
 * Filename kept for minimal import changes across the codebase.
 */

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  displayName?: string;
  placeId?: string;
  raw?: unknown;
}

const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_API_KEY as string;
const OLA_GEOCODE = 'https://api.olamaps.io/places/v1/geocode';

export async function geocodeAddress(address: string): Promise<PlaceResult | null> {
  if (!address?.trim()) return null;
  try {
    const params = new URLSearchParams({
      address: address.trim(),
      api_key: OLA_MAPS_API_KEY,
    });
    const res = await fetch(`${OLA_GEOCODE}?${params}`);
    const data = await res.json();
    const results = data?.geocodingResults;
    if (Array.isArray(results) && results.length > 0) {
      const r = results[0];
      const loc = r.geometry?.location;
      return {
        address: r.formatted_address ?? r.name,
        lat: loc?.lat,
        lng: loc?.lng,
        displayName: r.formatted_address ?? r.name,
        placeId: r.place_id,
        raw: r,
      };
    }
  } catch (err) {
    console.error('Ola Maps geocoding error:', err);
  }
  return null;
}

export async function geocodeAddressManually(address: string): Promise<PlaceResult | null> {
  return geocodeAddress(address);
}
