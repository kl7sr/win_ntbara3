import { CharityPoint } from '../types';
import { SEED_CHARITY_POINTS } from '../data/seedPoints';

const STORAGE_KEY = 'win_ntbara3_master_v3';
const LEGACY_STORAGE_KEYS = ['win_ntbara3_points_master', 'win_ntbara3_points_v2', 'win_ntbara3_points_v1'];
const ADMIN_PASS_KEY = 'win_ntbara3_admin_pass';
const DEFAULT_ADMIN_PASS = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin123';

// In-memory runtime cache for guaranteed instant availability
let memoryPointsCache: CharityPoint[] | null = null;

export function getStoredPoints(): CharityPoint[] {
  if (memoryPointsCache && memoryPointsCache.length > 0) {
    return memoryPointsCache;
  }

  try {
    let customPoints: CharityPoint[] = [];
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryPointsCache = parsed;
        return parsed;
      }
    }

    // Try recovering from any legacy storage
    for (const legKey of LEGACY_STORAGE_KEYS) {
      const legData = localStorage.getItem(legKey);
      if (legData) {
        try {
          const parsed = JSON.parse(legData);
          if (Array.isArray(parsed)) {
            const userPoints = parsed.filter((p: CharityPoint) => p.id && (p.createdBy === 'user' || p.id.startsWith('point-')));
            customPoints = [...customPoints, ...userPoints];
          }
        } catch (e) {
          console.warn('Error reading legacy storage:', e);
        }
      }
    }

    const merged = [...customPoints, ...SEED_CHARITY_POINTS];
    memoryPointsCache = merged;
    savePoints(merged);
    return merged;
  } catch (err) {
    console.error('Failed to load points from localStorage', err);
    memoryPointsCache = SEED_CHARITY_POINTS;
    return SEED_CHARITY_POINTS;
  }
}

export function savePoints(points: CharityPoint[]): void {
  memoryPointsCache = points;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  } catch (err: any) {
    console.warn('LocalStorage save failed, stripping heavy images to fit quota:', err);
    try {
      // Fallback: strip heavy images if quota exceeded so data is NEVER lost
      const trimmed = points.map(p => ({
        ...p,
        images: p.images ? p.images.slice(0, 1) : undefined,
        imageUrl: p.imageUrl
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Critical quota error:', e);
    }
  }
}

export function addPoint(point: Omit<CharityPoint, 'id' | 'createdAt'>): CharityPoint {
  const newPoint: CharityPoint = {
    ...point,
    id: 'point-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };
  const current = getStoredPoints();
  const updated = [newPoint, ...current];
  savePoints(updated);
  return newPoint;
}

export function updatePoint(id: string, updates: Partial<CharityPoint>): CharityPoint | null {
  const current = getStoredPoints();
  const index = current.findIndex(p => p.id === id);
  if (index === -1) return null;

  current[index] = { ...current[index], ...updates };
  savePoints(current);
  return current[index];
}

export function deletePoint(id: string): boolean {
  const current = getStoredPoints();
  const filtered = current.filter(p => p.id !== id);
  if (filtered.length !== current.length) {
    savePoints(filtered);
    return true;
  }
  return false;
}

export function resetPointsToDefault(): CharityPoint[] {
  const current = getStoredPoints();
  const customOnly = current.filter(p => p.createdBy === 'user' || p.id.startsWith('point-'));
  const restored = [...customOnly, ...SEED_CHARITY_POINTS];
  savePoints(restored);
  return restored;
}

export function exportPointsJson(): string {
  const points = getStoredPoints();
  return JSON.stringify(points, null, 2);
}

export function importPointsJson(jsonStr: string): CharityPoint[] | null {
  try {
    const data = JSON.parse(jsonStr);
    if (Array.isArray(data)) {
      savePoints(data);
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAdminPasscode(): string {
  return localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_ADMIN_PASS;
}

export function setAdminPasscode(newPass: string): void {
  localStorage.setItem(ADMIN_PASS_KEY, newPass);
}
