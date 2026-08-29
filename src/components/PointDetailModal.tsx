import React, { useState } from 'react';
import { 
  Phone, 
  MapPin, 
  Navigation, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Check, 
  X, 
  ExternalLink,
  ShieldCheck,
  Info,
  Image as ImageIcon,
  Eye
} from 'lucide-react';
import { CharityPoint, UserLocation } from '../types';
import { AID_CATEGORIES_META } from '../data/wilayas';
import { calculateDistanceKm, formatDistance, getGoogleMapsDirUrl } from '../utils/geoParser';

interface PointDetailModalProps {
  point: CharityPoint | null;
  userLocation: UserLocation | null;
  onClose: () => void;
}

export const PointDetailModal: React.FC<PointDetailModalProps> = ({
  point,
  userLocation,
  onClose,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  if (!point) return null;

  const distance = userLocation
    ? calculateDistanceKm(userLocation.lat, userLocation.lng, point.lat, point.lng)
    : null;

  const googleMapsUrl = getGoogleMapsDirUrl(point.lat, point.lng, point.title);
  const images = point.images || (point.imageUrl ? [point.imageUrl] : []);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(point.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const statusText = point.verified ? 'موقع تبرع مؤكد' : 'موقع تبرع (يرجى الاتصال للتأكد قبل التنقل)';
    const text = `*${encodeURIComponent(point.title)}* (${statusText}):%0A` +
      `المشرف: ${encodeURIComponent(point.organizer)}%0A` +
      `الهاتف: ${point.phone}%0A` +
      `الولاية: ${encodeURIComponent(point.wilayaNameAr)} - ${encodeURIComponent(point.commune)}%0A` +
      `الموقع على خرائط Google: ${encodeURIComponent(googleMapsUrl)}`;
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(googleMapsUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <div 
          className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle */}
          <div className="w-full pt-2.5 pb-1 sm:hidden flex justify-center cursor-pointer" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
          </div>

          {/* Header Bar */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {point.verified ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    موقع مؤكد وموثوق
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    غير مؤكد رسمياً (اتصل قبل الذهاب)
                  </span>
                )}

                {distance !== null && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-300">
                    <Navigation className="w-3 h-3 text-slate-600" />
                    يبعد {formatDistance(distance, 'ar')}
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {point.title}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                <span className="font-semibold text-emerald-700">{point.organizer}</span>
                <span>•</span>
                <span>{point.wilayaNameAr} ({point.commune})</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-white border border-slate-200 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
            {/* Warning Callout for Unconfirmed Locations */}
            {!point.verified && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs block text-amber-800 mb-0.5">
                    تنبيه: هذا الموقع غير مؤكد رسمياً بعد
                  </span>
                  <p className="text-xs leading-relaxed text-amber-700">
                    يرجى الاتصال بالرقم أدناه والتأكد من توفر واستقبال المساعدات قبل التنقل.
                  </p>
                </div>
              </div>
            )}

            {/* Photos Section: Only show to public if confirmed, otherwise state they are being checked */}
            {images.length > 0 && (
              <div className="space-y-1.5">
                {point.verified ? (
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1.5">صور المركز الموثقة:</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {images.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedPhotoPreview(imgUrl)}
                          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer shadow-xs hover:opacity-90 transition group"
                        >
                          <img src={imgUrl} alt="Photo" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-600 text-xs">
                    <ImageIcon className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>الصور المرفقة ({images.length}) قيد المراجعة والتدقيق من طرف الإدارة</span>
                  </div>
                )}
              </div>
            )}

            {/* Urgent Note */}
            {point.urgentDescription && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-900">
                <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs block text-red-800 mb-0.5">احتياجات ذات أولوية:</span>
                  <p className="text-xs leading-relaxed">{point.urgentDescription}</p>
                </div>
              </div>
            )}

            {/* Location & Address */}
            <div className="flex items-start gap-2.5 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="text-slate-500">العنوان:</div>
                <div className="font-semibold text-slate-900 text-xs sm:text-sm mt-0.5">{point.address}</div>
                <div className="text-slate-500 mt-0.5">
                  الولاية: {point.wilayaCode} - {point.wilayaNameAr} ({point.wilayaNameFr})
                </div>
              </div>
            </div>

            {/* Operating Hours / Notes */}
            {(point.hours || point.notes) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {point.hours && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[10px]">أوقات الاستقبال:</span>
                      <span className="font-medium text-slate-800">{point.hours}</span>
                    </div>
                  </div>
                )}
                {point.notes && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[10px]">ملاحظات:</span>
                      <span className="font-medium text-slate-800">{point.notes}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aid Categories Tags */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-1.5">التبرعات المقبولة:</h4>
              <div className="flex flex-wrap gap-1.5">
                {point.aidCategories.map((catKey) => {
                  const meta = AID_CATEGORIES_META[catKey] || AID_CATEGORIES_META.general;
                  return (
                    <span
                      key={catKey}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {meta.labelAr}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-2 space-y-2 pb-2">
              {/* Direct Call Button */}
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${point.phone}`}
                  className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-xl shadow-md transition text-sm text-center active:scale-[0.98] ${
                    point.verified 
                      ? 'bg-emerald-700 hover:bg-emerald-800' 
                      : 'bg-amber-700 hover:bg-amber-800'
                  }`}
                >
                  <Phone className="w-4 h-4 text-white" />
                  <span>{point.verified ? 'اتصل بالمنسق:' : 'اتصل للتأكد قبل التنقل:'}</span>
                  <span dir="ltr" className="font-mono tracking-wider font-extrabold bg-black/20 px-2 py-0.5 rounded">
                    {point.phone}
                  </span>
                </a>

                <button
                  onClick={handleCopyPhone}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition active:scale-95"
                  title="نسخ رقم الهاتف"
                >
                  {copiedPhone ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Direct Google Maps Navigation Button */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition text-sm text-center active:scale-[0.98]"
              >
                <Navigation className="w-4 h-4 text-red-400" />
                <span>التوجه عبر Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              {/* WhatsApp & Copy Share */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-2.5 px-3 rounded-xl border border-slate-300 transition text-xs active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>مشاركة بالواتساب</span>
                </button>

                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-2.5 px-3 rounded-xl border border-slate-300 transition text-xs active:scale-95"
                >
                  {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedPhotoPreview && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <button
            onClick={() => setSelectedPhotoPreview(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedPhotoPreview} 
            alt="Preview" 
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
