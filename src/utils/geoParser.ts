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
  source: 'google_url' | 'raw_coords' | 'dms' | 'unknown';
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

  // 5. Check for DMS
  const dmsMatch = cleanInput.match(/(\d+)°(\d+)'([\d.]+)"?([NS])[,\s]+(\d+)°(\d+)'([\d.]+)"?([EW])/i);
  if (dmsMatch) {
    let lat = parseInt(dmsMatch[1]) + parseInt(dmsMatch[2]) / 60 + parseFloat(dmsMatch[3]) / 3600;
    if (dmsMatch[4].toUpperCase() === 'S') lat = -lat;

    let lng = parseInt(dmsMatch[5]) + parseInt(dmsMatch[6]) / 60 + parseFloat(dmsMatch[7]) / 3600;
    if (dmsMatch[8].toUpperCase() === 'W') lng = -lng;

    return { lat, lng, source: 'dms' };
  }

  // 6. Generic search for consecutive numbers
  const anyPairMatch = cleanInput.match(/([1-3]\d\.\d{3,})[^\d.-]+([0-1]?\d\.\d{3,})/);
  if (anyPairMatch) {
    const lat = parseFloat(anyPairMatch[1]);
    const lng = parseFloat(anyPairMatch[2]);
    return { lat, lng, source: 'raw_coords' };
  }

  return null;
}

/**
 * Calculates distance between two points in Kilometers using Haversine formula
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
 * Build Google Maps Navigation URL
 */
export function getGoogleMapsDirUrl(lat: number, lng: number, label?: string): string {
  if (label) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(label)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
