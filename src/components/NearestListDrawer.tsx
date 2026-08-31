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
  Globe,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CharityPoint, UserLocation, AidCategory } from '../types';
import { WILAYAS, AID_CATEGORIES_META } from '../data/wilayas';
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
  const [showNeighboringDropdown, setShowNeighboringDropdown] = useState(false);
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);

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
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-700 text-white rounded-xl shadow-2xs">
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
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
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
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pl-9 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
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
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 shadow-2xs active:scale-95"
          >
            <LocateFixed className="w-3.5 h-3.5 text-slate-700" />
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
            <p className="text-xs">
              {currentLanguage === 'ar'
                ? 'لا توجد نقاط مطابقة في هذه الولاية'
                : currentLanguage === 'fr'
                ? 'Aucun point correspondant dans cette wilaya'
                : 'No matching points found in this wilaya'}
            </p>
          </div>
        ) : (
          filtered.map((point, index) => {
            const isBurnt = point.pointType === 'burnt_zone';
            const isShelter = point.pointType === 'shelter';
            const isFireActive = isBurnt && (point.status === 'urgent' || point.status === 'active');
            const isFireExtinguished = isBurnt && (point.status === 'extinguished' || point.status === 'full');
            const isVerified = point.verified;
            const isExpanded = expandedPointId === point.id;

            const statusLabel = isBurnt
              ? (isFireExtinguished 
                  ? (currentLanguage === 'ar' ? 'تم الإخماد' : currentLanguage === 'fr' ? 'Feu éteint' : 'Extinguished')
                  : (currentLanguage === 'ar' ? 'بؤرة حريق نشطة' : currentLanguage === 'fr' ? 'Incendie actif' : 'Active Fire'))
              : isShelter
              ? (isVerified 
                  ? (currentLanguage === 'ar' ? 'مركز إيواء مؤكد' : currentLanguage === 'fr' ? 'Hébergement vérifié' : 'Verified Shelter')
                  : (currentLanguage === 'ar' ? 'مركز إيواء غير مؤكد' : currentLanguage === 'fr' ? 'Hébergement non vérifié' : 'Unconfirmed Shelter'))
              : (isVerified 
                  ? (currentLanguage === 'ar' ? 'موقع مؤكد' : currentLanguage === 'fr' ? 'Point vérifié' : 'Verified Hub')
                  : (currentLanguage === 'ar' ? 'غير مؤكد' : currentLanguage === 'fr' ? 'Non vérifié' : 'Unconfirmed'));

            return (
              <div
                key={point.id}
                onClick={() => {
                  setExpandedPointId((prev) => (prev === point.id ? null : point.id));
                }}
                className={`p-3.5 bg-white border rounded-2xl shadow-xs hover:shadow-md transition space-y-2 text-right group cursor-pointer active:scale-[0.995] ${
                  isExpanded ? 'border-emerald-700/60 ring-1 ring-emerald-700/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Top Row: Status Dot + Status Label + Distance Badge + Chevron Indicator */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isBurnt
                        ? isFireActive ? 'bg-red-600' : 'bg-slate-400'
                        : isVerified ? 'bg-emerald-600' : 'bg-amber-500'
                    }`} />
                    <span className={`text-[11px] font-bold truncate ${
                      isBurnt
                        ? isFireActive ? 'text-red-700' : 'text-slate-600'
                        : isShelter
                        ? (isVerified ? 'text-emerald-800' : 'text-amber-800')
                        : (isVerified ? 'text-emerald-800' : 'text-amber-800')
                    }`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {point.distance !== null && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        index === 0
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {index === 0 
                          ? (currentLanguage === 'ar' ? `الأقرب (${point.distance} كم)` : `Plus proche (${point.distance} km)`)
                          : `${point.distance} ${currentLanguage === 'ar' ? 'كم' : 'km'}`}
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-emerald-700' : ''}`} />
                  </div>
                </div>

                {/* Title & Location Line */}
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-950 leading-snug">
                    {point.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {currentLanguage === 'ar' ? point.wilayaNameAr : point.wilayaNameFr} - {point.commune}
                  </p>
                </div>

                {/* Collapsible Dropdown Action Row (Lights up on click) */}
                {isExpanded && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                    {!isBurnt && point.phone && (
                      <a
                        href={`tel:${point.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95 text-center"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{currentLanguage === 'ar' ? 'اتصال' : currentLanguage === 'fr' ? 'Appeler' : 'Call'}</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPoint(point);
                        onClose();
                      }}
                      className="py-1.5 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95 text-center"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-300" />
                      <span>{currentLanguage === 'ar' ? 'التفاصيل' : currentLanguage === 'fr' ? 'Détails' : 'Details'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Smart Neighboring Border Centers Dropdown (Closed by default) */}
        {partitioned && partitioned.borderNeighborPoints.length > 0 && (
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <button
              type="button"
              onClick={() => setShowNeighboringDropdown(!showNeighboringDropdown)}
              className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs text-slate-800 flex items-center justify-between transition shadow-xs active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center border border-slate-200">
                  {partitioned.borderNeighborPoints.length}
                </span>
                <span className="font-bold text-slate-800">
                  {currentLanguage === 'ar' 
                    ? 'مراكز قريبة في الولايات المجاورة' 
                    : currentLanguage === 'fr'
                    ? 'Centres proches dans les wilayas voisines'
                    : 'Nearby Centers in Neighboring Wilayas'}
                </span>
              </div>
              {showNeighboringDropdown ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Dropdown Content */}
            {showNeighboringDropdown && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {partitioned.borderNeighborPoints.map(({ point, distanceToWilayaCenterKm }) => {
                  const isBurnt = point.pointType === 'burnt_zone';
                  const isFireActive = isBurnt && (point.status === 'urgent' || point.status === 'active');
                  const isVerified = point.verified;
                  const isExpanded = expandedPointId === point.id;

                  return (
                    <div
                      key={point.id}
                      onClick={() => {
                        setExpandedPointId((prev) => (prev === point.id ? null : point.id));
                      }}
                      className={`p-3.5 bg-white border rounded-2xl shadow-xs space-y-2 text-right hover:shadow-md transition cursor-pointer group active:scale-[0.995] ${
                        isExpanded ? 'border-emerald-700/60 ring-1 ring-emerald-700/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              isBurnt
                                ? isFireActive ? 'bg-red-600' : 'bg-slate-400'
                                : isVerified ? 'bg-emerald-600' : 'bg-amber-500'
                            }`} />
                            <span className="text-[10px] font-bold text-slate-700">
                              {currentLanguage === 'ar' ? `ولاية ${point.wilayaNameAr}` : `Wilaya de ${point.wilayaNameFr}`} ({point.commune})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10.5px] text-slate-500 font-medium">
                              ~ {distanceToWilayaCenterKm} {currentLanguage === 'ar' ? 'كم' : 'km'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-emerald-700' : ''}`} />
                          </div>
                        </div>
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-950">
                          {point.title}
                        </h5>
                      </div>

                      {/* Collapsible Dropdown Action Row */}
                      {isExpanded && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                          {point.pointType !== 'burnt_zone' && point.phone && (
                            <a
                              href={`tel:${point.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl text-center shadow-2xs transition flex items-center gap-1 active:scale-95"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{currentLanguage === 'ar' ? 'اتصال' : currentLanguage === 'fr' ? 'Appeler' : 'Call'}</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPoint(point);
                              onClose();
                            }}
                            className="py-1.5 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95 text-center"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-300" />
                            <span>{currentLanguage === 'ar' ? 'التفاصيل' : currentLanguage === 'fr' ? 'Détails' : 'Details'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
