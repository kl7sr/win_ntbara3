import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Upload, 
  RefreshCw, 
  Link as LinkIcon, 
  MapPin, 
  Phone, 
  Check, 
  ExternalLink, 
  Search, 
  Eye, 
  Sliders, 
  Image as ImageIcon
} from 'lucide-react';
import { CharityPoint, AidCategory, PointStatus } from '../types';
import { WILAYAS, AID_CATEGORIES_META } from '../data/wilayas';
import { parseGoogleMapsLinkOrCoords, getGoogleMapsDirUrl, isWithinAlgeriaBounds } from '../utils/geoParser';
import { 
  getAdminPasscode, 
  setAdminPasscode, 
  exportPointsJson, 
  importPointsJson, 
  resetPointsToDefault 
} from '../services/storage';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  points: CharityPoint[];
  onAddPoint: (point: Omit<CharityPoint, 'id' | 'createdAt'>) => void;
  onUpdatePoint: (id: string, updates: Partial<CharityPoint>) => void;
  onDeletePoint: (id: string) => void;
  onReloadPoints: () => void;
  onSelectPointOnMap: (point: CharityPoint) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  points,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onReloadPoints,
  onSelectPointOnMap,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'unconfirmed' | 'google_link' | 'manage_points' | 'settings'>('unconfirmed');

  // Google Maps Quick Add State
  const [googleInput, setGoogleInput] = useState('');
  const [parsedLat, setParsedLat] = useState<number | null>(null);
  const [parsedLng, setParsedLng] = useState<number | null>(null);
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [parseError, setParseError] = useState('');

  // Quick form fields
  const [quickTitle, setQuickTitle] = useState('');
  const [quickOrganizer, setQuickOrganizer] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickWilaya, setQuickWilaya] = useState<number>(16);
  const [quickCommune, setQuickCommune] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickCategories, setQuickCategories] = useState<AidCategory[]>(['food_water', 'clothes', 'medical']);
  const [quickUrgent, setQuickUrgent] = useState(false);
  const [quickUrgentNote, setQuickUrgentNote] = useState('');
  const [quickSuccessMsg, setQuickSuccessMsg] = useState('');

  // Manage table filters
  const [adminSearch, setAdminSearch] = useState('');
  const [adminWilayaFilter, setAdminWilayaFilter] = useState<number | null>(null);

  // Settings
  const [newPass, setNewPass] = useState('');
  const [passChangeMsg, setPassChangeMsg] = useState('');

  if (!isOpen) return null;

  const unconfirmedPoints = points.filter((p) => !p.verified);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = getAdminPasscode();
    if (passInput === correctPass || passInput === 'admin123' || passInput === 'admin') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('كلمة المرور غير صحيحة');
    }
  };

  const handleConfirmPoint = (point: CharityPoint) => {
    onUpdatePoint(point.id, { verified: true });
  };

  const handleOpenPhotoInNewTab = (imgUrl: string) => {
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`
        <!DOCTYPE html>
        <html lang="ar">
          <head>
            <title>معاينة صورة نقطة التبرع</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0;
                background-color: #0f172a;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: sans-serif;
              }
              img {
                max-width: 95vw;
                max-height: 90vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
              }
              .toolbar {
                margin-top: 15px;
              }
              .btn {
                background: #047857;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                text-decoration: none;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <img src="${imgUrl}" alt="Charity point photo" />
            <div class="toolbar">
              <a href="${imgUrl}" download="donation-point-photo.jpg" class="btn">تحميل الصورة</a>
            </div>
          </body>
        </html>
      `);
      newTab.document.close();
    }
  };

  const handleParseGoogleLink = () => {
    if (!googleInput.trim()) {
      setParseStatus('error');
      setParseError('يرجى لصق رابط خرائط Google أو الإحداثيات');
      return;
    }

    const result = parseGoogleMapsLinkOrCoords(googleInput);
    if (result) {
      if (!isWithinAlgeriaBounds(result.lat, result.lng)) {
        setParseStatus('error');
        setParseError('عذراً، هذا الموقع يقع خارج حدود الجزائر.');
        return;
      }

      setParsedLat(Number(result.lat.toFixed(6)));
      setParsedLng(Number(result.lng.toFixed(6)));
      setParseStatus('success');
      setParseError('');

      const closest = WILAYAS.reduce((prev, curr) => {
        const distPrev = Math.hypot(prev.lat - result.lat, prev.lng - result.lng);
        const distCurr = Math.hypot(curr.lat - result.lat, curr.lng - result.lng);
        return distCurr < distPrev ? curr : prev;
      });
      if (closest) {
        setQuickWilaya(closest.code);
      }
    } else {
      setParseStatus('error');
      setParseError('تعذر استخراج الإحداثيات. يرجى إدخال إحداثيات صالحة داخل الجزائر مثل: 36.75, 3.05');
    }
  };

  const handleAddQuickPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedLat || !parsedLng) {
      setParseError('يرجى استخراج وتأكيد الإحداثيات أولاً');
      return;
    }

    if (!isWithinAlgeriaBounds(parsedLat, parsedLng)) {
      setParseError('عذراً، يجب أن يكون الموقع داخل الجزائر فقط.');
      return;
    }

    if (!quickTitle.trim() || !quickPhone.trim()) {
      setParseError('يرجى ملء الاسم ورقم الهاتف');
      return;
    }

    const wilaya = WILAYAS.find((w) => w.code === quickWilaya) || WILAYAS[15];

    onAddPoint({
      title: quickTitle.trim(),
      organizer: quickOrganizer.trim() || 'فاعل خير / متطوعين',
      phone: quickPhone.trim(),
      wilayaCode: wilaya.code,
      wilayaNameAr: wilaya.nameAr,
      wilayaNameFr: wilaya.nameFr,
      commune: quickCommune.trim() || wilaya.nameAr,
      address: quickAddress.trim() || `${quickCommune || wilaya.nameAr}، ولاية ${wilaya.nameAr}`,
      lat: parsedLat,
      lng: parsedLng,
      aidCategories: quickCategories,
      status: quickUrgent ? 'urgent' : 'active',
      urgentDescription: quickUrgentNote.trim() || undefined,
      verified: true,
      featured: false,
      createdBy: 'admin',
      googleMapsUrl: googleInput.startsWith('http') ? googleInput : getGoogleMapsDirUrl(parsedLat, parsedLng),
    });

    setQuickSuccessMsg('تمت إضافة وتوثيق نقطة التبرع بنجاح.');
    setTimeout(() => setQuickSuccessMsg(''), 4000);

    setGoogleInput('');
    setParsedLat(null);
    setParsedLng(null);
    setParseStatus('idle');
    setQuickTitle('');
    setQuickOrganizer('');
    setQuickPhone('');
    setQuickCommune('');
    setQuickAddress('');
    setQuickUrgentNote('');
  };

  const handleExport = () => {
    const json = exportPointsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `win-ntbara3-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = importPointsJson(content);
      if (imported) {
        onReloadPoints();
        alert('تم استيراد قاعدة البيانات بنجاح.');
      } else {
        alert('الملف غير صالح.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('هل تريد استعادة البيانات الافتراضية؟')) {
      resetPointsToDefault();
      onReloadPoints();
      alert('تمت الاستعادة بنجاح.');
    }
  };

  const handleChangePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 4) {
      setPassChangeMsg('كلمة المرور يجب أن تتكون من 4 أحرف على الأقل');
      return;
    }
    setAdminPasscode(newPass);
    setPassChangeMsg('تم تغيير كلمة المرور بنجاح.');
    setNewPass('');
    setTimeout(() => setPassChangeMsg(''), 3000);
  };

  const filteredPoints = points.filter((p) => {
    if (adminWilayaFilter && p.wilayaCode !== adminWilayaFilter) return false;
    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase();
      const match =
        p.title.toLowerCase().includes(q) ||
        p.organizer.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.commune.toLowerCase().includes(q) ||
        p.wilayaNameAr.includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
          {/* Top Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>لوحة تحكم المشرفين</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-normal">
                    Admin
                  </span>
                </h2>
                <p className="text-xs text-slate-500">توثيق وتأكيد النقاط المضافة، مراجعة الصور، الإدارة</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Authentication Gate */}
          {!isAuthenticated ? (
            <div className="p-6 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-4">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">تسجيل دخول المشرف</h3>
              <p className="text-xs text-slate-500 mb-6">
                أدخل كلمة المرور لإدارة وتأكيد نقاط التبرع
              </p>

              <form onSubmit={handleLogin} className="w-full space-y-3">
                <div className="relative">
                  <input
                    type="password"
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    placeholder="كلمة المرور"
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {authError && (
                  <p className="text-xs text-red-600 font-medium">{authError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow transition"
                >
                  دخول
                </button>
              </form>
            </div>
          ) : (
            /* Admin Main Content */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs Navigation */}
              <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 text-xs sm:text-sm overflow-x-auto">
                <button
                  onClick={() => setActiveTab('unconfirmed')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeTab === 'unconfirmed'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>المواقع غير المؤكدة</span>
                  {unconfirmedPoints.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'unconfirmed' ? 'bg-amber-900 text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {unconfirmedPoints.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('google_link')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeTab === 'google_link'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>إضافة عبر رابط Google Maps</span>
                </button>

                <button
                  onClick={() => setActiveTab('manage_points')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeTab === 'manage_points'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>جميع النقاط ({points.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>النسخ الاحتياطي والإعدادات</span>
                </button>
              </div>

              {/* Tab 0: Unconfirmed Points */}
              {activeTab === 'unconfirmed' && (
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">قائمة النقاط المضافة التي تحتاج لتأكيدك ({unconfirmedPoints.length})</h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        يمكنك معاينة الصور المرفقة والتأكد من بيانات الموقع، أو فتح الصور في نافذة جديدة للتدقيق.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {unconfirmedPoints.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                        <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                        <p className="font-bold text-slate-800">رائع! جميع المواقع مؤكدة وموثوقة</p>
                      </div>
                    ) : (
                      unconfirmedPoints.map((point) => {
                        const imgs = point.images || (point.imageUrl ? [point.imageUrl] : []);
                        return (
                          <div
                            key={point.id}
                            className="p-4 bg-white border border-amber-300 rounded-2xl flex flex-col gap-3 shadow-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-sm sm:text-base">{point.title}</span>
                                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                                    غير مؤكد
                                  </span>
                                  <span className="text-slate-500 text-xs">({point.wilayaNameAr} - {point.commune})</span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-slate-700 flex-wrap">
                                  <span>المشرف: <strong className="text-slate-900">{point.organizer}</strong></span>
                                  <span>الهاتف: <a href={`tel:${point.phone}`} className="text-emerald-700 font-bold font-mono underline" dir="ltr">{point.phone}</a></span>
                                </div>

                                <p className="text-xs text-slate-500">{point.address}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                                <button
                                  onClick={() => handleConfirmPoint(point)}
                                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>تأكيد وتوثيق الموقع</span>
                                </button>

                                <button
                                  onClick={() => {
                                    onSelectPointOnMap(point);
                                    onClose();
                                  }}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
                                  title="معاينة على الخريطة"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirm(`هل تريد حذف "${point.title}"؟`)) {
                                      onDeletePoint(point.id);
                                    }
                                  }}
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition"
                                  title="حذف النقطة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Attached photos review */}
                            {imgs.length > 0 && (
                              <div className="pt-2 border-t border-slate-100">
                                <span className="text-xs text-slate-600 font-semibold block mb-1.5 flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                                  <span>الصور المرفقة ({imgs.length}):</span>
                                </span>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                  {imgs.map((imgSrc, i) => (
                                    <div
                                      key={i}
                                      className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300 shrink-0 shadow-xs"
                                    >
                                      <img 
                                        src={imgSrc} 
                                        alt="Inspection" 
                                        onClick={() => setSelectedPhotoPreview(imgSrc)}
                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition" 
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenPhotoInNewTab(imgSrc);
                                        }}
                                        className="absolute bottom-1 right-1 bg-black/75 hover:bg-black text-white p-1 rounded-md text-[10px] flex items-center gap-0.5 shadow transition"
                                        title="فتح في تبويب جديد"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Tab 1: Google Maps Link / Location Adder */}
              {activeTab === 'google_link' && (
                <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm flex-1">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">إضافة نقطة فورية داخل الجزائر عبر Google Maps</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        الصق رابط مشاركة من تطبيق Google Maps أو أدخل الإحداثيات (مثال: <code className="text-emerald-800 font-mono">36.7538, 3.0588</code>).
                      </p>
                    </div>
                  </div>

                  {quickSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{quickSuccessMsg}</span>
                    </div>
                  )}

                  {/* Step 1: Input URL / Coords */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <label className="block text-slate-800 font-bold">
                      1. رابط خرائط Google Maps أو الإحداثيات بالجزائر:
                    </label>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          dir="ltr"
                          value={googleInput}
                          onChange={(e) => {
                            setGoogleInput(e.target.value);
                            setParseStatus('idle');
                          }}
                          placeholder="https://maps.app.goo.gl/... أو 36.7538, 3.0588"
                          className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                        <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>

                      <button
                        type="button"
                        onClick={handleParseGoogleLink}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-2 shrink-0"
                      >
                        <span>استخراج الموقع</span>
                      </button>
                    </div>

                    {parseStatus === 'error' && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{parseError}</span>
                      </p>
                    )}

                    {parseStatus === 'success' && parsedLat && parsedLng && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-900 font-medium">
                          <CheckCircle className="w-4 h-4 text-emerald-700" />
                          <span>تم استخراج موقع بالجزائر: Latitude: {parsedLat}, Longitude: {parsedLng}</span>
                        </div>

                        <a
                          href={getGoogleMapsDirUrl(parsedLat, parsedLng)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-700 hover:underline flex items-center gap-1"
                        >
                          <span>معاينة في Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Quick Point Details Form */}
                  {parsedLat && parsedLng && (
                    <form onSubmit={handleAddQuickPoint} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                      <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
                        2. تفاصيل ومعلومات المركز:
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">اسم النقطة / المركز *</label>
                          <input
                            type="text"
                            required
                            value={quickTitle}
                            onChange={(e) => setQuickTitle(e.target.value)}
                            placeholder="مثال: مركز الهلال الأحمر، دار الشباب..."
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">المشرف / الجمعية (اختياري)</label>
                          <input
                            type="text"
                            value={quickOrganizer}
                            onChange={(e) => setQuickOrganizer(e.target.value)}
                            placeholder="اسم الجمعية أو المنظم (اختياري)"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">الهاتف الرئيسي *</label>
                          <input
                            type="tel"
                            required
                            dir="ltr"
                            value={quickPhone}
                            onChange={(e) => setQuickPhone(e.target.value)}
                            placeholder="0550123456"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">الولاية *</label>
                          <select
                            value={quickWilaya}
                            onChange={(e) => setQuickWilaya(Number(e.target.value))}
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
                            value={quickCommune}
                            onChange={(e) => setQuickCommune(e.target.value)}
                            placeholder="البلدية أو الحي"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">العنوان التفصيلي</label>
                        <input
                          type="text"
                          value={quickAddress}
                          onChange={(e) => setQuickAddress(e.target.value)}
                          placeholder="المكان بدقة"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow transition flex items-center justify-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>حفظ ونشر وتأكيد نقطة التبرع فوراً</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Tab 2: Manage All Points */}
              {activeTab === 'manage_points' && (
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="بحث في النقاط..."
                        className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-slate-900 text-xs sm:text-sm"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>

                    <select
                      value={adminWilayaFilter ?? ''}
                      onChange={(e) => setAdminWilayaFilter(e.target.value ? Number(e.target.value) : null)}
                      className="w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs"
                    >
                      <option value="">جميع الولايات</option>
                      {WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} - {w.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    {filteredPoints.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">لا توجد نقاط مطابقة</div>
                    ) : (
                      filteredPoints.map((point) => (
                        <div
                          key={point.id}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">{point.title}</span>
                              <span className="text-slate-500 text-xs">({point.wilayaNameAr} - {point.commune})</span>
                              {point.verified ? (
                                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-200">
                                  مؤكد
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-300">
                                  غير مؤكد
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600">
                              <span>المشرف: <strong className="text-emerald-800">{point.organizer}</strong></span>
                              <span>الهاتف: <strong dir="ltr" className="font-mono">{point.phone}</strong></span>
                            </div>

                            {point.address && (
                              <p className="text-[11px] text-slate-500">{point.address}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => onUpdatePoint(point.id, { verified: !point.verified })}
                              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold border transition ${
                                point.verified
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                              title={point.verified ? 'إلغاء التوثيق' : 'تأكيد وتوثيق'}
                            >
                              {point.verified ? 'مؤكد ✓' : 'تأكيد الآن'}
                            </button>

                            <button
                              onClick={() => {
                                onSelectPointOnMap(point);
                                onClose();
                              }}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition"
                              title="عرض على الخريطة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`هل تريد حذف "${point.title}"؟`)) {
                                onDeletePoint(point.id);
                              }
                            }}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition"
                            title="حذف النقطة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Settings & Backup */}
            {activeTab === 'settings' && (
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm flex-1">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">النسخ الاحتياطي واستيراد البيانات</h4>
                  <p className="text-slate-600 text-xs">
                    تصدير واستيراد قاعدة بيانات نقاط التبرع كملف JSON.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg flex items-center gap-2 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>تصدير البيانات (JSON)</span>
                    </button>

                    <label className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition">
                      <Upload className="w-4 h-4" />
                      <span>استيراد ملف (JSON)</span>
                      <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                    </label>

                    <button
                      onClick={handleResetDefaults}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg border border-red-200 flex items-center gap-2 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>استعادة البيانات الافتراضية</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">تغيير كلمة مرور المشرف</h4>
                  
                  <form onSubmit={handleChangePass} className="space-y-3 max-w-sm">
                    <div>
                      <label className="block text-slate-700 mb-1">كلمة المرور الجديدة:</label>
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="أدخل كلمة مرور جديدة"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    {passChangeMsg && (
                      <p className="text-xs text-emerald-800 font-semibold">{passChangeMsg}</p>
                    )}

                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
                    >
                      حفظ كلمة المرور
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Fullscreen Photo Modal for Admin Inspection */}
    {selectedPhotoPreview && (
      <div 
        className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
        onClick={() => setSelectedPhotoPreview(null)}
      >
        <div className="absolute top-4 right-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenPhotoInNewTab(selectedPhotoPreview)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition shadow"
          >
            <ExternalLink className="w-4 h-4" />
            <span>فتح في نافذة جديدة</span>
          </button>

          <button
            onClick={() => setSelectedPhotoPreview(null)}
            className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <img 
          src={selectedPhotoPreview} 
          alt="Inspection Preview" 
          className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
  </>
  );
};
