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
  Clock
} from 'lucide-react';
import { CharityPoint, AidCategory, PointStatus } from '../types';
import { WILAYAS, AID_CATEGORIES_META } from '../data/wilayas';
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
  const [hours, setHours] = useState('08:30 - 19:00');

  // GPS Coordinates
  const [lat, setLat] = useState<number>(initialCoords?.lat || 36.7538);
  const [lng, setLng] = useState<number>(initialCoords?.lng || 3.0588);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const miniMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialCoords) {
        setLat(initialCoords.lat);
        setLng(initialCoords.lng);
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
        setLat(Number(pos.lat.toFixed(6)));
        setLng(Number(pos.lng.toFixed(6)));
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setLat(Number(e.latlng.lat.toFixed(6)));
        setLng(Number(e.latlng.lng.toFixed(6)));
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
      setErrorMessage('خاصية تحديد الموقع غير مدعومة في هذا المتصفح');
      return;
    }
    setGpsLoading(true);
    setErrorMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
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
    if (!title.trim() || !organizer.trim() || !phone.trim() || !commune.trim()) {
      setErrorMessage('يرجى ملء جميع الحقول الإلزامية (اسم النقطة، المشرف، الهاتف، والبلدية).');
      return;
    }

    const wilaya = WILAYAS.find((w) => w.code === selectedWilayaCode) || WILAYAS[15];

    onAddPoint({
      title: title.trim(),
      organizer: organizer.trim(),
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
      hours: hours.trim() || '08:00 - 19:00',
      verified: false,
      featured: false,
      createdBy: 'user',
      accuracyMeters: gpsAccuracy || undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">إضافة نقطة تبرع جديدة</h2>
              <p className="text-xs text-slate-500">سجل موقع مركز التبرعات ليتمكن المواطنون من الوصول إليكم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* GPS Location Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 text-xs block">موقع النقطة الجغرافي:</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                  {gpsAccuracy && ` (دقة: ±${gpsAccuracy} متر)`}
                </span>
              </div>

              <button
                type="button"
                onClick={detectCurrentLocation}
                disabled={gpsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
              >
                {gpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="w-3.5 h-3.5" />
                )}
                <span>{gpsLoading ? 'جاري التحديد...' : 'تحديد موقعي الحالي (GPS)'}</span>
              </button>
            </div>

            {/* Interactive Mini Map */}
            <div className="relative rounded-lg overflow-hidden border border-slate-300 h-36 w-full">
              <div ref={miniMapContainerRef} className="w-full h-full" />
              <div className="absolute bottom-1.5 right-1.5 z-[400] bg-white/95 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                اسحب النقطة أو انقر على الخريطة لتعديل الموقع بدقة
              </div>
            </div>
          </div>

          {/* Title & Organizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                اسم نقطة التبرع أو المركز <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مركز الهلال الأحمر، دار الشباب، جمعية..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                المشرف / الجمعية / المنظم <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="مثال: جمعية البركة، كشافة، متطوعين..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                رقم الهاتف الرئيسي للاتصال <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550123456"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                رقم هاتف إضافي (اختياري)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder="021123456"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Wilaya & Commune */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                الولاية <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedWilayaCode}
                onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Address & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">العنوان ومكان التواجد</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="العنوان بدقة (شارع، بجانب مسجد...)"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">أوقات استقبال التبرعات</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="مثال: 08:30 - 19:00"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
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
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition text-right ${
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

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              ملاحظات إضافية (اختياري)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي معلومات إضافية للمتبرعين..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition flex items-center gap-2"
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
