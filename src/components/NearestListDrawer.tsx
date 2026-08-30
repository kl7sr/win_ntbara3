import React, { useState } from 'react';
import {
  X,
  Search,
  MapPin,
  Phone,
  Compass,
  LocateFixed,
  ChevronLeft,
  Navigation,
  ShieldCheck,
  Flame,
  Globe
} from 'lucide-react';
import { CharityPoint, UserLocation, AidCategory } from '../types';
import { WILAYAS } from '../data/wilayas';
import { calculateDistanceKm, formatDistance, getGoogleMapsDirUrl } from '../utils/geoParser';
import { getPointsForWilayaWithNeighbors } from '../utils/proximity';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface NearestListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  points: CharityPoint[];
  userLocation: UserLocation | null;
  onSelectPoint: (point: CharityPoint) => void;
  onRequestLocation: () => void;
  selectedWilaya: number | null;
  onSelectWilaya: (code: number | null) => void;
  currentLanguage?: Language;
  showFireZones?: boolean;
  onToggleFireZones?: (show: boolean) => void;
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
  currentLanguage = 'ar',
  showFireZones = false,
  onToggleFireZones,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unconfirmed'>('all');

  const t = TRANSLATIONS[currentLanguage];

  if (!isOpen) return null;

  // Calculate distance for all points
  const pointsWithDistance = points.map((p) => {
    const dist = userLocation
      ? calculateDistanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng)
      : null;
    return { ...p, distance: dist };
  });

  // If a wilaya is selected, partition into in-wilaya and neighboring border points
  const partitioned = selectedWilaya 
    ? getPointsForWilayaWithNeighbors(selectedWilaya, points)
    : null;

  // Filter regular list
  const filtered = pointsWithDistance.filter((p) => {
    if (selectedWilaya && p.wilayaCode !== selectedWilaya) return false;

    if (verificationFilter === 'verified' && !p.verified) return false;
    if (verificationFilter === 'unconfirmed' && p.verified) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchCommune = p.commune.toLowerCase().includes(q);
      const matchWilaya = p.wilayaNameAr.toLowerCase().includes(q) || p.wilayaNameFr.toLowerCase().includes(q);
      return matchTitle || matchCommune || matchWilaya;
    }
    return true;
  });

  // Sort by distance if GPS active
  if (userLocation) {
    filtered.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
  }

  const selectedWilayaObj = WILAYAS.find((w) => w.code === selectedWilaya);

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full sm:max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {selectedWilayaObj 
                ? `مراكز التبرع - ولاية ${selectedWilayaObj.nameAr}`
                : t.nearestToMe}
            </h2>
            <p className="text-xs text-slate-500">
              {filtered.length} نقطة متوفرة
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Wilaya Filter, Search Bar & Fire Toggle */}
      <div className="p-3 bg-white border-b border-slate-100 space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو البلدية..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pl-9 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Wilaya selector shortcut, GPS & Fire Checkbox */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="relative flex-1">
            <select
              value={selectedWilaya ?? ''}
              onChange={(e) => onSelectWilaya(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="">جميع الولايات (58 ولاية)</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} - {w.nameAr}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onRequestLocation}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>GPS</span>
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-3 pb-24 space-y-3">
        {/* In-Wilaya Points Section */}
        {filtered.length === 0 ? (
          <div className="text-center py-10 space-y-2 text-slate-500">
            <MapPin className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">لا توجد نقاط مطابقة في هذه الولاية</p>
          </div>
        ) : (
          filtered.map((point) => {
            const isBurnt = point.pointType === 'burnt_zone';
            const isFireActive = isBurnt && (point.status === 'urgent' || point.status === 'active');
            const isFireExtinguished = isBurnt && (point.status === 'extinguished' || point.status === 'full');
            const isVerified = point.verified;

            const borderAccentClass = isBurnt
              ? isFireActive ? 'border-r-4 border-r-red-500' : 'border-r-4 border-r-slate-400'
              : isVerified ? 'border-r-4 border-r-emerald-600' : 'border-r-4 border-r-amber-500';

            const googleMapsUrl = point.googleMapsUrl || getGoogleMapsDirUrl(point.lat, point.lng, point.title);

            return (
              <div
                key={point.id}
                onClick={() => {
                  onSelectPoint(point);
                  onClose();
                }}
                className={`p-3.5 bg-white border border-slate-200/90 ${borderAccentClass} rounded-2xl shadow-xs hover:shadow-md transition cursor-pointer space-y-2.5 group text-right`}
              >
                <div>
                  {/* Inline Status Dot & Distance */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isBurnt
                        ? isFireActive ? 'bg-red-500 ring-2 ring-red-100' : 'bg-slate-400 ring-2 ring-slate-100'
                        : isVerified ? 'bg-emerald-600 ring-2 ring-emerald-100' : 'bg-amber-500 ring-2 ring-amber-100'
                    }`} />
                    <span className={`text-[11px] font-bold ${
                      isBurnt
                        ? isFireActive ? 'text-red-700' : 'text-slate-600'
                        : isVerified ? 'text-emerald-800' : 'text-amber-800'
                    }`}>
                      {isBurnt
                        ? (isFireExtinguished ? 'تم الإخماد' : 'بؤرة حريق نشطة')
                        : (isVerified ? 'موقع مؤكد' : 'غير مؤكد')}
                    </span>
                    {point.distance !== null && (
                      <span className="text-[10px] text-slate-500 font-medium mr-auto bg-slate-100 px-2 py-0.5 rounded-full">
                        يبعد {point.distance} كم
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition">
                    {point.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {point.wilayaNameAr} - {point.commune}
                  </p>
                </div>

                {/* Action Buttons: Primary (Call) vs Secondary (Directions) */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {!isBurnt && point.phone && (
                    <a
                      href={`tel:${point.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 text-center"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>اتصال</span>
                    </a>
                  )}

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 text-center ${
                      !isBurnt && point.phone
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs font-bold'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>الاتجاهات</span>
                  </a>
                </div>
              </div>
            );
          })
        )}

        {/* Smart Neighboring Border Centers Section */}
        {partitioned && partitioned.borderNeighborPoints.length > 0 && (
          <div className="pt-4 border-t-2 border-dashed border-slate-200 space-y-2">
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-right">
              <h4 className="text-xs font-bold text-amber-900">
                مراكز قريبة من حدود ولاية {partitioned.selectedWilaya.nameAr}
              </h4>
              <p className="text-[10.5px] text-amber-700 mt-0.5">
                قد تكون هذه المراكز أقرب إليك جغرافياً في الولايات المجاورة:
              </p>
            </div>

            {partitioned.borderNeighborPoints.map(({ point, distanceToWilayaCenterKm }) => {
              const isBurnt = point.pointType === 'burnt_zone';
              const isFireActive = isBurnt && (point.status === 'urgent' || point.status === 'active');
              const isFireExtinguished = isBurnt && (point.status === 'extinguished' || point.status === 'full');
              const isVerified = point.verified;

              const borderAccentClass = isBurnt
                ? isFireActive ? 'border-r-4 border-r-red-500' : 'border-r-4 border-r-slate-400'
                : isVerified ? 'border-r-4 border-r-emerald-600' : 'border-r-4 border-r-amber-500';

              const googleMapsUrl = point.googleMapsUrl || getGoogleMapsDirUrl(point.lat, point.lng, point.title);

              return (
                <div
                  key={point.id}
                  onClick={() => {
                    onSelectPoint(point);
                    onClose();
                  }}
                  className={`p-3 bg-white border border-slate-200/90 ${borderAccentClass} rounded-2xl shadow-xs hover:shadow-md transition cursor-pointer text-right space-y-2`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          isBurnt
                            ? isFireActive ? 'bg-red-500 ring-2 ring-red-100' : 'bg-slate-400 ring-2 ring-slate-100'
                            : isVerified ? 'bg-emerald-600 ring-2 ring-emerald-100' : 'bg-amber-500 ring-2 ring-amber-100'
                        }`} />
                        <span className="text-[10px] font-bold text-slate-700">
                          ولاية {point.wilayaNameAr}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        ~ {distanceToWilayaCenterKm} كم من مركز الولاية
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900">{point.title}</h5>
                    <p className="text-[10.5px] text-slate-500">{point.commune} ({point.address})</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    {!isBurnt && point.phone && (
                      <a
                        href={`tel:${point.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-xl text-center shadow-xs transition"
                      >
                        اتصال
                      </a>
                    )}
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`flex-1 py-1.5 rounded-xl text-[11px] font-semibold text-center transition ${
                        !isBurnt && point.phone
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs'
                      }`}
                    >
                      الاتجاهات
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
