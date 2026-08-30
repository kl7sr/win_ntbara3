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
  Trash2,
  Link as LinkIcon,
  ShieldCheck
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
  initialWilayaCode?: number;
}

export const AddPointModal: React.FC<AddPointModalProps> = ({
  isOpen,
  onClose,
  onAddPoint,
  initialCoords,
  initialWilayaCode,
}) => {
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(initialWilayaCode || 16);
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<AidCategory[]>(['food_water', 'clothes', 'medical']);
  const [status, setStatus] = useState<PointStatus>('active');
  const [urgentDescription, setUrgentDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Quick Google Link Auto-Fill
  const [googleLinkInput, setGoogleLinkInput] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);

  // Images state
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // GPS Coordinates (Default: Algiers)
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
      setErrorMessage('');
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
      } else if (initialWilayaCode) {
        setSelectedWilayaCode(initialWilayaCode);
      }
    }
  }, [isOpen, initialCoords, initialWilayaCode]);

  // When selected wilaya changes and user didn't move pin, auto center mini-map to wilaya center
  useEffect(() => {
    const wilaya = WILAYAS.find((w) => w.code === selectedWilayaCode);
    if (wilaya && !initialCoords) {
      setLat(wilaya.lat);
      setLng(wilaya.lng);
    }
  }, [selectedWilayaCode, initialCoords]);

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
    if (!navigator.geolocation) {
      setErrorMessage('تحديد الموقع غير مدعوم على متصفحك.');
      return;
    }
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
      (err) => {
        setGpsLoading(false);
        console.warn('GPS error in modal:', err);
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
        const compressed = await compressImageFile(files[i], 500, 500, 0.65);
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

  const handleExtractFromGoogleLink = async () => {
    if (!googleLinkInput.trim()) return;
    setLinkLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/resolve-google-maps?url=${encodeURIComponent(googleLinkInput.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lng) {
          if (!isWithinAlgeriaBounds(data.lat, data.lng)) {
            setErrorMessage('الموقع يقع خارج حدود الجزائر.');
            setLinkLoading(false);
            return;
          }

          setLat(Number(data.lat.toFixed(6)));
          setLng(Number(data.lng.toFixed(6)));
          if (data.title) setTitle(data.title);
          if (data.phone) setPhone(data.phone);
          if (data.address) setAddress(data.address);
          if (data.photos && data.photos.length > 0) setAttachedImages(data.photos);

          const closest = WILAYAS.reduce((prev, curr) => {
            const distPrev = Math.hypot(prev.lat - data.lat, prev.lng - data.lng);
            const distCurr = Math.hypot(curr.lat - data.lat, curr.lng - data.lng);
            return distCurr < distPrev ? curr : prev;
          });
          if (closest) {
            setSelectedWilayaCode(closest.code);
            setCommune(closest.nameAr);
          }

          setLinkSuccess(true);
          setTimeout(() => setLinkSuccess(false), 4000);
        }
      }
    } catch (err) {
      console.warn('Link extract error:', err);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto fix coords if out of bounds
    const wilaya = WILAYAS.find((w) => w.code === selectedWilayaCode) || WILAYAS[15];
    let finalLat = lat;
    let finalLng = lng;

    if (!isWithinAlgeriaBounds(finalLat, finalLng)) {
      finalLat = wilaya.lat;
      finalLng = wilaya.lng;
    }

    if (!title.trim()) {
      setErrorMessage('يرجى إدخال اسم نقطة التبرع أو المركز.');
      return;
    }

    const finalPhone = phone.trim() || '0550000000';
    const finalCommune = commune.trim() || wilaya.nameAr;
    const organizerName = organizer.trim() || 'فاعل خير / متطوعين';

    const newPointData: Omit<CharityPoint, 'id' | 'createdAt'> = {
      title: title.trim(),
      organizer: organizerName,
      phone: finalPhone,
      altPhone: altPhone.trim() || undefined,
      wilayaCode: wilaya.code,
      wilayaNameAr: wilaya.nameAr,
      wilayaNameFr: wilaya.nameFr,
      commune: finalCommune,
      address: address.trim() || `${finalCommune}، ولاية ${wilaya.nameAr}`,
      lat: finalLat,
      lng: finalLng,
      aidCategories: selectedCategories.length > 0 ? selectedCategories : ['food_water', 'clothes'],
      status: 'active',
      pointType: 'charity_hub',
      urgentDescription: urgentDescription.trim() || undefined,
      notes: notes.trim() || undefined,
      verified: false,
      featured: false,
      createdBy: 'user',
      accuracyMeters: gpsAccuracy || undefined,
      images: attachedImages.length > 0 ? attachedImages : undefined,
      imageUrl: attachedImages.length > 0 ? attachedImages[0] : undefined,
    };

    console.log('Publishing new point from mobile:', newPointData);
    onAddPoint(newPointData);

    // Reset form
    setTitle('');
    setOrganizer('');
    setPhone('');
    setAltPhone('');
    setCommune('');
    setAddress('');
    setGoogleLinkInput('');
    setAttachedImages([]);
    setErrorMessage('');

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
            <div className="p-2 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
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
                داخل حدود الجزائر
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
                البلدية <span className="text-slate-400 font-normal">(اختياري)</span>
              </label>
              <input
                type="text"
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
                        ? 'bg-slate-900 border-slate-900 text-white font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{meta.labelAr}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legal Disclaimer / Terms of Use Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
              <span>إخلاء المسؤولية وشروط الاستخدام</span>
            </div>
            <p className="leading-relaxed">
              «وين نتبرع» منصة تطوعية مستقلة لعرض المعلومات ولا تجمع أي تبرعات أو أموال. بإرسالك لهذه النقطة، أنت تقر بصحة ودقة البيانات وتوافق على{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-slate-900 font-bold underline hover:text-black inline-block"
              >
                شروط الاستخدام وإخلاء المسؤولية
              </button>.
            </p>
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

      {/* Full Terms & Disclaimer Modal */}
      {showTermsModal && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">شروط الاستخدام وإخلاء المسؤولية</h3>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-[11px]">
                مسودة أولية — ينصح بمراجعتها من طرف محامٍ مختص قبل اعتمادها رسمياً.
              </div>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">1. طبيعة المنصة</h4>
                <p>«وين نتبرع» هي أداة رقمية تطوعية تهدف إلى تسهيل وصول المواطنين لمعلومات حول نقاط جمع التبرعات والمناطق المتضررة في الجزائر.</p>
                <p className="font-semibold text-slate-800">المنصة ليست:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pr-2">
                  <li>جهة حكومية أو رسمية تابعة للدولة الجزائرية</li>
                  <li>جمعية خيرية أو منظمة إغاثية مرخّصة</li>
                  <li>جامعة أو مستلمة للتبرعات بأي شكل (لا تُجمع أي أموال أو مواد عبر المنصة نفسها)</li>
                </ul>
                <p>دور المنصة يقتصر على عرض وتنظيم معلومات يقدمها المستخدمون والجمعيات لتسهيل التواصل المباشر دون وساطة.</p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">2. مسؤولية المحتوى</h4>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pr-2">
                  <li>المعلومات المعروضة على الخريطة (عناوين، أرقام هواتف، صور، احتياجات) يتم إدخالها من طرف المستخدمين أو الجمعيات أو تُجلب تلقائياً من مصادر خارجية (مثل Google Maps).</li>
                  <li>النقاط التي تحمل علامة "غير مؤكدة" لم يتم التحقق منها من طرف فريق المنصة، وعلى المستخدم الاتصال بالمنسق للتأكد قبل التنقل.</li>
                  <li>كل شخص أو جمعية تضيف نقطة تبرع هي المسؤولة الوحيدة عن صحة ودقة المعلومات التي تقدمها.</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">3. إخلاء المسؤولية</h4>
                <p className="font-semibold text-slate-800">القائمون على تطوير وتشغيل المنصة:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pr-2">
                  <li>لا يضمنون دقة أو حداثة أو اكتمال أي معلومة معروضة على الخريطة.</li>
                  <li>غير مسؤولين عن أي نزاع أو ضرر أو خسارة مادية أو معنوية تنتج عن استخدام المعلومات المعروضة.</li>
                  <li>غير مسؤولين عن أفعال أو تصرفات الجمعيات أو الأفراد المذكورين على المنصة.</li>
                  <li>يحتفظون بالحق في تعديل أو حذف أي نقطة أو محتوى دون إشعار مسبق.</li>
                </ul>
                <p>المنصة تُقدَّم "كما هي" (as-is) دون أي ضمان لاستمرارية الخدمة أو خلوها من الأعطال التقنية.</p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">4. مسؤولية المستخدم</h4>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pr-2">
                  <li>مسؤول عن التحقق من صحة أي معلومة قبل التصرف بناءً عليها (خاصة النقاط غير المؤكدة).</li>
                  <li>مسؤول عن دقة أي معلومة يضيفها بنفسه (اسم المركز، الهاتف، العنوان، الصور).</li>
                  <li>لن يستخدم المنصة لنشر معلومات كاذبة أو مضللة أو لأغراض احتيالية.</li>
                  <li>يتحمل بمفرده أي قرار يتخذه بناءً على المعلومات المعروضة.</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">5. التواصل والدعم</h4>
                <p>لأي مشكلة تقنية أو بلاغ عن معلومة خاطئة، يُرجى التواصل عبر الأرقام ووسائل الاتصال المذكورة داخل التطبيق.</p>
              </section>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                فهمت وموافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
