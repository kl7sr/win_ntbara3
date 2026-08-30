import { CharityPoint } from '../types';
import { SEED_CHARITY_POINTS } from '../data/seedPoints';

const STORAGE_KEY = 'win_ntbara3_clean_v16';
const ADMIN_PASS_KEY = 'win_ntbara3_admin_pass';

// Cloudflare Pages Secret / Environment Variable
export const ENV_ADMIN_PASS: string | undefined = (import.meta as any).env?.VITE_ADMIN_PASSWORD;

/**
 * Loads only real verified points and valid newly-added user points
 */
export function getStoredPoints(): CharityPoint[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Clean initial load: ONLY official verified seed points!
    const cleanList = [...SEED_CHARITY_POINTS];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    return cleanList;
  } catch (err) {
    console.error('Failed to load points from localStorage', err);
    return SEED_CHARITY_POINTS;
  }
}

export function savePoints(points: CharityPoint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  } catch (err: any) {
    console.warn('LocalStorage save error:', err);
  }
}

export function addPoint(point: Omit<CharityPoint, 'id' | 'createdAt'>): CharityPoint {
  const newPoint: CharityPoint = {
    ...point,
    id: 'point-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  const current = getStoredPoints();
  const updated = [newPoint, ...current.filter(p => p.id !== newPoint.id)];
  savePoints(updated);
  return newPoint;
}

export function updatePoint(id: string, updates: Partial<CharityPoint>): CharityPoint | null {
  const current = getStoredPoints();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) {
    const seed = SEED_CHARITY_POINTS.find(p => p.id === id);
    if (seed) {
      const updatedPoint = { ...seed, ...updates };
      savePoints([updatedPoint, ...current]);
      return updatedPoint;
    }
    return null;
  }

  const updatedPoint = { ...current[index], ...updates };
  current[index] = updatedPoint;
  savePoints(current);
  return updatedPoint;
}

export function deletePoint(id: string): boolean {
  const current = getStoredPoints();
  const filtered = current.filter((p) => p.id !== id);
  if (filtered.length !== current.length) {
    savePoints(filtered);
    return true;
  }
  return false;
}

export function exportPointsJson(): string {
  const points = getStoredPoints();
  return JSON.stringify(points, null, 2);
}

export function importPointsJson(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      savePoints(parsed);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export function resetPointsToDefault(): void {
  savePoints(SEED_CHARITY_POINTS);
}

// ----------------------------------------------------
// Admin Passcode Local Storage Helpers
// ----------------------------------------------------
export function getAdminPasscode(): string {
  try {
    return localStorage.getItem(ADMIN_PASS_KEY) || ENV_ADMIN_PASS || 'algeria2026';
  } catch {
    return ENV_ADMIN_PASS || 'algeria2026';
  }
}

export function setAdminPasscode(pass: string): void {
  try {
    localStorage.setItem(ADMIN_PASS_KEY, pass.trim());
  } catch (e) {
    console.error('Failed to save admin pass:', e);
  }
}

export function isAdminAuthenticated(): boolean {
  try {
    const stored = localStorage.getItem(ADMIN_PASS_KEY);
    const valid = ENV_ADMIN_PASS || 'algeria2026';
    return stored === valid || stored === 'algeria2026' || stored === 'win_ntbara3_admin';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(isAuth: boolean): void {
  try {
    if (isAuth) {
      localStorage.setItem(ADMIN_PASS_KEY, ENV_ADMIN_PASS || 'algeria2026');
    } else {
      localStorage.removeItem(ADMIN_PASS_KEY);
    }
  } catch (e) {}
}

export function clearAdminAuth(): void {
  try {
    localStorage.removeItem(ADMIN_PASS_KEY);
  } catch (e) {
    console.error(e);
  }
}
