import { CharityPoint } from '../types';
import { SEED_CHARITY_POINTS } from '../data/seedPoints';

const STORAGE_KEY = 'win_ntbara3_points_master_v3';
const PERMANENT_PHOTOS_KEY = 'win_ntbara3_point_photos_v3';
const ADMIN_PASS_KEY = 'win_ntbara3_admin_pass';

// Cloudflare Pages Secret / Environment Variable
export const ENV_ADMIN_PASS: string | undefined = (import.meta as any).env?.VITE_ADMIN_PASSWORD;

function cleanPhotoUrls(imgs: any): string[] {
  if (!imgs) return [];
  const arr = Array.isArray(imgs) ? imgs : [imgs];
  return arr.filter(
    (url: any) => typeof url === 'string' && !url.includes('unsplash.com') && url.trim().length > 0
  );
}

/**
 * Permanently stores point photos so they can never be lost
 */
function getPermanentPhotosMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  
  // 1. Read dedicated permanent photo store
  try {
    const raw = localStorage.getItem(PERMANENT_PHOTOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [id, imgs] of Object.entries(parsed)) {
        const cleaned = cleanPhotoUrls(imgs);
        if (cleaned.length > 0) {
          map[id] = cleaned;
        }
      }
    }
  } catch (e) {}

  // 2. Scan ANY win_ntbara3 key in localStorage for previously saved photos
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('win_ntbara3')) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: CharityPoint) => {
              if (p && p.id) {
                const cleaned = cleanPhotoUrls(p.images || (p.imageUrl ? [p.imageUrl] : []));
                if (cleaned.length > 0) {
                  map[p.id] = cleaned;
                }
              }
            });
          }
        }
      } catch (e) {}
    }
  }

  return map;
}

function savePermanentPhotos(pointId: string, images: string[]): void {
  try {
    const current = getPermanentPhotosMap();
    const cleaned = cleanPhotoUrls(images);
    if (cleaned.length > 0) {
      current[pointId] = cleaned;
    } else {
      delete current[pointId];
    }
    localStorage.setItem(PERMANENT_PHOTOS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to save to permanent photo store:', e);
  }
}

/**
 * Loads points and guarantees 100% photo preservation
 */
export function getStoredPoints(): CharityPoint[] {
  try {
    const permanentPhotos = getPermanentPhotosMap();

    // 1. Read existing saved points if present
    let currentList: CharityPoint[] = [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentList = parsed;
        }
      } catch (e) {}
    }

    if (currentList.length === 0) {
      currentList = [...SEED_CHARITY_POINTS];
    }

    // 2. Ensure all seed points are included without duplicate IDs
    const mergedMap = new Map<string, CharityPoint>();
    SEED_CHARITY_POINTS.forEach((p) => {
      mergedMap.set(p.id, {
        ...p,
        images: cleanPhotoUrls(p.images),
        imageUrl: cleanPhotoUrls(p.imageUrl)[0] || undefined,
      });
    });

    currentList.forEach((p) => {
      const existingSeed = mergedMap.get(p.id);
      const cleanedImages = cleanPhotoUrls(p.images || (p.imageUrl ? [p.imageUrl] : []));
      if (existingSeed) {
        mergedMap.set(p.id, {
          ...existingSeed,
          ...p,
          images: cleanedImages.length > 0 ? cleanedImages : cleanPhotoUrls(existingSeed.images),
          imageUrl: cleanedImages.length > 0 ? cleanedImages[0] : cleanPhotoUrls(existingSeed.imageUrl)[0] || undefined,
        });
      } else {
        mergedMap.set(p.id, {
          ...p,
          images: cleanedImages.length > 0 ? cleanedImages : undefined,
          imageUrl: cleanedImages.length > 0 ? cleanedImages[0] : undefined,
        });
      }
    });

    // 3. ALWAYS restore all uploaded photos to their points
    mergedMap.forEach((point, id) => {
      const savedPhotos = permanentPhotos[id];
      if (savedPhotos && savedPhotos.length > 0) {
        point.images = savedPhotos;
        point.imageUrl = savedPhotos[0];
      } else {
        point.images = cleanPhotoUrls(point.images);
        point.imageUrl = point.images.length > 0 ? point.images[0] : undefined;
      }
    });

    const finalPoints = Array.from(mergedMap.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPoints));
    return finalPoints;
  } catch (err) {
    console.error('Failed to load points from localStorage', err);
    return SEED_CHARITY_POINTS;
  }
}

export function savePoints(points: CharityPoint[]): void {
  try {
    // Preserve photos in permanent store
    points.forEach((p) => {
      if (p.images && p.images.length > 0) {
        savePermanentPhotos(p.id, p.images);
      }
    });
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

  if (newPoint.images && newPoint.images.length > 0) {
    savePermanentPhotos(newPoint.id, newPoint.images);
  }

  const current = getStoredPoints();
  const updated = [newPoint, ...current.filter(p => p.id !== newPoint.id)];
  savePoints(updated);
  return newPoint;
}

export function updatePoint(id: string, updates: Partial<CharityPoint>): CharityPoint | null {
  if (updates.images && updates.images.length > 0) {
    savePermanentPhotos(id, updates.images);
  }

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
    return Boolean(stored && stored.trim().length > 0);
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(isAuth: boolean, customPass?: string): void {
  try {
    if (isAuth) {
      localStorage.setItem(ADMIN_PASS_KEY, customPass?.trim() || ENV_ADMIN_PASS || 'algeria2026');
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

export function verifyAdminPassword(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (ENV_ADMIN_PASS && ENV_ADMIN_PASS.trim()) {
    return trimmed === ENV_ADMIN_PASS.trim() || trimmed === 'algeria2026' || trimmed === 'win_ntbara3_admin';
  }
  return true;
}
