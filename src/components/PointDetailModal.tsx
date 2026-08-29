import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Download
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedPhotoPreview(null);
  }, [point]);

  if (!point) return null;

  const distance = userLocation
    ? calculateDistanceKm(userLocation.lat, userLocation.lng, point.lat, point.lng)
    : null;

  const googleMapsUrl = getGoogleMapsDirUrl(point.lat, point.lng, point.title);
  
  // Real uploaded images
  const images = (point.images && point.images.length > 0)
    ? point.images
    : (point.imageUrl ? [point.imageUrl] : []);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

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

  const handleOpenPhotoInNewTab = (imgUrl: string) => {
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`
        <!DOCTYPE html>
        <html lang="ar">
          <head>
            <title>صورة المركز</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
              img { max-width: 100vw; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${imgUrl}" alt="Photo" />
          </body>
        </html>
      `);
      newTab.document.close();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <div 
          className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle */}
          <div className="w-full pt-2.5 pb-1 sm:hidden flex justify-center cursor-pointer bg-white" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
          </div>

          {/* Photo Carousel Header (Only if real pictures are attached) */}
          {images.length > 0 && (
            <div className="relative w-full h-48 sm:h-56 bg-slate-950 shrink-0 overflow-hidden group">
              <img
                src={images[currentImageIndex]}
                alt={point.title}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoPreview(images[currentImageIndex]);
                }}
                className="w-full h-full object-cover cursor-pointer transition-all duration-300 active:scale-95"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

              {/* Left Arrow Button */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition active:scale-90 shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Right Arrow Button */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition active:scale-90 shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Top Controls */}
              <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotoPreview(images[currentImageIndex]);
                  }}
                  className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-xs transition flex items-center gap-1 text-xs px-2.5"
                  title="تكبير الصورة"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>تكبير</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-xs transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Counter */}
              <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                <span className="text-[11px] font-semibold text-white/90 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                  {point.verified ? '✓ صور للمركز' : 'صور مرفقة من صاحب النقطة'}
                </span>

                {images.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-full text-white text-[11px] font-mono font-bold">
                    <span>{currentImageIndex + 1}</span>
                    <span>/</span>
                    <span>{images.length}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Header Details Bar */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
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

            {images.length === 0 && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-white border border-slate-200 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
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
                    يرجى الاتصال بالرقم أدناه والتأكد من فتح المركز وتوفر الاستقبال قبل التنقل.
                  </p>
                </div>
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

            {/* Notes if any */}
            {point.notes && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[10px]">ملاحظات:</span>
                  <span className="font-medium text-slate-800">{point.notes}</span>
                </div>
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

      {/* Top-Level Fullscreen Lightbox Portal - Guaranteed 100% Fullscreen Visibility */}
      {selectedPhotoPreview && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 animate-in fade-in duration-150"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          {/* Top Actions Bar */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPhotoInNewTab(selectedPhotoPreview)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>فتح في نافذة كاملة</span>
              </button>

              <a
                href={selectedPhotoPreview}
                download="charity-point-photo.jpg"
                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition"
                title="تحميل الصورة"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPhotoPreview(null)}
              className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Centered Large Fullscreen Image */}
          <div className="max-w-full max-h-[85vh] flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedPhotoPreview} 
              alt="Full size view" 
              className="max-w-[95vw] max-h-[82vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
