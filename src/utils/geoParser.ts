/**
 * Geographic boundaries of Algeria
 * South: 18.9° N, North: 37.5° N
 * West: -8.8° W, East: 12.1° E
 */
export const ALGERIA_BOUNDS = {
  minLat: 18.9,
  maxLat: 37.5,
  minLng: -8.8,
  maxLng: 12.1,
};

export function isWithinAlgeriaBounds(lat: number, lng: number): boolean {
  return (
    lat >= ALGERIA_BOUNDS.minLat &&
    lat <= ALGERIA_BOUNDS.maxLat &&
    lng >= ALGERIA_BOUNDS.minLng &&
    lng <= ALGERIA_BOUNDS.maxLng
  );
}

export interface ParsedLocation {
  lat: number;
  lng: number;
  label?: string;
  source: 'google_url' | 'raw_coords' | 'dms' | 'plus_code' | 'unknown';
}

/**
 * Detects if input looks like a Google Plus Code (e.g. "P29M+F3Q" or "P29M+F3Q, Birkhadem")
 */
export function isPlusCode(input: string): boolean {
  const cleaned = input.trim();
  // Plus codes: 4-8 alphanumeric chars + '+' + 2+ chars, optionally followed by a city
  return /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,}/i.test(cleaned);
}

/**
 * Resolves a Plus Code to lat/lng via server-side Google Maps API
 */
export async function resolvePlusCode(plusCode: string): Promise<ParsedLocation | null> {
  try {
    const encoded = encodeURIComponent(`https://www.google.com/maps/search/${encodeURIComponent(plusCode.trim())}`);
    const response = await fetch(`/api/resolve-google-maps?url=${encoded}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.lat && data.lng) {
      return { lat: data.lat, lng: data.lng, source: 'plus_code', label: plusCode };
    }
  } catch (e) {}
  return null;
}

export function parseGoogleMapsLinkOrCoords(input: string): ParsedLocation | null {
  if (!input || !input.trim()) return null;
  const cleanInput = input.trim();

  // 1. Check for standard @lat,lng in google maps url
  const atMatch = cleanInput.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    return { lat, lng, source: 'google_url' };
  }

  // 2. Check for query param q=lat,lng or ll=lat,lng or destination=lat,lng or daddr=lat,lng
  const qMatch = cleanInput.match(/[?&](?:q|ll|destination|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    return { lat, lng, source: 'google_url' };
  }

  // 3. Check for !3dlat!4dlng in Google Maps embed/place URLs
  const bangMatch = cleanInput.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bangMatch) {
    const lat = parseFloat(bangMatch[1]);
    const lng = parseFloat(bangMatch[2]);
    return { lat, lng, source: 'google_url' };
  }

  // 4. Check for decimal raw coordinates format e.g. "36.7538, 3.0588" or "36.7538 3.0588"
  const rawCoordsMatch = cleanInput.match(/^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,2}\.\d+)$/);
  if (rawCoordsMatch) {
    const lat = parseFloat(rawCoordsMatch[1]);
    const lng = parseFloat(rawCoordsMatch[2]);
    return { lat, lng, source: 'raw_coords' };
  }

  // 5. Check for DMS (Degrees, Minutes, Seconds) e.g. 36°45'13.7"N 3°03'32.0"E
  const dmsMatch = cleanInput.match(/(\d+)°(\d+)'([\d.]+)"([NSEW])[,\s]+(\d+)°(\d+)'([\d.]+)"([NSEW])/i);
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]);
    const latMin = parseFloat(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3]);
    const latDir = dmsMatch[4].toUpperCase();

    const lngDeg = parseFloat(dmsMatch[5]);
    const lngMin = parseFloat(dmsMatch[6]);
    const lngSec = parseFloat(dmsMatch[7]);
    const lngDir = dmsMatch[8].toUpperCase();

    let lat = latDeg + latMin / 60 + latSec / 3600;
    if (latDir === 'S') lat = -lat;

    let lng = lngDeg + lngMin / 60 + lngSec / 3600;
    if (lngDir === 'W') lng = -lng;

    return { lat, lng, source: 'dms' };
  }

  // 6. Detect Plus Code — needs async resolution, return null here (use resolvePlusCode separately)
  if (isPlusCode(cleanInput)) return null;

  return null;
}

/**
 * Calculates distance between two points in km (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance to human-readable string
 */
export function formatDistance(distanceKm: number, lang: 'ar' | 'fr' | 'en' = 'ar'): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} متر`;
  }
  return `${distanceKm} كم`;
}

/**
 * Build Google Maps Place Search URL so Google Maps opens the verified place card directly
 */
export function getGoogleMapsDirUrl(lat: number, lng: number, title?: string, address?: string): string {
  if (title) {
    const query = encodeURIComponent(`${title} ${address || ''}`.trim());
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
