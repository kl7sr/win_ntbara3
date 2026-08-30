export type AidCategory = 
  | 'food_water' 
  | 'clothes' 
  | 'medical' 
  | 'blankets' 
  | 'baby_supplies' 
  | 'hygiene' 
  | 'general'
  | 'financial'
  | 'shelter';

export type PointStatus = 'active' | 'full' | 'urgent' | 'extinguished';
export type PointType = 'charity_hub' | 'burnt_zone' | 'shelter';

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
  pointType?: PointType; // 'charity_hub' | 'burnt_zone' | 'shelter'
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

export type Wilaya = WilayaInfo;

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}
