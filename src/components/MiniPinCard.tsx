import React from 'react';
import { 
  Phone, 
  Navigation, 
  Info, 
  X, 
  MapPin, 
  ShieldCheck, 
  Flame, 
  Wind, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { CharityPoint, UserLocation } from '../types';
import { calculateDistanceKm } from '../utils/proximity';
import { getGoogleMapsDirUrl } from '../utils/geoParser';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface MiniPinCardProps {
  point: CharityPoint | null;
  userLocation: UserLocation | null;
  onClose: () => void;
  onOpenFullDetails: (point: CharityPoint) => void;
  currentLanguage: Language;
}

export const MiniPinCard: React.FC<MiniPinCardProps> = ({
  point,
  userLocation,
  onClose,
  onOpenFullDetails,
  currentLanguage,
}) => {
  if (!point) return null;

  const t = TRANSLATIONS[currentLanguage];

  const distanceKm = userLocation
    ? calculateDistanceKm(userLocation.lat, userLocation.lng, point.lat, point.lng)
    : null;

  const googleMapsUrl = point.googleMapsUrl || getGoogleMapsDirUrl(point.lat, point.lng);

  const isBurntZone = point.pointType === 'burnt_zone';
  const isExtinguished = point.status === 'extinguished';

  const isFireActive = isBurntZone && (point.status === 'urgent' || point.status === 'active');
  const isFireExtinguished = isBurntZone && (point.status === 'extinguished' || point.status === 'full');
  const isVerified = point.verified;

  const borderAccentClass = isBurntZone
    ? isFireActive ? 'border-r-4 border-r-red-500' : 'border-r-4 border-r-slate-400'
    : isVerified ? 'border-r-4 border-r-emerald-600' : 'border-r-4 border-r-amber-500';

  return (
    <div className="fixed bottom-20 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom duration-200">
      <div className={`bg-white/98 backdrop-blur-md border border-slate-200/90 ${borderAccentClass} rounded-3xl p-4 shadow-2xl space-y-3 text-right`}>
        {/* Top Header: Title & Badges & Close Button */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="space-y-1 flex-1 min-w-0">
            {/* Inline Status Dot */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                isBurntZone
                  ? isFireActive ? 'bg-red-500 ring-2 ring-red-100' : 'bg-slate-400 ring-2 ring-slate-100'
                  : isVerified ? 'bg-emerald-600 ring-2 ring-emerald-100' : 'bg-amber-500 ring-2 ring-amber-100'
              }`} />
              <span className={`text-[11px] font-bold ${
                isBurntZone
                  ? isFireActive ? 'text-red-700' : 'text-slate-600'
                  : isVerified ? 'text-emerald-800' : 'text-amber-800'
              }`}>
                {isBurntZone 
                  ? (isExtinguished ? t.details.extinguishedFire : t.details.activeFire)
                  : (point.verified ? t.details.verified : t.details.unverified)}
              </span>

              {distanceKm !== null && (
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200 mr-auto">
                  {distanceKm} كم
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-slate-900 truncate mt-0.5">
              {point.title}
            </h3>

            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{point.wilayaNameAr} - {point.commune}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition shrink-0 active:scale-95"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Instant Action Buttons: Primary (Call) vs Secondary (Directions) vs Tier-2 Details */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          {/* 1. Direct Phone Call */}
          <a
            href={`tel:${point.phone}`}
            className="py-2.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-xs active:scale-95 text-center"
          >
            <Phone className="w-4 h-4" />
            <span className="truncate">{t.callNumber}</span>
          </a>

          {/* 2. Google Maps Directions */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-2xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition active:scale-95 text-center"
          >
            <Navigation className="w-4 h-4 text-slate-700" />
            <span className="truncate">الاتجاهات</span>
          </a>

          {/* 3. Open Full Tier-2 Details Modal */}
          <button
            type="button"
            onClick={() => onOpenFullDetails(point)}
            className="py-2.5 px-2 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-xs active:scale-95 text-center"
          >
            <Info className="w-4 h-4 text-emerald-400" />
            <span className="truncate">التفاصيل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
