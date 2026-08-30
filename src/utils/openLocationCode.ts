/**
 * Open Location Code (Plus Codes) Decoder & Resolver
 * Pure TypeScript implementation of Google's Open Location Code specification.
 * Zero external dependencies, instant client-side resolution.
 */

import { WILAYAS } from '../data/wilayas';

const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
const ENCODING_BASE = 20;
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;

/**
 * Checks if a string contains a Plus Code pattern (e.g. "P29M+F3Q" or "P29M+F3Q, Birkhadem" or "8F3CP29M+F3Q")
 */
export function extractPlusCode(input: string): { code: string; locality: string } | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Match Plus Code pattern: 4-8 chars + '+' + 2-3 chars, optionally followed by locality text
  const match = trimmed.match(/([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3})/i);
  if (!match) return null;

  const code = match[1].toUpperCase();
  const locality = trimmed.replace(match[0], '').replace(/^[, -]+/, '').replace(/[, -]+$/, '').trim();

  return { code, locality };
}

/**
 * Decodes a full 10/11-character Open Location Code to lat/lng coordinates
 */
export function decodeFullOpenLocationCode(code: string): { lat: number; lng: number } | null {
  const clean = code.toUpperCase().replace('+', '');
  if (clean.length < 8) return null;

  let latLo = -90.0;
  let lngLo = -180.0;
  let latResolution = 20.0;
  let lngResolution = 20.0;

  for (let i = 0; i < Math.min(clean.length, 10); i += 2) {
    const latDigit = CODE_ALPHABET.indexOf(clean[i]);
    const lngDigit = CODE_ALPHABET.indexOf(clean[i + 1]);
    if (latDigit === -1 || lngDigit === -1) return null;

    latLo += latDigit * latResolution;
    lngLo += lngDigit * lngResolution;

    latResolution /= ENCODING_BASE;
    lngResolution /= ENCODING_BASE;
  }

  let lat = latLo + (latResolution * ENCODING_BASE) / 2;
  let lng = lngLo + (lngResolution * ENCODING_BASE) / 2;

  // Grid refinement for 11th character if present
  if (clean.length >= 11) {
    const gridDigit = CODE_ALPHABET.indexOf(clean[10]);
    if (gridDigit !== -1) {
      const row = Math.floor(gridDigit / 4);
      const col = gridDigit % 4;
      const rowSize = latResolution / 5;
      const colSize = lngResolution / 4;
      lat = latLo + row * rowSize + rowSize / 2;
      lng = lngLo + col * colSize + colSize / 2;
    }
  }

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

/**
 * Finds reference coordinates from a locality string (e.g. "Birkhadem", "Alger", "Oran")
 */
export function findReferenceLocation(locality: string, fallbackLat: number = 36.7538, fallbackLng: number = 3.0588): { lat: number; lng: number } {
  if (!locality) return { lat: fallbackLat, lng: fallbackLng };

  const norm = locality.toLowerCase().trim();

  // 1. Check matching Wilaya
  for (const w of WILAYAS) {
    if (
      norm.includes(w.nameFr.toLowerCase()) || 
      norm.includes(w.nameAr) ||
      w.nameFr.toLowerCase().includes(norm)
    ) {
      return { lat: w.lat, lng: w.lng };
    }
  }

  // 2. Known common communes in Algiers and other major cities
  const COMMON_COMMUNES: Record<string, { lat: number; lng: number }> = {
    'birkhadem': { lat: 36.7162, lng: 3.0533 },
    'birkhedem': { lat: 36.7162, lng: 3.0533 },
    'بئر خادم': { lat: 36.7162, lng: 3.0533 },
    'tixeraine': { lat: 36.7140, lng: 3.0480 },
    'تقصراين': { lat: 36.7140, lng: 3.0480 },
    'kouba': { lat: 36.7262, lng: 3.0867 },
    'القبة': { lat: 36.7262, lng: 3.0867 },
    'hydra': { lat: 36.7431, lng: 3.0417 },
    'حيدرة': { lat: 36.7431, lng: 3.0417 },
    'bab ezzouar': { lat: 36.7167, lng: 3.1833 },
    'باب الزوار': { lat: 36.7167, lng: 3.1833 },
    'cheraga': { lat: 36.7667, lng: 2.9500 },
    'الشراقة': { lat: 36.7667, lng: 2.9500 },
    'draria': { lat: 36.7167, lng: 2.9833 },
    'درارية': { lat: 36.7167, lng: 2.9833 },
    'oued romane': { lat: 36.7275, lng: 3.0078 },
    'alger': { lat: 36.7538, lng: 3.0588 },
    'الجزائر': { lat: 36.7538, lng: 3.0588 },
  };

  for (const [key, coords] of Object.entries(COMMON_COMMUNES)) {
    if (norm.includes(key) || key.includes(norm)) {
      return coords;
    }
  }

  return { lat: fallbackLat, lng: fallbackLng };
}

/**
 * Decodes short or full Open Location Code using reference coordinates
 */
export function decodePlusCode(input: string, defaultLat: number = 36.7538, defaultLng: number = 3.0588): { lat: number; lng: number } | null {
  const extracted = extractPlusCode(input);
  if (!extracted) return null;

  const { code, locality } = extracted;
  const plusIdx = code.indexOf('+');

  // Full code (8 or more chars before +)
  if (plusIdx >= 8) {
    return decodeFullOpenLocationCode(code);
  }

  // Short code (e.g. "P29M+F3Q") - needs reference location
  const ref = findReferenceLocation(locality, defaultLat, defaultLng);

  // Prefix calculation:
  // Convert reference coords to base-20 digits for the missing 4 prefix characters
  const refLatNorm = ref.lat + LATITUDE_MAX;
  const refLngNorm = ref.lng + LONGITUDE_MAX;

  const latVal1 = Math.floor(refLatNorm / 20);
  const lngVal1 = Math.floor(refLngNorm / 20);
  const remLat = refLatNorm % 20;
  const remLng = refLngNorm % 20;

  const latVal2 = Math.floor(remLat / 1);
  const lngVal2 = Math.floor(remLng / 1);

  const char1 = CODE_ALPHABET[latVal1];
  const char2 = CODE_ALPHABET[lngVal1];
  const char3 = CODE_ALPHABET[latVal2];
  const char4 = CODE_ALPHABET[lngVal2];

  const fullCandidate = `${char1}${char2}${char3}${char4}${code}`;
  const decoded = decodeFullOpenLocationCode(fullCandidate);
  if (!decoded) return null;

  let finalLat = decoded.lat;
  let finalLng = decoded.lng;

  // Resolve nearest 1-degree box if near boundary
  const res = 1.0;
  const halfRes = res / 2.0;

  if (ref.lat + halfRes < finalLat && finalLat - res >= -90) {
    finalLat -= res;
  } else if (ref.lat - halfRes > finalLat && finalLat + res <= 90) {
    finalLat += res;
  }

  if (ref.lng + halfRes < finalLng && finalLng - res >= -180) {
    finalLng -= res;
  } else if (ref.lng - halfRes > finalLng && finalLng + res <= 180) {
    finalLng += res;
  }

  return {
    lat: Number(finalLat.toFixed(6)),
    lng: Number(finalLng.toFixed(6)),
  };
}
