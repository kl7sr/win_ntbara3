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
  Map as MapIcon
} from 'lucide-react';
import { CharityPoint, UserLocation } from '../types';
import { WILAYAS } from '../data/wilayas';
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

  if (!isOpen || !wilayaCode) return null;

  const wilaya = WILAYAS.find((w) => w.code === wilayaCode);
  if (!wilaya) return null;

  const partitioned = getPointsForWilayaWithNeighbors(wilayaCode, points);
  const inWilaya = partitioned ? partitioned.inWilayaPoints : [];
  const borderPoints = partitioned ? partitioned.borderNeighborPoints : [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
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
            <span>ولاية {wilaya.nameAr} (تغيير)</span>
          </button>

          {/* Center: Title */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black text-slate-900">
              {wilaya.code} - {wilaya.nameAr}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            title="عرض الخريطة"
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
                <p className="text-xs font-bold text-slate-700">لا توجد نقاط مسجلة حالياً داخل ولاية {wilaya.nameAr}</p>
                <p className="text-[11px] text-slate-500">يمكنك إضافة أول نقطة تبرع بالضغط على زر «أضف نقطة»</p>
              </div>
            ) : (
              inWilaya.map((point) => {
                const isBurnt = point.pointType === 'burnt_zone';
                const isFireActive = isBurnt && (point.status === 'urgent' || point.status === 'active');
                const isFireExtinguished = isBurnt && (point.status === 'extinguished' || point.status === 'full');
                const isVerified = point.verified;

                const borderAccentClass = isBurnt
                  ? isFireActive ? 'border-r-4 border-r-red-500' : 'border-r-4 border-r-slate-400'
                  : isVerified ? 'border-r-4 border-r-emerald-600' : 'border-r-4 border-r-amber-500';

                const googleMapsUrl = point.googleMapsUrl || getGoogleMapsDirUrl(point.lat, point.lng);

                return (
                  <div
                    key={point.id}
                    className={`p-3.5 sm:p-4 bg-white border border-slate-200/90 ${borderAccentClass} rounded-2xl shadow-xs space-y-3 text-right hover:shadow-md transition`}
                  >
                    {/* Header: Inline Status Dot & Title */}
                    <div 
                      className="cursor-pointer space-y-1"
                      onClick={() => onOpenFullDetails(point)}
                    >
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
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-slate-900 hover:text-emerald-800 transition">
                        {point.title}
                      </h4>

                      <p className="text-[11px] text-slate-500">
                        {point.wilayaNameAr} - {point.commune}
                      </p>
                    </div>

                    {/* Action Buttons: Primary (Call) vs Secondary (Directions) */}
                    <div className={`grid ${isBurnt ? 'grid-cols-1' : 'grid-cols-2'} gap-2 pt-1 border-t border-slate-100`}>
                      {/* Call Button - Only for Donation Centers */}
                      {!isBurnt && point.phone && (
                        <a
                          href={`tel:${point.phone}`}
                          className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 text-center"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>اتصال</span>
                        </a>
                      )}

                      {/* Directions Button */}
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 text-center ${
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
                      : 'Centres dans les wilayas voisines les plus proches'}
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
                    const isFireExtinguished = isBurnt && (point.status === 'extinguished' || point.status === 'full');
                    const isVerified = point.verified;

                    const borderAccentClass = isBurnt
                      ? isFireActive ? 'border-r-4 border-r-red-500' : 'border-r-4 border-r-slate-400'
                      : isVerified ? 'border-r-4 border-r-emerald-600' : 'border-r-4 border-r-amber-500';

                    const googleMapsUrl = point.googleMapsUrl || getGoogleMapsDirUrl(point.lat, point.lng);

                    return (
                      <div
                        key={point.id}
                        className={`p-3.5 bg-white border border-slate-200/90 ${borderAccentClass} rounded-2xl shadow-xs space-y-2.5 text-right hover:shadow-md transition`}
                      >
                        <div 
                          className="cursor-pointer space-y-1"
                          onClick={() => onOpenFullDetails(point)}
                        >
                          <div className="flex items-center justify-between">
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
                            <span className="text-[10.5px] text-slate-500 font-medium">
                              ~ {distanceToWilayaCenterKm} كم
                            </span>
                          </div>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-800">
                            {point.title}
                          </h5>
                          <p className="text-[11px] text-slate-500">{point.commune} ({point.address})</p>
                        </div>

                        <div className={`grid ${point.pointType === 'burnt_zone' ? 'grid-cols-1' : 'grid-cols-2'} gap-2 pt-1 border-t border-slate-100`}>
                          {point.pointType !== 'burnt_zone' && point.phone && (
                            <a
                              href={`tel:${point.phone}`}
                              className="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition active:scale-95 text-center"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>اتصال</span>
                            </a>
                          )}

                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition border border-slate-200 active:scale-95 text-center ${
                              point.pointType !== 'burnt_zone' && point.phone
                                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs font-bold'
                            }`}
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>الاتجاهات</span>
                          </a>
                        </div>
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
            <span>استكشاف النقاط على الخريطة التفاعلية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
