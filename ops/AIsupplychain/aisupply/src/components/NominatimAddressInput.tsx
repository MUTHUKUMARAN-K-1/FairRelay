import { useState, useEffect, useCallback, useRef } from 'react';

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  displayName?: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 400;

interface NominatimAddressInputProps {
  value: string;
  onPlaceSelected: (place: PlaceResult) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function NominatimAddressInput({
  value,
  onPlaceSelected,
  id,
  placeholder = 'Search address...',
  className = '',
}: NominatimAddressInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        format: 'json',
        limit: '5',
        addressdetails: '0',
      });
      const res = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: { 'User-Agent': 'EcoLogiq-DeliveryApp/1.0' },
      });
      const data = await res.json();
      const results: PlaceResult[] = (data || []).map((r: { display_name: string; lat: string; lon: string }) => ({
        address: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        displayName: r.display_name,
      }));
      setSuggestions(results);
      setOpen(true);
    } catch (err) {
      console.error('Nominatim search error:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), DEBOUNCE_MS);
  };

  const handleSelect = (place: PlaceResult) => {
    setInputValue(place.address);
    setSuggestions([]);
    setOpen(false);
    onPlaceSelected(place);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600/50 transition-all duration-150 ${className}`}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 py-1 bg-gray-900 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lng}-${i}`}
              role="option"
              onClick={() => handleSelect(s)}
              className="px-4 py-2 text-sm text-gray-200 hover:bg-white/10 cursor-pointer truncate"
            >
              {s.address}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
