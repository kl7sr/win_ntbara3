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
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Cache in local storage for instant offline loading
        savePoints(data);
        return data;
      }
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
export async function createLivePointInD1(point: Omit<CharityPoint, 'id' | 'createdAt'>): Promise<boolean> {
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
 * Updates a point in Cloudflare D1 Database (all fields + verification / status)
 */
export async function updateLivePointInD1(id: string, updates: Partial<CharityPoint>): Promise<boolean> {
  try {
    const adminPass = getAdminPasscode();
    const response = await fetch('/api/points', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPass,
      },
      body: JSON.stringify({ id, updates }),
    });

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
