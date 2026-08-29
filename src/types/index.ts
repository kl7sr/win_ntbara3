export type AidCategory = 
  | 'food_water' 
  | 'clothes' 
  | 'medical' 
  | 'blankets' 
  | 'baby_supplies' 
  | 'hygiene' 
  | 'general';

export type PointStatus = 'active' | 'full' | 'urgent';

export interface CharityPoint {
  id: string;
  title: string;
  organizer: string;
  phone: string;
  altPhone?: string;
  wilayaCode: number;
  wilayaNameAr: string;
  wilayaNameFr: string;
  commune: string;
  address: string;
  lat: number;
  lng: number;
  aidCategories: AidCategory[];
  status: PointStatus;
  urgentDescription?: string;
  notes?: string;
  hours?: string;
  verified: boolean;
  featured?: boolean;
  createdBy: 'admin' | 'user';
  createdAt: string;
  googleMapsUrl?: string;
  accuracyMeters?: number;
  imageUrl?: string;
  images?: string[];
}

export interface WilayaInfo {
  code: number;
  nameAr: string;
  nameFr: string;
  lat: number;
  lng: number;
  zoom?: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}
