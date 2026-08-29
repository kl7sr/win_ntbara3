import { CharityPoint, PointType, PointStatus } from '../types';
import { WILAYAS } from '../data/wilayas';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz1VnmYpQUD_iJ-cLKF9ZQfgulWL6BWF8ynoiIltvrChpuOOwc1DW_v9SCF-m86GG20zQ/exec';

/**
 * Fetch all points live from Google Sheets
 */
export async function fetchPointsFromGoogleSheet(): Promise<CharityPoint[]> {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Sheets fetch failed with status ${response.status}`);
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) return [];

    const mappedPoints: CharityPoint[] = rows.map((row: any, index: number) => {
      const wilayaCode = Number(row.wilayaCode) || 16;
      const wilaya = WILAYAS.find(w => w.code === wilayaCode) || WILAYAS[15];
      
      const pointType: PointType = row.pointType === 'burnt_zone' ? 'burnt_zone' : 'charity_hub';
      const status: PointStatus = row.status === 'extinguished' 
        ? 'extinguished' 
        : row.status === 'urgent' 
        ? 'urgent' 
        : 'active';

      return {
        id: `gsheet-${index}-${Date.now()}-${row.phone || ''}`,
        title: row.title || 'نقطة تبرع',
        organizer: row.organizer || 'متطوعين',
        phone: String(row.phone || ''),
        wilayaCode: wilaya.code,
        wilayaNameAr: wilaya.nameAr,
        wilayaNameFr: wilaya.nameFr,
        commune: row.commune || wilaya.nameAr,
        address: row.address || `${row.commune || wilaya.nameAr}، ولاية ${wilaya.nameAr}`,
        lat: Number(row.lat) || wilaya.lat,
        lng: Number(row.lng) || wilaya.lng,
        aidCategories: ['food_water', 'clothes', 'medical', 'blankets'],
        status: status,
        pointType: pointType,
        urgentDescription: row.needs || row.urgentDescription || undefined,
        verified: true,
        createdBy: 'user',
        createdAt: new Date().toISOString(),
      };
    }).filter((p: CharityPoint) => p.title && p.lat && p.lng);

    return mappedPoints;
  } catch (err) {
    console.warn('Could not fetch from Google Sheet (will fallback to local cache):', err);
    return [];
  }
}

/**
 * Save new point permanently to Google Sheets in real-time
 */
export async function syncPointToGoogleSheet(point: Omit<CharityPoint, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    const payload = {
      title: point.title,
      organizer: point.organizer,
      phone: point.phone,
      wilayaCode: point.wilayaCode,
      commune: point.commune,
      address: point.address,
      lat: point.lat,
      lng: point.lng,
      urgentDescription: point.urgentDescription || '',
      pointType: point.pointType || 'charity_hub',
      status: point.status || 'active',
    };

    // Use mode 'no-cors' if standard post has CORS header issues from Google Script
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Successfully dispatched point to Google Sheet sync');
    return true;
  } catch (err) {
    console.error('Failed to sync point to Google Sheet:', err);
    return false;
  }
}
