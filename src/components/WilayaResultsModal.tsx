import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Navigation, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  ShieldCheck, 
  Info,
  Map as MapIcon,
  Flame
} from 'lucide-react';
import { CharityPoint, UserLocation } from '../types';
import { WILAYAS, AID_CATEGORIES_META } from '../data/wilayas';
import { getPointsForWilayaWithNeighbors } from '../utils/proximity';
import { getGoogleMapsDirUrl } from '../utils/geoParser';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface WilayaResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wilayaCode: number | null;
  points: CharityPoint[];
  userLocation: UserLocation | null;
  onSelectPointOnMap: (point: CharityPoint) => void;
  onOpenFullDetails: (point: CharityPoint) => void;
  onChangeWilaya: () => void;
  currentLanguage?: Language;
}

export const WilayaResultsModal: React.FC<WilayaResultsModalProps> = ({
  isOpen,
  onClose,
  wilayaCode,
  points,
  userLocation,
  onSelectPointOnMap,
  onOpenFullDetails,
  onChangeWilaya,
  currentLanguage = 'ar',
}) => {
  const [showBorderDropdown, setShowBorderDropdown] = useState(false);
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);

  if (!isOpen || !wilayaCode) return null;

  const wilaya = WILAYAS.find((w) => w.code === wilayaCode);
  if (!wilaya) return null;

  const partitioned = getPointsForWilayaWithNeighbors(wilayaCode, points);
  const inWilaya = partitioned ? partitioned.inWilayaPoints : [];
  const borderPoints = partitioned ? partitioned.borderNeighborPoints : [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/15 pointer-events-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-50 border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="w-full pt-2 pb-1 sm:hidden flex justify-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        {/* Top Header Card: Selected Wilaya & Change Button */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
          {/* Right: Change Wilaya Chip */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onChangeWilaya();
            }}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-full border border-slate-300 flex items-center gap-1.5 shadow-xs transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>
              {currentLanguage === 'ar' 
                ? `ولاية ${wilaya.nameAr} (تغيير)` 
                : currentLanguage === 'fr' 
                ? `Wilaya de ${wilaya.nameFr} (changer)` 
                : `Wilaya ${wilaya.nameFr} (change)`}
            </span>
          </button>

          {/* Center: Title */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black text-slate-900">
              {wilaya.code} - {currentLanguage === 'ar' ? wilaya.nameAr : wilaya.nameFr}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            title={currentLanguage === 'ar' ? 'عرض الخريطة' : 'Voir la carte'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1">
          {/* 1. In-Wilaya Points Section */}
          <div className="space-y-3">
            {inWilaya.length === 0 ? (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center text-slate-500 space-y-2">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  {currentLanguage === 'ar'
                    ? `لا توجد نقاط مسجلة حالياً داخل ولاية ${wilaya.nameAr}`
                    : currentLanguage === 'fr'
                    ? `Aucun point enregistré dans la wilaya de ${wilaya.nameFr}`
                    : `No registered points in ${wilaya.nameFr}`}
                </p>
                <p className="text-[11px] text-slate-500">
                  {currentLanguage === 'ar'
                    ? 'يمكنك إضافة أول نقطة تبرع بالضغط على زر «أضف نقطة»'
                    : currentLanguage === 'fr'
                    ? 'Vous pouvez ajouter un point en cliquant sur « Ajouter un point »'
                    : 'You can add a point by clicking "Add Point"'}
                </p>
              </div>
            ) : (
              inWilaya.map((point) => {
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
                    className={`p-3.5 bg-white border rounded-2xl shadow-xs hover:shadow-md transition space-y-2 text-right cursor-pointer group active:scale-[0.995] ${
                      isExpanded ? 'border-emerald-700/60 ring-1 ring-emerald-700/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header: Inline Status Dot + Chevron */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          isBurnt
                            ? isFireActive ? 'bg-red-600' : 'bg-slate-400'
                            : isVerified ? 'bg-emerald-600' : 'bg-amber-500'
                        }`} />
                        <span className={`text-[11px] font-bold ${
                          isBurnt
                            ? isFireActive ? 'text-red-700' : 'text-slate-600'
                            : isShelter
                            ? (isVerified ? 'text-emerald-800' : 'text-amber-800')
                            : (isVerified ? 'text-emerald-800' : 'text-amber-800')
                        }`}>
                          {statusLabel}
                        </span>
                      </div>

                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-emerald-700' : ''}`} />
                    </div>

                    {/* Middle: Title & Location */}
                    <div className="space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-950">
                        {point.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {currentLanguage === 'ar' ? point.wilayaNameAr : point.wilayaNameFr} - {point.commune}
                      </p>
                    </div>

                    {/* Collapsible Dropdown Action Row */}
                    {isExpanded && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                        {!isBurnt && point.phone && (
                          <a
                            href={`tel:${point.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition active:scale-95"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{currentLanguage === 'ar' ? 'اتصال' : currentLanguage === 'fr' ? 'Appeler' : 'Call'}</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFullDetails(point);
                          }}
                          className="py-1.5 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95"
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
          </div>

          {/* 2. Collapsible Dropdown for Neighboring Wilayas */}
          {borderPoints.length > 0 && (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={() => setShowBorderDropdown(!showBorderDropdown)}
                className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs text-slate-800 flex items-center justify-between transition shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center border border-slate-200">
                    {borderPoints.length}
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentLanguage === 'ar' 
                      ? 'مراكز في أقرب الولايات المجاورة' 
                      : currentLanguage === 'fr'
                      ? 'Centres dans les wilayas voisines les plus proches'
                      : 'Nearby Centers in Neighboring Wilayas'}
                  </span>
                </div>
                {showBorderDropdown ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {/* Dropdown Content */}
              {showBorderDropdown && (
                <div className="space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {borderPoints.map(({ point, distanceToWilayaCenterKm }) => {
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
                                className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition active:scale-95"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{currentLanguage === 'ar' ? 'اتصال' : currentLanguage === 'fr' ? 'Appeler' : 'Call'}</span>
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenFullDetails(point);
                              }}
                              className="py-1.5 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95"
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

        {/* Bottom CTA to view Map */}
        <div className="p-3 bg-white border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <MapIcon className="w-4 h-4 text-emerald-400" />
            <span>
              {currentLanguage === 'ar' 
                ? 'استكشاف النقاط على الخريطة التفاعلية' 
                : currentLanguage === 'fr'
                ? 'Explorer les points sur la carte interactive'
                : 'Explore Points on the Interactive Map'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
