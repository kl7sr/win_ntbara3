import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Check, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Camera, 
  Image as ImageIcon, 
  Trash2,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { CharityPoint, AidCategory, PointStatus, PointType } from '../types';
import { WILAYAS, AID_CATEGORIES_META } from '../data/wilayas';
import { isWithinAlgeriaBounds } from '../utils/geoParser';
import { compressImageFile } from '../utils/imageCompressor';

interface EditPointModalProps {
  point: CharityPoint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePoint: (id: string, updates: Partial<CharityPoint>) => void;
}

export const EditPointModal: React.FC<EditPointModalProps> = ({
  point,
  isOpen,
  onClose,
  onUpdatePoint,
}) => {
  if (!isOpen || !point) return null;

  const [title, setTitle] = useState(point.title);
  const [organizer, setOrganizer] = useState(point.organizer);
  const [phone, setPhone] = useState(point.phone);
  const [altPhone, setAltPhone] = useState(point.altPhone || '');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(point.wilayaCode);
  const [commune, setCommune] = useState(point.commune);
  const [address, setAddress] = useState(point.address);
  const [pointType, setPointType] = useState<PointType>(point.pointType || 'charity_hub');
  const [status, setStatus] = useState<PointStatus>(point.status || 'active');
  const [verified, setVerified] = useState<boolean>(point.verified);
  const [notes, setNotes] = useState(point.notes || '');
  const [categories, setCategories] = useState<AidCategory[]>(point.aidCategories || ['food_water']);
  const [photos, setPhotos] = useState<string[]>(point.images || (point.imageUrl ? [point.imageUrl] : []));
  const [imageLoading, setImageLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (point) {
      setTitle(point.title);
      setOrganizer(point.organizer);
      setPhone(point.phone);
      setAltPhone(point.altPhone || '');
      setSelectedWilayaCode(point.wilayaCode);
      setCommune(point.commune);
      setAddress(point.address);
      setPointType(point.pointType || 'charity_hub');
      setStatus(point.status || 'active');
      setVerified(point.verified);
      setNotes(point.notes || '');
      setCategories(point.aidCategories || ['food_water']);
      setPhotos(point.images || (point.imageUrl ? [point.imageUrl] : []));
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [point]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageLoading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const compressed = await compressImageFile(files[i], 800, 600, 0.7);
        newImages.push(compressed);
      }
      setPhotos((prev) => [...prev, ...newImages].slice(0, 3));
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleCategory = (cat: AidCategory) => {
    if (categories.includes(cat)) {
      if (categories.length === 1) return;
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !phone.trim()) {
      setErrorMessage('يرجى ملء الاسم ورقم الهاتف.');
      return;
    }

    const wilaya = WILAYAS.find((w) => w.code === selectedWilayaCode) || WILAYAS[15];

    onUpdatePoint(point.id, {
      title: title.trim(),
      organizer: organizer.trim() || 'فاعل خير / متطوعين',
      phone: phone.trim(),
      altPhone: altPhone.trim() || undefined,
      wilayaCode: wilaya.code,
      wilayaNameAr: wilaya.nameAr,
      wilayaNameFr: wilaya.nameFr,
      commune: commune.trim() || wilaya.nameAr,
      address: address.trim() || `${commune || wilaya.nameAr}، ولاية ${wilaya.nameAr}`,
      pointType,
      status,
      verified,
      notes: notes.trim() || undefined,
      aidCategories: categories,
      images: photos.length > 0 ? photos : undefined,
      imageUrl: photos.length > 0 ? photos[0] : undefined,
    });

    setSuccessMessage('تم تحديث وحفظ بيانات النقطة بنجاح!');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">تعديل بيانات النقطة (Admin)</h2>
              <p className="text-xs text-slate-500">تعديل معلومات الموقع مباشرة على الخريطة وقاعدة البيانات</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-white border border-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Type & Status Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">نوع النقطة</label>
              <select
                value={pointType}
                onChange={(e) => setPointType(e.target.value as PointType)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="charity_hub">💚 مركز تبرع وإغاثة</option>
                <option value="burnt_zone">🔥 منطقة حرائق / متضررة</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">الحالة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PointStatus)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="active">نشطة ومتاحة</option>
                <option value="urgent">عاجلة وذات أولوية</option>
                <option value="extinguished">تم إخماد الحريق (رمادي)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">التوثيق</label>
              <button
                type="button"
                onClick={() => setVerified(!verified)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  verified
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                <span>{verified ? 'موثق ومؤكد ✓' : 'غير مؤكد'}</span>
              </button>
            </div>
          </div>

          {/* Title & Organizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">اسم النقطة / المركز *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">المشرف / الجمعية</label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          {/* Phones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">الهاتف الرئيسي *</label>
              <input
                type="tel"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">هاتف إضافي</label>
              <input
                type="tel"
                dir="ltr"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                placeholder="اختياري"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">الولاية *</label>
              <select
                value={selectedWilayaCode}
                onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              >
                {WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {w.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">البلدية *</label>
              <input
                type="text"
                required
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">العنوان التفصيلي</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          {/* Categories */}
          {pointType === 'charity_hub' && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">أنواع المساعدات المقبولة:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(Object.keys(AID_CATEGORIES_META) as AidCategory[]).map((cat) => {
                  const meta = AID_CATEGORIES_META[cat];
                  const isSelected = categories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`p-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-white/20 text-[10px]">
                        {isSelected ? '✓' : '+'}
                      </span>
                      <span>{meta.nameAr}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-semibold text-xs flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>الصور المرفقة ({photos.length}/3):</span>
              </label>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageLoading || photos.length >= 3}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                >
                  {imageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-emerald-700" />}
                  <span>رفع صورة</span>
                </button>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0 group">
                    <img src={p} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">الوصف والملاحظات</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="إرشادات، أوقات العمل أو توجيهات..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition"
            >
              حفظ التعديلات في قاعدة البيانات
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
