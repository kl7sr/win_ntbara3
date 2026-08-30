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

  return (
    <div className="fixed bottom-20 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom duration-200">
      <div className="bg-white/98 backdrop-blur-md border border-slate-200 rounded-3xl p-4 shadow-2xl space-y-3 text-right">
        {/* Top Header: Title & Badges & Close Button */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isBurntZone
                  ? isExtinguished
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {isBurntZone 
                  ? (isExtinguished ? t.details.extinguishedFire : t.details.activeFire)
                  : (point.verified ? t.details.verified : t.details.unverified)}
              </span>

              {distanceKm !== null && (
                <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                  {distanceKm} كم
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-1">
              {point.title}
            </h3>

            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{point.wilayaNameAr} - {point.commune}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition shrink-0"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Instant Action Buttons (Tier 1 Fast Access) */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          {/* 1. Direct Phone Call */}
          <a
            href={`tel:${point.phone}`}
            className="py-2.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-xs active:scale-95 text-center"
          >
            <Phone className="w-4 h-4" />
            <span className="truncate">{t.callNumber}</span>
          </a>

          {/* 2. Google Maps Directions */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition border border-slate-200 active:scale-95 text-center"
          >
            <Navigation className="w-4 h-4 text-slate-700" />
            <span className="truncate">الاتجاهات</span>
          </a>

          {/* 3. Open Full Tier-2 Details Modal */}
          <button
            type="button"
            onClick={() => onOpenFullDetails(point)}
            className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-xs active:scale-95 text-center"
          >
            <Info className="w-4 h-4 text-emerald-400" />
            <span className="truncate">التفاصيل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
