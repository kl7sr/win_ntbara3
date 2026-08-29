import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Check, 
  AlertCircle, 
  LocateFixed, 
  Loader2, 
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { CharityPoint, AidCategory, PointStatus } from '../types';
import { WILAYAS, AID_CATEGORIES_META } from '../data/wilayas';
import { isWithinAlgeriaBounds, ALGERIA_BOUNDS } from '../utils/geoParser';
import { compressImageFile } from '../utils/imageCompressor';
import L from 'leaflet';

interface AddPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPoint: (point: Omit<CharityPoint, 'id' | 'createdAt'>) => void;
  initialCoords?: { lat: number; lng: number } | null;
}

export const AddPointModal: React.FC<AddPointModalProps> = ({
  isOpen,
  onClose,
  onAddPoint,
  initialCoords,
}) => {
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(16); // Default Alger
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<AidCategory[]>(['food_water', 'clothes', 'medical']);
  const [status, setStatus] = useState<PointStatus>('active');
  const [urgentDescription, setUrgentDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Images state
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);

  // GPS Coordinates
  const [lat, setLat] = useState<number>(initialCoords?.lat || 36.7538);
  const [lng, setLng] = useState<number>(initialCoords?.lng || 3.0588);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const miniMarkerRef = useRef<L.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialCoords && isWithinAlgeriaBounds(initialCoords.lat, initialCoords.lng)) {
        setLat(initialCoords.lat);
        setLng(initialCoords.lng);
        const closest = WILAYAS.reduce((prev, curr) => {
          const distPrev = Math.hypot(prev.lat - initialCoords.lat, prev.lng - initialCoords.lng);
          const distCurr = Math.hypot(curr.lat - initialCoords.lat, curr.lng - initialCoords.lng);
          return distCurr < distPrev ? curr : prev;
        });
        if (closest) {
          setSelectedWilayaCode(closest.code);
        }
      } else {
        detectCurrentLocation();
      }
    }
  }, [isOpen, initialCoords]);

  useEffect(() => {
    if (!isOpen || !miniMapContainerRef.current) return;

    if (!miniMapInstanceRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: false,
        maxBounds: L.latLngBounds(
          L.latLng(ALGERIA_BOUNDS.minLat, ALGERIA_BOUNDS.minLng),
          L.latLng(ALGERIA_BOUNDS.maxLat, ALGERIA_BOUNDS.maxLng)
        ),
        maxBoundsViscosity: 1.0,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="background-color:#047857; width:28px; height:28px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        if (isWithinAlgeriaBounds(pos.lat, pos.lng)) {
          setLat(Number(pos.lat.toFixed(6)));
          setLng(Number(pos.lng.toFixed(6)));
          setErrorMessage('');
        } else {
          setErrorMessage('عذراً، يجب أن يكون موقع نقطة التبرع داخل الحدود الجزائرية فقط.');
          marker.setLatLng([lat, lng]);
        }
      });

      map.on('click', (e) => {
        if (isWithinAlgeriaBounds(e.latlng.lat, e.latlng.lng)) {
          marker.setLatLng(e.latlng);
          setLat(Number(e.latlng.lat.toFixed(6)));
          setLng(Number(e.latlng.lng.toFixed(6)));
          setErrorMessage('');
        } else {
          setErrorMessage('عذراً، لا يمكن وضع النقطة خارج حدود الجزائر.');
        }
      });

      miniMapInstanceRef.current = map;
      miniMarkerRef.current = marker;
    } else {
      miniMapInstanceRef.current.setView([lat, lng], 13);
      if (miniMarkerRef.current) {
        miniMarkerRef.current.setLatLng([lat, lng]);
      }
    }

    return () => {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
        miniMarkerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (miniMapInstanceRef.current && miniMarkerRef.current) {
      miniMarkerRef.current.setLatLng([lat, lng]);
      miniMapInstanceRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    setErrorMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));

        if (!isWithinAlgeriaBounds(newLat, newLng)) {
          setGpsLoading(false);
          setErrorMessage('موقعك الحالي يقع خارج حدود الجزائر.');
          return;
        }

        setLat(newLat);
        setLng(newLng);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setGpsLoading(false);

        const closest = WILAYAS.reduce((prev, curr) => {
          const distPrev = Math.hypot(prev.lat - newLat, prev.lng - newLng);
          const distCurr = Math.hypot(curr.lat - newLat, curr.lng - newLng);
          return distCurr < distPrev ? curr : prev;
        });
        if (closest) {
          setSelectedWilayaCode(closest.code);
        }
      },
      () => {
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageLoading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const compressed = await compressImageFile(files[i], 1200, 1200, 0.85);
        newImages.push(compressed);
      }
      setAttachedImages((prev) => [...prev, ...newImages].slice(0, 3));
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (cat: AidCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) return;
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWithinAlgeriaBounds(lat, lng)) {
      setErrorMessage('عذراً، يجب أن يكون موقع نقطة التبرع داخل الحدود الجغرافية للجزائر فقط.');
      return;
    }

    if (!title.trim() || !phone.trim() || !commune.trim()) {
      setErrorMessage('يرجى ملء اسم النقطة، رقم الهاتف، والبلدية.');
      return;
    }

    const wilaya = WILAYAS.find((w) => w.code === selectedWilayaCode) || WILAYAS[15];
    const organizerName = organizer.trim() || 'فاعل خير / متطوعين';

    onAddPoint({
      title: title.trim(),
      organizer: organizerName,
      phone: phone.trim(),
      altPhone: altPhone.trim() || undefined,
      wilayaCode: wilaya.code,
      wilayaNameAr: wilaya.nameAr,
      wilayaNameFr: wilaya.nameFr,
      commune: commune.trim(),
      address: address.trim() || `${commune}، ولاية ${wilaya.nameAr}`,
      lat,
      lng,
      aidCategories: selectedCategories,
      status,
      urgentDescription: urgentDescription.trim() || undefined,
      notes: notes.trim() || undefined,
      verified: false,
      featured: false,
      createdBy: 'user',
      accuracyMeters: gpsAccuracy || undefined,
      images: attachedImages.length > 0 ? attachedImages : undefined,
      imageUrl: attachedImages.length > 0 ? attachedImages[0] : undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl shadow-2xl my-0 sm:my-auto max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Mobile Drag Handle */}
        <div className="w-full pt-2.5 pb-1 sm:hidden flex justify-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">إضافة نقطة تبرع بالجزائر</h2>
              <p className="text-xs text-slate-500">سجل موقع مركز التبرعات ليتمكن المتبرعون من الوصول إليكم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-white border border-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* GPS Location Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 text-xs block">موقع النقطة الجغرافي:</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                  {gpsAccuracy && ` (دقة: ±${gpsAccuracy}m)`}
                </span>
              </div>

              <button
                type="button"
                onClick={detectCurrentLocation}
                disabled={gpsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50 active:scale-95"
              >
                {gpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="w-3.5 h-3.5" />
                )}
                <span>{gpsLoading ? 'جاري التحديد...' : 'تحديث موقعي (GPS)'}</span>
              </button>
            </div>

            {/* Interactive Mini Map */}
            <div className="relative rounded-lg overflow-hidden border border-slate-300 h-32 w-full">
              <div ref={miniMapContainerRef} className="w-full h-full" />
              <div className="absolute bottom-1.5 right-1.5 z-[400] bg-white/95 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                داخل حدود الجزائر فقط
              </div>
            </div>
          </div>

          {/* Title & Organizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                اسم نقطة التبرع أو المركز <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: نقطة تجميع، دار الشباب، مسجد..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                اسم الجمعية / المشرف <span className="text-slate-400 font-normal">(اختياري)</span>
              </label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="مثال: جمعية الإحسان، متطوعين (اختياري)"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                رقم الهاتف للاتصال <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550123456"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-xs sm:text-sm"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                رقم إضافي (اختياري)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder="021123456"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-xs sm:text-sm"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Wilaya & Commune */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                الولاية <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedWilayaCode}
                onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
              >
                {WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {w.nameAr} ({w.nameFr})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                البلدية <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder="البلدية أو الحي"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Attach Pictures Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>إرفاق صور للمركز (اختياري):</span>
              </label>
              <span className="text-[10px] text-slate-500">تظهر للزوار في نافذة المركز</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {attachedImages.map((imgSrc, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 group">
                  <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {attachedImages.length < 3 && (
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-600 bg-white flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-emerald-700 transition">
                  {imageLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-semibold">+ صورة</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">العنوان ومكان التواجد</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="العنوان بدقة"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
            />
          </div>

          {/* Accepted Aid Types */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              نوع التبرعات المقبولة <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(AID_CATEGORIES_META) as AidCategory[]).map((catKey) => {
                const meta = AID_CATEGORIES_META[catKey];
                const isSelected = selectedCategories.includes(catKey);
                return (
                  <button
                    type="button"
                    key={catKey}
                    onClick={() => toggleCategory(catKey)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition text-right ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{meta.labelAr}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md transition flex items-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>نشر نقطة التبرع على الخريطة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
