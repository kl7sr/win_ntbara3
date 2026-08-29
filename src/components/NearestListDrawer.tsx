import React, { useState } from 'react';
import {
  X,
  Search,
  MapPin,
  Phone,
  Compass,
  LocateFixed,
  ChevronLeft,
  Info,
  Navigation,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { CharityPoint, UserLocation, AidCategory } from '../types';
import { WILAYAS } from '../data/wilayas';
import { calculateDistanceKm, formatDistance, getGoogleMapsDirUrl } from '../utils/geoParser';

interface NearestListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  points: CharityPoint[];
  userLocation: UserLocation | null;
  onSelectPoint: (point: CharityPoint) => void;
  onRequestLocation: () => void;
  selectedWilaya: number | null;
  onSelectWilaya: (code: number | null) => void;
}

export const NearestListDrawer: React.FC<NearestListDrawerProps> = ({
  isOpen,
  onClose,
  points,
  userLocation,
  onSelectPoint,
  onRequestLocation,
  selectedWilaya,
  onSelectWilaya,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AidCategory | 'all'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unconfirmed'>('all');

  if (!isOpen) return null;

  // Calculate distance
  const pointsWithDistance = points.map((p) => {
    const dist = userLocation
      ? calculateDistanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng)
      : null;
    return { ...p, distance: dist };
  });

  // Filter: strictly within 50 km when user location is active
  const filtered = pointsWithDistance.filter((p) => {
    if (selectedWilaya && p.wilayaCode !== selectedWilaya) return false;
    if (categoryFilter !== 'all' && !p.aidCategories.includes(categoryFilter)) return false;

    // Verification filter
    if (verificationFilter === 'verified' && !p.verified) return false;
    if (verificationFilter === 'unconfirmed' && p.verified) return false;

    // Hard limit strictly to 50 km
    if (userLocation && p.distance !== null && p.distance > 50) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchOrg = p.organizer.toLowerCase().includes(q);
      const matchCommune = p.commune.toLowerCase().includes(q);
      const matchWilaya = p.wilayaNameAr.includes(q) || p.wilayaNameFr.toLowerCase().includes(q);
      if (!matchTitle && !matchOrg && !matchCommune && !matchWilaya) return false;
    }
    return true;
  });

  // Sort by closest distance
  filtered.sort((a, b) => {
    if (a.distance !== null && b.distance !== null) {
      return a.distance - b.distance;
    }
    return 0;
  });

  return (
    <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto z-40 w-full sm:max-w-md bg-white border-t sm:border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
      {/* Mobile Swipe Handle */}
      <div className="w-full pt-2.5 pb-1 sm:hidden flex justify-center cursor-pointer bg-slate-50" onClick={onClose}>
        <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
      </div>

      {/* Drawer Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              نقاط التبرع القريبة ({filtered.length})
            </h2>
            <p className="text-xs text-slate-500">
              {userLocation ? 'مرتبة حسب الأقرب لموقعك' : 'حدد موقعك لعرض المراكز القريبة'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-white border border-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* GPS Activate helper if not active */}
      {!userLocation && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-2 text-xs">
          <span className="text-emerald-900 font-medium">لتحديد النقاط القريبة منك:</span>
          <button
            onClick={onRequestLocation}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded-lg transition shrink-0 active:scale-95"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>تحديد موقعي (GPS)</span>
          </button>
        </div>
      )}

      {/* Verification filter tabs & Search */}
      <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setVerificationFilter('all')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition ${verificationFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            الكل
          </button>

          <button
            onClick={() => setVerificationFilter('verified')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition flex items-center justify-center gap-1 ${verificationFilter === 'verified'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>مؤكدة</span>
          </button>

          <button
            onClick={() => setVerificationFilter('unconfirmed')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition flex items-center justify-center gap-1 ${verificationFilter === 'unconfirmed'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>غير مؤكدة</span>
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الجمعية، البلدية..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={selectedWilaya ?? ''}
          onChange={(e) => onSelectWilaya(e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 truncate"
        >
          <option value="">كل الولايات</option>
          {WILAYAS.map((w) => (
            <option key={w.code} value={w.code}>
              {w.code} - {w.nameAr}
            </option>
          ))}
        </select>
      </div>

      {/* Points Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500 text-sm">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">لا توجد نقاط تبرع مطابقة</p>
            <p className="text-xs text-slate-500 mt-1">
              يمكنك اختيار ولايتك من القائمة أعلاه لعرض النقاط المتاحة
            </p>
          </div>
        ) : (
          filtered.map((point) => (
            <div
              key={point.id}
              onClick={() => onSelectPoint(point)}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {point.verified ? (
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-200">
                        موقع مؤكد
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-300">
                        غير مؤكد (اتصل قبل الذهاب)
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500">
                      {point.wilayaNameAr} • {point.commune}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{point.title}</h4>
                  <p className="text-xs text-emerald-700 font-medium">{point.organizer}</p>
                </div>

                {point.distance !== null && (
                  <div className="text-left shrink-0">
                    <span className="inline-block bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200">
                      {formatDistance(point.distance, 'ar')}
                    </span>
                  </div>
                )}
              </div>

              {/* Address and Quick Mobile Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate flex-1">
                  <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                  <span className="truncate">{point.address}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`tel:${point.phone}`}
                    className={`p-2 text-white rounded-xl shadow-xs transition active:scale-95 ${point.verified ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-700 hover:bg-amber-800'
                      }`}
                    title="اتصال مباشر"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={getGoogleMapsDirUrl(point.lat, point.lng, point.title)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition active:scale-95"
                    title="ملاحة خرائط Google"
                  >
                    <Navigation className="w-3.5 h-3.5 text-red-400" />
                  </a>

                  <button
                    onClick={() => onSelectPoint(point)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-200 transition"
                  >
                    <span>عرض</span>
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Technical Support Contact Footer */}
      <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-600 flex items-center justify-between gap-2">
        <span>تواجه مشكلة تقنية في الموقع؟</span>
        <a
          href="tel:0542258712"
          className="font-bold text-emerald-800 hover:text-emerald-950 font-mono flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-xs"
        >
          <Phone className="w-3 h-3 text-emerald-700" />
          <span>0542258712</span>
        </a>
      </div>
    </div>
  );
};
