import { CharityPoint } from '../types';
import { SEED_CHARITY_POINTS } from '../data/seedPoints';

const STORAGE_KEY = 'win_ntbara3_points_master';
const LEGACY_STORAGE_KEYS = ['win_ntbara3_points_v1', 'win_ntbara3_points_v2'];
const ADMIN_PASS_KEY = 'win_ntbara3_admin_pass';
const DEFAULT_ADMIN_PASS = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin123';

/**
 * Loads all points while permanently preserving any user-added or custom points
 */
export function getStoredPoints(): CharityPoint[] {
  try {
    let customPoints: CharityPoint[] = [];
    let savedMaster = localStorage.getItem(STORAGE_KEY);

    // Check legacy storage keys if master is empty
    if (!savedMaster) {
      for (const legKey of LEGACY_STORAGE_KEYS) {
        const legData = localStorage.getItem(legKey);
        if (legData) {
          try {
            const parsed = JSON.parse(legData);
            if (Array.isArray(parsed)) {
              // Extract user-created points from legacy storage
              const userPoints = parsed.filter((p: CharityPoint) => p.id && (p.createdBy === 'user' || p.id.startsWith('point-')));
              customPoints = [...customPoints, ...userPoints];
            }
          } catch (e) {
            console.error('Error recovering legacy points', e);
          }
        }
      }
    } else {
      try {
        const parsed = JSON.parse(savedMaster);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing master points', e);
      }
    }

    // Merge recovered custom points with initial seed points
    const finalPoints = [...customPoints, ...SEED_CHARITY_POINTS];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPoints));
    return finalPoints;
  } catch (err) {
    console.error('Failed to load points from localStorage', err);
    return SEED_CHARITY_POINTS;
  }
}

export function savePoints(points: CharityPoint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  } catch (err) {
    console.error('Failed to save points to localStorage', err);
  }
}

export function addPoint(point: Omit<CharityPoint, 'id' | 'createdAt'>): CharityPoint {
  const newPoint: CharityPoint = {
    ...point,
    id: 'point-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };
  const points = getStoredPoints();
  const updated = [newPoint, ...points];
  savePoints(updated);
  return newPoint;
}

export function updatePoint(id: string, updates: Partial<CharityPoint>): CharityPoint | null {
  const points = getStoredPoints();
  const index = points.findIndex(p => p.id === id);
  if (index === -1) return null;

  points[index] = { ...points[index], ...updates };
  savePoints(points);
  return points[index];
}

export function deletePoint(id: string): boolean {
  const points = getStoredPoints();
  const filtered = points.filter(p => p.id !== id);
  if (filtered.length !== points.length) {
    savePoints(filtered);
    return true;
  }
  return false;
}

export function resetPointsToDefault(): CharityPoint[] {
  // Preserve custom points even on reset
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
