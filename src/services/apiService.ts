import { CharityPoint } from '../types';
import { getStoredPoints, savePoints, getAdminPasscode } from './storage';

/**
 * Loads all points live from Cloudflare D1 Database
 */
export async function fetchLivePointsFromD1(): Promise<CharityPoint[]> {
  try {
    const response = await fetch('/api/points', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Cache in local storage for instant offline loading
        savePoints(data);
        return data;
      }
    } else {
      console.warn(`[API] D1 GET returned status ${response.status}`);
    }
  } catch (err) {
    console.warn('Could not fetch from D1 API (using local cache):', err);
  }

  // Fallback to local storage or seed data
  return getStoredPoints();
}

/**
 * Saves a new point to Cloudflare D1 Database in real time
 */
export async function createLivePointInD1(point: Omit<CharityPoint, 'id' | 'createdAt'> | CharityPoint): Promise<boolean> {
  try {
    const adminPass = getAdminPasscode();
    const response = await fetch('/api/points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPass,
      },
      body: JSON.stringify(point),
    });

    return response.ok;
  } catch (err) {
    console.error('Failed to save to D1 database:', err);
    return false;
  }
}

/**
 * Updates a point in Cloudflare D1 Database (with full object fallback for instant upsert)
 */
export async function updateLivePointInD1(
  id: string, 
  updates: Partial<CharityPoint>, 
  fullPoint?: CharityPoint
): Promise<boolean> {
  try {
    const adminPass = getAdminPasscode();
    const response = await fetch('/api/points', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPass,
      },
      body: JSON.stringify({ id, updates, fullPoint }),
    });

    if (!response.ok) {
      console.warn(`[API] D1 PUT returned status ${response.status}`);
    }

    return response.ok;
  } catch (err) {
    console.error('Failed to update in D1 database:', err);
    return false;
  }
}

/**
 * Deletes a point from Cloudflare D1 Database
 */
export async function deleteLivePointFromD1(id: string): Promise<boolean> {
  try {
    const adminPass = getAdminPasscode();
    const response = await fetch(`/api/points?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Password': adminPass,
      },
    });

    return response.ok;
  } catch (err) {
    console.error('Failed to delete from D1 database:', err);
    return false;
  }
}

/**
 * Bulk exports all local points directly into Cloudflare D1 database
 */
export async function bulkExportAllLocalPointsToD1(
  points: CharityPoint[],
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  const adminPass = getAdminPasscode();

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    try {
      // 1. Try to create / upsert point via POST
      const postRes = await fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPass,
        },
        body: JSON.stringify(p),
      });

      if (postRes.ok) {
        success++;
      } else {
        // 2. If it already exists, update it via PUT
        const putRes = await fetch('/api/points', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPass,
          },
          body: JSON.stringify({ id: p.id, updates: p, fullPoint: p }),
        });
        if (putRes.ok) {
          success++;
        } else {
          failed++;
        }
      }
    } catch {
      failed++;
    }

    onProgress?.(i + 1, points.length);
  }

  return { success, failed };
}
