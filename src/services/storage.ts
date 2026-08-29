import { CharityPoint } from '../types';
import { SEED_CHARITY_POINTS } from '../data/seedPoints';

const STORAGE_KEY = 'win_ntbara3_points_v1';
const ADMIN_PASS_KEY = 'win_ntbara3_admin_pass';
const DEFAULT_ADMIN_PASS = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin123';

export function getStoredPoints(): CharityPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CHARITY_POINTS));
      return SEED_CHARITY_POINTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_CHARITY_POINTS;
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
  savePoints(SEED_CHARITY_POINTS);
  return SEED_CHARITY_POINTS;
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
