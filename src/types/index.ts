export type AidCategory = 
  | 'food_water'      // مواد غذائية ومياه
  | 'clothes'         // ملابس وأحذية
  | 'medical'         // أدوية ومستلزمات صحية
  | 'shelter'         // أفرشة وأغطية
  | 'baby_supplies'   // مستلزمات وحليب رضع
  | 'financial'       // مساعدات وتجهيز
  | 'general';        // تبرعات عامة

export type PointStatus = 'active' | 'urgent' | 'full' | 'closed';

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
  featured: boolean;
  createdAt: string;
  createdBy: 'user' | 'admin';
  googleMapsUrl?: string;
  accuracyMeters?: number;
}

export interface Wilaya {
  code: number;
  nameAr: string;
  nameFr: string;
  lat: number;
  lng: number;
  zoom: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export type Language = 'ar' | 'fr' | 'en';
