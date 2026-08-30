import React, { useState, useRef } from 'react';
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
  Image as ImageIcon,
  Flame,
  Camera,
  Loader2,
  Edit,
  HeartHandshake,
  LogOut,
  CloudUpload,
  PlusCircle,
  Sparkles,
  Building2,
  Navigation
} from 'lucide-react';
import { CharityPoint, AidCategory, PointStatus, PointType } from '../types';
import { WILAYAS, AID_CATEGORIES_META } from '../data/wilayas';
import { parseGoogleMapsLinkOrCoords, getGoogleMapsDirUrl, isWithinAlgeriaBounds, isPlusCode, resolvePlusCode } from '../utils/geoParser';
import { compressImageFile, compressBase64Image } from '../utils/imageCompressor';
import { bulkExportAllLocalPointsToD1 } from '../services/apiService';
import { 
  getAdminPasscode, 
  setAdminPasscode, 
  verifyAdminPassword,
  exportPointsJson, 
  importPointsJson, 
  resetPointsToDefault,
  isAdminAuthenticated,
  setAdminAuthenticated
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
  onEditPoint?: (point: CharityPoint) => void;
  onAdminAuthChange?: (isAuth: boolean) => void;
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
  onEditPoint,
  onAdminAuthChange,
}) => {
  if (!isOpen) return null;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isAdminAuthenticated());
  const [passInput, setPassInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Tabs: charity_hubs | add_custom | fire_zones | quick_add | settings
  const [activeTab, setActiveTab] = useState<'charity_hubs' | 'add_custom' | 'fire_zones' | 'quick_add' | 'settings'>('charity_hubs');

  // Search & Filters
  const [adminSearch, setAdminSearch] = useState('');
  const [adminWilayaFilter, setAdminWilayaFilter] = useState<number | null>(null);

  // Custom Hub Form State (PC-First)
  const [customTitle, setCustomTitle] = useState('');
  const [customOrganizer, setCustomOrganizer] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customAltPhone, setCustomAltPhone] = useState('');
  const [customWilaya, setCustomWilaya] = useState<number>(16);
  const [customCommune, setCustomCommune] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customCoordsInput, setCustomCoordsInput] = useState('');
  const [customLat, setCustomLat] = useState<number | null>(null);
  const [customLng, setCustomLng] = useState<number | null>(null);
  const [customCategories, setCustomCategories] = useState<AidCategory[]>(['food_water', 'clothes', 'medical']);
  const [customStatus, setCustomStatus] = useState<PointStatus>('active');
  const [customPointType, setCustomPointType] = useState<PointType>('charity_hub');
  const [customVerified, setCustomVerified] = useState(true);
  const [customHours, setCustomHours] = useState('08:00 - 18:00');
  const [customNotes, setCustomNotes] = useState('');
  const [customPhotos, setCustomPhotos] = useState<string[]>([]);
  const [customSuccessMsg, setCustomSuccessMsg] = useState('');
  const [customError, setCustomError] = useState('');
  const [customImageLoading, setCustomImageLoading] = useState(false);
  const customFileInputRef = useRef<HTMLInputElement>(null);

  // Burnt Zone Form State
  const [burntTitle, setBurntTitle] = useState('');
  const [burntWilaya, setBurntWilaya] = useState<number>(15);
  const [burntCommune, setBurntCommune] = useState('');
  const [burntAddress, setBurntAddress] = useState('');
  const [burntPhone, setBurntPhone] = useState('');
  const [burntCoordinator, setBurntCoordinator] = useState('');
  const [burntNeeds, setBurntNeeds] = useState('');
  const [burntCoordsInput, setBurntCoordsInput] = useState('');
  const [burntLat, setBurntLat] = useState<number | null>(null);
  const [burntLng, setBurntLng] = useState<number | null>(null);
  const [burntStatus, setBurntStatus] = useState<PointStatus>('urgent');
  const [burntSuccessMsg, setBurntSuccessMsg] = useState('');
  const [burntError, setBurntError] = useState('');

  // Quick Google Add State
  const [googleInput, setGoogleInput] = useState('');
  const [parsedLat, setParsedLat] = useState<number | null>(null);
  const [parsedLng, setParsedLng] = useState<number | null>(null);
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [parseError, setParseError] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickOrganizer, setQuickOrganizer] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickWilaya, setQuickWilaya] = useState<number>(16);
  const [quickCommune, setQuickCommune] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [quickCategories, setQuickCategories] = useState<AidCategory[]>(['food_water', 'clothes', 'medical']);
  const [quickPhotos, setQuickPhotos] = useState<string[]>([]);
  const [quickSuccessMsg, setQuickSuccessMsg] = useState('');
  const [parsingLoading, setParsingLoading] = useState(false);
  const [quickImageLoading, setQuickImageLoading] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync State
  const [syncingPointId, setSyncingPointId] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string>('');

  // Settings
  const [newPass, setNewPass] = useState('');
  const [passChangeMsg, setPassChangeMsg] = useState('');

  // Bulk Cloud Sync State
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [bulkSyncProgress, setBulkSyncProgress] = useState('');
  const [bulkSyncResult, setBulkSyncResult] = useState('');

  const handleBulkSyncToD1 = async () => {
    setIsBulkSyncing(true);
    setBulkSyncResult('');
    setBulkSyncProgress('0/' + points.length);

    try {
      const res = await bulkExportAllLocalPointsToD1(points, (curr, total) => {
        setBulkSyncProgress(`${curr}/${total}`);
      });
      setBulkSyncResult(`✅ تم تصدير ${res.success} نقطة إلى قاعدة بيانات السحابة بنجاح!`);
      setTimeout(() => {
        onReloadPoints();
      }, 1000);
    } catch (e: any) {
      setBulkSyncResult('❌ حدث خطأ: ' + (e?.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const charityPoints = points.filter((p) => p.pointType !== 'burnt_zone');
  const firePoints = points.filter((p) => p.pointType === 'burnt_zone');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(passInput)) {
      setAdminAuthenticated(true, passInput.trim());
      setIsAuthenticated(true);
      onAdminAuthChange?.(true);
      setAuthError('');
    } else {
      setAuthError('كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
    onAdminAuthChange?.(false);
  };

  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCustomImageLoading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const compressed = await compressImageFile(files[i], 550, 450, 0.55);
        newImages.push(compressed);
      }
      setCustomPhotos((prev) => [...prev, ...newImages].slice(0, 3));
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setCustomImageLoading(false);
      if (customFileInputRef.current) customFileInputRef.current.value = '';
    }
  };

  const handleResolveCustomCoords = async () => {
    setCustomError('');
    if (!customCoordsInput.trim()) return;

    if (isPlusCode(customCoordsInput)) {
      const wilaya = WILAYAS.find((w) => w.code === customWilaya);
      const res = await resolvePlusCode(customCoordsInput, wilaya?.lat, wilaya?.lng);
      if (res) {
        setCustomLat(Number(res.lat.toFixed(6)));
        setCustomLng(Number(res.lng.toFixed(6)));
        return;
      }
    }

    const parsed = parseGoogleMapsLinkOrCoords(customCoordsInput);
    if (parsed && isWithinAlgeriaBounds(parsed.lat, parsed.lng)) {
      setCustomLat(Number(parsed.lat.toFixed(6)));
      setCustomLng(Number(parsed.lng.toFixed(6)));
      return;
    }

    if (customCoordsInput.includes('http')) {
      try {
        const res = await fetch(`/api/resolve-google-maps?url=${encodeURIComponent(customCoordsInput.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.lat && data.lng && isWithinAlgeriaBounds(data.lat, data.lng)) {
            setCustomLat(Number(data.lat.toFixed(6)));
            setCustomLng(Number(data.lng.toFixed(6)));
            if (data.title && !customTitle) setCustomTitle(data.title.split('+').join(' ').trim());
            if (data.phone && !customPhone) setCustomPhone(data.phone);
            if (data.address && !customAddress) setCustomAddress(data.address);
            if (data.commune && !customCommune) setCustomCommune(data.commune);
            return;
          }
        }
      } catch {}
    }

    setCustomError('تعذر استخراج الإحداثيات، يرجى كتابة إحداثيات (lat, lng) أو كود Plus Code أو رابط Google Maps');
  };

  const handleAddCustomHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customPhone.trim()) {
      setCustomError('يرجى كتابة اسم المركز ورقم الهاتف');
      return;
    }

    const wilaya = WILAYAS.find((w) => w.code === customWilaya) || WILAYAS[15];
    const lat = customLat ?? wilaya.lat;
    const lng = customLng ?? wilaya.lng;

    const compressedPhotos: string[] = [];
    for (const p of customPhotos) {
      if (p.startsWith('data:image')) {
        const c = await compressBase64Image(p, 550, 450, 0.55);
        compressedPhotos.push(c);
      } else {
        compressedPhotos.push(p);
      }
    }

    onAddPoint({
      title: customTitle.trim(),
      organizer: customOrganizer.trim() || 'فاعل خير / متطوعين',
      phone: customPhone.trim(),
      altPhone: customAltPhone.trim() || undefined,
      wilayaCode: wilaya.code,
      wilayaNameAr: wilaya.nameAr,
      wilayaNameFr: wilaya.nameFr,
      commune: customCommune.trim() || wilaya.nameAr,
      address: customAddress.trim() || `${customCommune || wilaya.nameAr}، ولاية ${wilaya.nameAr}`,
      lat,
      lng,
      aidCategories: customCategories,
      status: customStatus,
      pointType: customPointType,
      verified: customVerified,
      hours: customHours.trim() || undefined,
      notes: customNotes.trim() || undefined,
      images: compressedPhotos.length > 0 ? compressedPhotos : undefined,
      imageUrl: compressedPhotos.length > 0 ? compressedPhotos[0] : undefined,
      createdBy: 'admin',
      googleMapsUrl: customCoordsInput.includes('http') ? customCoordsInput.trim() : getGoogleMapsDirUrl(lat, lng, customTitle),
    });

    setCustomSuccessMsg(`تمت إضافة ونشر مركز "${customTitle}" في قاعدة البيانات السحابية بنجاح!`);
    setTimeout(() => setCustomSuccessMsg(''), 4000);

    setCustomTitle('');
    setCustomOrganizer('');
    setCustomPhone('');
    setCustomAltPhone('');
    setCustomCommune('');
    setCustomAddress('');
    setCustomCoordsInput('');
    setCustomLat(null);
    setCustomLng(null);
    setCustomNotes('');
    setCustomPhotos([]);
  };

  const handleQuickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setQuickImageLoading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const compressed = await compressImageFile(files[i], 800, 600, 0.7);
        newImages.push(compressed);
      }
      setQuickPhotos((prev) => [...prev, ...newImages].slice(0, 3));
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setQuickImageLoading(false);
      if (quickFileInputRef.current) quickFileInputRef.current.value = '';
    }
  };

  const handleBurntCoordsParse = () => {
    setBurntError('');
    const parsed = parseGoogleMapsLinkOrCoords(burntCoordsInput);
    if (!parsed) {
      setBurntError('تعذر استخراج الإحداثيات، يرجى التأكد من الرابط أو إدخال (lat, lng)');
      return;
    }
    if (!isWithinAlgeriaBounds(parsed.lat, parsed.lng)) {
      setBurntError('الموقع يقع خارج حدود الجزائر');
      return;
    }
    setBurntLat(Number(parsed.lat.toFixed(6)));
    setBurntLng(Number(parsed.lng.toFixed(6)));
    const closest = WILAYAS.reduce((prev, curr) => {
      const distPrev = Math.hypot(prev.lat - parsed.lat, prev.lng - parsed.lng);
      const distCurr = Math.hypot(curr.lat - parsed.lat, curr.lng - parsed.lng);
      return distCurr < distPrev ? curr : prev;
    });
    if (closest) setBurntWilaya(closest.code);
  };

  const handleAddBurntZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!burntLat || !burntLng) {
      setBurntError('يرجى تحديد وتأكيد موقع الحريق أولاً');
      return;
    }
    if (!burntTitle.trim() || !burntCommune.trim()) {
      setBurntError('يرجى ملء اسم المنطقة والبلدية');
      return;
    }

    const wilaya = WILAYAS.find((w) => w.code === burntWilaya) || WILAYAS[14];

    onAddPoint({
      title: burntTitle.trim(),
      organizer: burntCoordinator.trim() || 'خلية إغاثة المتضررين والحماية المدنية',
      phone: burntPhone.trim() || '14',
      wilayaCode: wilaya.code,
      wilayaNameAr: wilaya.nameAr,
      wilayaNameFr: wilaya.nameFr,
      commune: burntCommune.trim(),
      address: burntAddress.trim() || `${burntCommune}، ولاية ${wilaya.nameAr}`,
      lat: burntLat,
      lng: burntLng,
      aidCategories: ['food_water', 'medical', 'blankets', 'shelter', 'clothes'],
      status: burntStatus,
      pointType: 'burnt_zone',
      urgentDescription: burntNeeds.trim() || (burntStatus === 'extinguished' ? 'تم إخماد الحريق والسيطرة عليه.' : 'منطقة متضررة من الحرائق بحاجة لإغاثة ومساعدات عاجلة.'),
      verified: true,
      featured: true,
      createdBy: 'admin',
      googleMapsUrl: getGoogleMapsDirUrl(burntLat, burntLng),
    });

    setBurntSuccessMsg('تمت إضافة المنطقة بنجاح.');
    setTimeout(() => setBurntSuccessMsg(''), 4000);
    setBurntTitle('');
    setBurntCommune('');
    setBurntAddress('');
    setBurntPhone('');
    setBurntCoordinator('');
    setBurntNeeds('');
    setBurntCoordsInput('');
    setBurntLat(null);
    setBurntLng(null);
  };

  const handleParseGoogleLink = async () => {
    if (!googleInput.trim()) return;
    setParsingLoading(true);
    setParseError('');

    try {
      const res = await fetch(`/api/resolve-google-maps?url=${encodeURIComponent(googleInput.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lng) {
          if (!isWithinAlgeriaBounds(data.lat, data.lng)) {
            setParseStatus('error');
            setParseError('الموقع يقع خارج حدود الجزائر.');
            setParsingLoading(false);
            return;
          }

          setParsedLat(Number(data.lat.toFixed(6)));
          setParsedLng(Number(data.lng.toFixed(6)));
          setParseStatus('success');

          if (data.title) {
            const cleanTitle = data.title.split('+').join(' ').replace(/\s+/g, ' ').trim();
            setQuickTitle(cleanTitle);
          }
          if (data.phone) setQuickPhone(data.phone);
          if (data.address) setQuickAddress(data.address);
          if (data.commune) setQuickCommune(data.commune);
          if (data.photos && data.photos.length > 0) setQuickPhotos(data.photos);

          const closest = WILAYAS.reduce((prev, curr) => {
            const distPrev = Math.hypot(prev.lat - data.lat, prev.lng - data.lng);
            const distCurr = Math.hypot(curr.lat - data.lat, curr.lng - data.lng);
            return distCurr < distPrev ? curr : prev;
          });
          if (closest) {
            setQuickWilaya(closest.code);
            if (!data.commune) setQuickCommune(closest.nameAr);
          }

          setParsingLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend resolver failed:', e);
    }

    // Fallback
    const result = parseGoogleMapsLinkOrCoords(googleInput);
    if (result && isWithinAlgeriaBounds(result.lat, result.lng)) {
      setParsedLat(Number(result.lat.toFixed(6)));
      setParsedLng(Number(result.lng.toFixed(6)));
      setParseStatus('success');
    } else {
      setParseStatus('error');
      setParseError('تعذر استخراج البيانات من الرابط.');
    }
    setParsingLoading(false);
  };

  const handleAddQuickPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedLat || !parsedLng || !quickTitle.trim() || !quickPhone.trim()) {
      setParseError('يرجى التأكد من ملء الاسم ورقم الهاتف والإحداثيات');
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
      status: 'active',
      pointType: 'charity_hub',
      notes: quickNotes.trim() || undefined,
      verified: true,
      featured: false,
      createdBy: 'admin',
      images: quickPhotos.length > 0 ? quickPhotos : undefined,
      googleMapsUrl: googleInput.startsWith('http') ? googleInput : getGoogleMapsDirUrl(parsedLat, parsedLng),
    });

    setQuickSuccessMsg('تمت إضافة وتوثيق المركز بنجاح.');
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
    setQuickNotes('');
    setQuickPhotos([]);
  };

  const handleResyncPoint = async (point: CharityPoint) => {
    const targetLink = point.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
    setSyncingPointId(point.id);
    setSyncSuccessMsg('');

    try {
      const res = await fetch(`/api/resolve-google-maps?url=${encodeURIComponent(targetLink)}`);
      if (res.ok) {
        const data = await res.json();
        const updates: Partial<CharityPoint> = {};

        if (data.title) updates.title = data.title.split('+').join(' ').replace(/\s+/g, ' ').trim();
        if (data.lat && data.lng) {
          updates.lat = data.lat;
          updates.lng = data.lng;
        }
        if (data.address) updates.address = data.address;
        if (data.commune) updates.commune = data.commune;
        if (data.phone && (!point.phone || point.phone === '0550000000')) updates.phone = data.phone;
        if (data.photos && data.photos.length > 0) {
          updates.images = data.photos;
          updates.imageUrl = data.photos[0];
        }

        onUpdatePoint(point.id, updates);
        setSyncSuccessMsg(`تمت مزامنة وتحديث "${updates.title || point.title}" بنجاح.`);
        setTimeout(() => setSyncSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error('Resync error:', e);
    } finally {
      setSyncingPointId(null);
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

  const filterList = (list: CharityPoint[]) => {
    return list.filter((p) => {
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
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col overflow-hidden animate-in fade-in duration-150">
      {/* Light Mode Clean Header */}
      <header className="px-4 sm:px-8 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900">لوحة تحكم المشرفين</h1>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-slate-500">إدارة وتعديل مراكز التبرع، مناطق الحرائق، والمزامنة السحابية</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 transition active:scale-95 flex items-center gap-1.5 text-xs font-bold"
              title="تسجيل الخروج من لوحة التحكم"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل خروج</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="إغلاق والعودة للموقع"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">إغلاق اللوحة</span>
          </button>
        </div>
      </header>

      {/* Main Light Container */}
      <div className="flex-1 flex flex-col overflow-hidden max-w-7xl w-full mx-auto p-3 sm:p-6">
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">تسجيل دخول الإدارة</h3>
                <p className="text-xs text-slate-600">
                  أدخل كلمة المرور للوصول إلى أدوات تعديل النقاط وإدارة الحرائق
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    placeholder="كلمة المرور"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-center tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                {authError && <p className="text-xs text-red-600 font-medium">{authError}</p>}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition active:scale-95 text-sm"
                >
                  دخول لوحة التحكم
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  إلغاء والعودة للخريطة
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            {/* Desktop Statistics Banner */}
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 shrink-0 flex items-center justify-between gap-4 flex-wrap border-b border-slate-800">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-slate-300">📊 إحصائيات المنظومة المباشرة:</span>
                <span className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>{charityPoints.length} مركز تبرع</span>
                </span>
                <span className="bg-blue-950/90 border border-blue-500/40 text-blue-300 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{charityPoints.filter(p => p.verified).length} مركز موثق</span>
                </span>
                <span className="bg-red-950/90 border border-red-500/40 text-red-300 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{firePoints.length} منطقة حرائق</span>
                </span>
                <span className="bg-purple-950/90 border border-purple-500/40 text-purple-300 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{new Set(points.map(p => p.wilayaCode)).size} ولاية مغطاة</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('add_custom')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ إضافة مركز مخصص</span>
                </button>
              </div>
            </div>

            {/* Clean Light Navigation Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('charity_hubs')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shrink-0 ${
                  activeTab === 'charity_hubs'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                <span>مراكز التبرع ({charityPoints.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('add_custom')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shrink-0 ${
                  activeTab === 'add_custom'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>➕ إضافة مركز مخصص</span>
              </button>

              <button
                onClick={() => setActiveTab('fire_zones')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shrink-0 ${
                  activeTab === 'fire_zones'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>مناطق الحرائق ({firePoints.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('quick_add')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shrink-0 ${
                  activeTab === 'quick_add'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>إضافة سريعة بالرابط</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>الإعدادات والمزامنة السحابية</span>
              </button>
            </div>

            {/* Notification Toast */}
            {syncSuccessMsg && (
              <div className="bg-emerald-50 border-b border-emerald-300 text-emerald-900 px-4 py-2 text-xs flex items-center justify-between font-medium">
                <span>{syncSuccessMsg}</span>
                <button onClick={() => setSyncSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">✕</button>
              </div>
            )}

            {/* TAB: ADD CUSTOM LOCATION (PC-FIRST RICH BUILDER) */}
            {activeTab === 'add_custom' && (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <form onSubmit={handleAddCustomHub} className="max-w-5xl mx-auto space-y-6">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-emerald-300" />
                        <h3 className="font-black text-base sm:text-lg">إضافة وتثبيت مركز تبرع مخصص</h3>
                      </div>
                      <p className="text-xs text-emerald-100/90">
                        نموذج مخصص للشاشات والكمبيوتر لإدخال بيانات دقيقة وإحداثيات Plus Codes ورفع الصور مباشرة إلى السحابة.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-white/20 px-3 py-1 rounded-full font-mono font-bold">
                        Cloudflare D1 Sync
                      </span>
                    </div>
                  </div>

                  {customSuccessMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
                      <span>{customSuccessMsg}</span>
                    </div>
                  )}

                  {customError && (
                    <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                      <span>{customError}</span>
                    </div>
                  )}

                  {/* 2-Column PC Layout Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: Location & Geo Data (col-span-7) */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* Section 1: Location & Coordinates */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-700" />
                            <span>1. الموقع الجغرافي والإحداثيات (Google Maps / Plus Code)</span>
                          </h4>
                          {customLat && customLng && (
                            <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-mono font-bold">
                              ✓ {customLat}, {customLng}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold text-xs mb-1.5">
                            أدخل رابط خرائط Google أو Plus Code (مثل <code className="bg-white px-1 py-0.5 rounded border border-slate-300">P29M+F3Q, Birkhadem</code>) أو إحداثيات:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customCoordsInput}
                              onChange={(e) => setCustomCoordsInput(e.target.value)}
                              placeholder="مثال: P29M+F3Q, Birkhadem أو رابط Google Maps"
                              className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                            <button
                              type="button"
                              onClick={handleResolveCustomCoords}
                              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition shrink-0 active:scale-95 flex items-center gap-1.5"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>تحديد الموقع</span>
                            </button>
                          </div>
                        </div>

                        {/* Wilaya & Commune */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-slate-700 font-semibold text-xs mb-1">الولاية *</label>
                            <select
                              value={customWilaya}
                              onChange={(e) => {
                                const code = Number(e.target.value);
                                setCustomWilaya(code);
                                const w = WILAYAS.find(x => x.code === code);
                                if (w && !customCommune) setCustomCommune(w.nameAr);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            >
                              {WILAYAS.map((w) => (
                                <option key={w.code} value={w.code}>
                                  {w.code} - {w.nameAr} ({w.nameFr})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-semibold text-xs mb-1">البلدية *</label>
                            <input
                              type="text"
                              required
                              value={customCommune}
                              onChange={(e) => setCustomCommune(e.target.value)}
                              placeholder="مثال: بئر خادم، الجزائر الوسطى..."
                              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold text-xs mb-1">العنوان التفصيلي أو أقرب معلم</label>
                          <input
                            type="text"
                            value={customAddress}
                            onChange={(e) => setCustomAddress(e.target.value)}
                            placeholder="مثال: بجانب ملحقة البلدية، شارع الإخوة زوطال..."
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>

                      {/* Section 2: Contact & Identity */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-700" />
                          <span>2. معلومات المركز والجهة المشرفة</span>
                        </h4>

                        <div>
                          <label className="block text-slate-700 font-semibold text-xs mb-1">اسم المركز أو نقطة التبرع *</label>
                          <input
                            type="text"
                            required
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="مثال: مركز تبرعات بئر خادم - الكشافة الإسلامية"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-semibold text-xs mb-1">الجهة المنظمة / الجمعية</label>
                            <input
                              type="text"
                              value={customOrganizer}
                              onChange={(e) => setCustomOrganizer(e.target.value)}
                              placeholder="مثال: الهلال الأحمر الجزائري، فوج الفداء..."
                              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-semibold text-xs mb-1">نوع المركز</label>
                            <select
                              value={customPointType}
                              onChange={(e) => setCustomPointType(e.target.value as PointType)}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            >
                              <option value="charity_hub">مركز جمع وتوزيع تبرعات</option>
                              <option value="blood_donation">مركز تبرع بالدم</option>
                              <option value="soup_kitchen">مطعم إطعام / إفطار صائم</option>
                              <option value="shelter_center">مركز إيواء ومساعدة عائلات</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-semibold text-xs mb-1">رقم الهاتف الرئيسي *</label>
                            <input
                              type="tel"
                              required
                              value={customPhone}
                              onChange={(e) => setCustomPhone(e.target.value)}
                              placeholder="مثال: 0672501414"
                              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-semibold text-xs mb-1">رقم هاتف إضافي (اختياري)</label>
                            <input
                              type="tel"
                              value={customAltPhone}
                              onChange={(e) => setCustomAltPhone(e.target.value)}
                              placeholder="مثال: 0550123456"
                              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Categories, Photos, Working Hours & Submit (col-span-5) */}
                    <div className="lg:col-span-5 space-y-5">
                      {/* Section 3: Categories */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                        <h4 className="font-bold text-slate-900 text-sm">3. أنواع التبرعات المقبولة</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {(Object.keys(AID_CATEGORIES_META) as AidCategory[]).map((cat) => {
                            const meta = AID_CATEGORIES_META[cat];
                            const selected = customCategories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  if (selected) {
                                    if (customCategories.length > 1) {
                                      setCustomCategories(customCategories.filter(c => c !== cat));
                                    }
                                  } else {
                                    setCustomCategories([...customCategories, cat]);
                                  }
                                }}
                                className={`p-2.5 rounded-xl border text-xs font-bold transition text-right flex items-center justify-between ${
                                  selected
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                                }`}
                              >
                                <span>{meta.labelAr}</span>
                                {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 4: Photos */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Camera className="w-4 h-4 text-emerald-700" />
                            <span>4. الصور المرفقة للمركز ({customPhotos.length}/3)</span>
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">حفظ في السحابة</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {customPhotos.map((img, idx) => (
                            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 bg-slate-100 group">
                              <img src={img} alt="مركز" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setCustomPhotos(customPhotos.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition shadow-sm"
                                title="حذف الصورة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {customPhotos.length < 3 && (
                            <button
                              type="button"
                              onClick={() => customFileInputRef.current?.click()}
                              disabled={customImageLoading}
                              className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white flex flex-col items-center justify-center text-slate-500 hover:text-emerald-700 transition"
                            >
                              {customImageLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  <Camera className="w-5 h-5 mb-0.5" />
                                  <span className="text-[10px] font-bold">+ إضافة صورة</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <input
                          ref={customFileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleCustomImageUpload}
                          className="hidden"
                        />
                      </div>

                      {/* Section 5: Hours, Status & Verification */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-semibold text-xs mb-1">أوقات العمل والاستقبال</label>
                            <input
                              type="text"
                              value={customHours}
                              onChange={(e) => setCustomHours(e.target.value)}
                              placeholder="مثال: 08:00 - 18:00"
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-semibold text-xs mb-1">حالة النقطة</label>
                            <select
                              value={customStatus}
                              onChange={(e) => setCustomStatus(e.target.value as PointStatus)}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            >
                              <option value="active">نشط ومستمر في الاستقبال</option>
                              <option value="urgent">عاجل وبحاجة ماسة للمساعدات</option>
                              <option value="completed">مكتمل ومكتفٍ حالياً</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold text-xs mb-1">ملاحظات وإرشادات للمتبرعين (اختياري)</label>
                          <textarea
                            rows={2}
                            value={customNotes}
                            onChange={(e) => setCustomNotes(e.target.value)}
                            placeholder="مثال: يرجى التنسيق هاتفياً قبل إحضار المواد القابلة للتلف..."
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>

                        {/* Verified Switch */}
                        <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span className="text-xs font-bold text-slate-900">توثيق النقطة (شارة موقع موثوق)</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={customVerified}
                            onChange={(e) => setCustomVerified(e.target.checked)}
                            className="w-5 h-5 accent-emerald-700 cursor-pointer rounded"
                          />
                        </div>
                      </div>

                      {/* Big Action Button */}
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 active:scale-98"
                      >
                        <CloudUpload className="w-5 h-5" />
                        <span>حفظ ونشر المركز في قاعدة البيانات السحابية فوراً 🚀</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 1: CHARITY HUBS */}
            {activeTab === 'charity_hubs' && (
              <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      placeholder="بحث في مراكز التبرع بالاسم، المشرف، الهاتف..."
                      className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-10 py-2.5 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <select
                    value={adminWilayaFilter ?? ''}
                    onChange={(e) => setAdminWilayaFilter(e.target.value ? Number(e.target.value) : null)}
                    className="w-full sm:w-auto bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 text-xs"
                  >
                    <option value="">جميع الولايات (69 ولاية)</option>
                    {WILAYAS.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} - {w.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {filterList(charityPoints).length === 0 ? (
                    <div className="text-center py-16 text-slate-400">لا توجد مراكز تبرع مطابقة</div>
                  ) : (
                    filterList(charityPoints).map((point) => (
                      <div
                        key={point.id}
                        className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm sm:text-base">{point.title}</span>
                            <span className="text-slate-600 text-xs">({point.wilayaNameAr} - {point.commune})</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              point.verified
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {point.verified ? 'مؤكد ✓' : 'غير مؤكد'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-600">
                            <span>المشرف: <strong className="text-slate-800">{point.organizer}</strong></span>
                            <span>الهاتف: <strong dir="ltr" className="font-mono text-emerald-700">{point.phone}</strong></span>
                          </div>

                          {point.address && <p className="text-[11px] text-slate-500">{point.address}</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => onEditPoint?.(point)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 transition flex items-center gap-1 text-xs font-bold"
                            title="تعديل بيانات النقطة"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          {/* Re-sync Button */}
                          <button
                            type="button"
                            onClick={() => handleResyncPoint(point)}
                            disabled={syncingPointId === point.id}
                            className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl border border-slate-300 transition"
                            title="مزامنة مع خرائط Google"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncingPointId === point.id ? 'animate-spin text-emerald-700' : ''}`} />
                          </button>

                          {/* Open in Google Maps */}
                          <a
                            href={point.googleMapsUrl || getGoogleMapsDirUrl(point.lat, point.lng, point.title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition flex items-center gap-1"
                            title="فتح في Google Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                          </a>

                          {/* View on Map */}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPointOnMap(point);
                              onClose();
                            }}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition"
                            title="عرض على الخريطة"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`هل تريد حذف "${point.title}"؟`)) {
                                onDeletePoint(point.id);
                              }
                            }}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 transition"
                            title="حذف المركز"
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

            {/* TAB 2: FIRE & CRISIS ZONES */}
            {activeTab === 'fire_zones' && (
              <div className="flex-1 p-4 sm:p-6 flex flex-col sm:flex-row gap-6 overflow-hidden">
                {/* Left: Fire Zones List */}
                <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-red-600" />
                      <span>المناطق المتضررة والحرائق المسجلة ({firePoints.length})</span>
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {firePoints.map((point) => (
                      <div
                        key={point.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{point.title}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              point.status === 'extinguished'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {point.status === 'extinguished' ? 'تم الإخماد' : 'حريق نشط'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{point.wilayaNameAr} - {point.commune} ({point.address})</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onEditPoint?.(point)}
                            className="p-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 transition flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3 text-emerald-700" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPointOnMap(point);
                              onClose();
                            }}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePoint(point.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Add Burnt Zone Form */}
                <div className="w-full sm:w-96 bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-y-auto space-y-3.5">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-red-600" />
                    <span>إضافة منطقة حرائق أو إخماد جديدة</span>
                  </h4>

                  {burntSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                      {burntSuccessMsg}
                    </div>
                  )}

                  {burntError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                      {burntError}
                    </div>
                  )}

                  <form onSubmit={handleAddBurntZone} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">اسم المنطقة / الغابة *</label>
                      <input
                        type="text"
                        required
                        value={burntTitle}
                        onChange={(e) => setBurntTitle(e.target.value)}
                        placeholder="مثال: غابة تاكسنة، قرية آيت هشام..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">الولاية *</label>
                        <select
                          value={burntWilaya}
                          onChange={(e) => setBurntWilaya(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900"
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
                          value={burntCommune}
                          onChange={(e) => setBurntCommune(e.target.value)}
                          placeholder="البلدية"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">حالة الحريق</label>
                      <select
                        value={burntStatus}
                        onChange={(e) => setBurntStatus(e.target.value as PointStatus)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-bold"
                      >
                        <option value="urgent">حريق نشط / بحاجة لإغاثة عاجلة</option>
                        <option value="extinguished">تم إخماد الحريق والسيطرة عليه</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">رابط Google Maps أو الإحداثيات *</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          dir="ltr"
                          value={burntCoordsInput}
                          onChange={(e) => setBurntCoordsInput(e.target.value)}
                          placeholder="36.6583, 5.7924 أو رابط قوقل"
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={handleBurntCoordsParse}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-[11px]"
                        >
                          استخراج
                        </button>
                      </div>
                      {burntLat && burntLng && (
                        <p className="text-[10px] text-emerald-700 font-mono mt-1 font-semibold">
                          ✓ تم استخراج: {burntLat}, {burntLng}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition"
                    >
                      تثبيت منطقة الحرائق
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 3: QUICK GOOGLE MAPS ADD */}
            {activeTab === 'quick_add' && (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-emerald-700" />
                      <span>إضافة مركز بالرابط المباشر من Google Maps</span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      الصق رابط المركز (`maps.app.goo.gl/...`) لاستخراج الإحداثيات والاسم والبلدية تلقائياً
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={googleInput}
                      onChange={(e) => setGoogleInput(e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={handleParseGoogleLink}
                      disabled={parsingLoading || !googleInput.trim()}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      {parsingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>استخراج الموقع</span>}
                    </button>
                  </div>

                  {parseError && <p className="text-xs text-red-600">{parseError}</p>}
                  {quickSuccessMsg && <p className="text-xs text-emerald-700 font-bold">{quickSuccessMsg}</p>}

                  {parsedLat && parsedLng && (
                    <form onSubmit={handleAddQuickPoint} className="pt-4 border-t border-slate-200 space-y-4 text-xs">
                      {/* Photos */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-800 font-semibold flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-emerald-700" />
                            <span>صور المركز ({quickPhotos.length}/3):</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              ref={quickFileInputRef}
                              accept="image/*"
                              multiple
                              onChange={handleQuickImageUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => quickFileInputRef.current?.click()}
                              disabled={quickImageLoading || quickPhotos.length >= 3}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            >
                              {quickImageLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3 text-emerald-700" />}
                              <span>رفع صورة</span>
                            </button>
                          </div>
                        </div>

                        {quickPhotos.length > 0 && (
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {quickPhotos.map((p, idx) => (
                              <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-xs">
                                <img src={p} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setQuickPhotos(prev => prev.filter((_, i) => i !== idx))}
                                  className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">اسم المركز *</label>
                          <input
                            type="text"
                            required
                            value={quickTitle}
                            onChange={(e) => setQuickTitle(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">المشرف / الجمعية</label>
                          <input
                            type="text"
                            value={quickOrganizer}
                            onChange={(e) => setQuickOrganizer(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
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
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition"
                      >
                        حفظ ونشر وتأكيد المركز فوراً
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: SETTINGS & BACKUP */}
            {activeTab === 'settings' && (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 max-w-2xl text-xs sm:text-sm">
                {/* Change Passcode */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm">تغيير كلمة مرور المشرف</h4>
                  {passChangeMsg && <p className="text-xs text-emerald-700 font-bold">{passChangeMsg}</p>}
                  <form onSubmit={handleChangePass} className="space-y-3">
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="كلمة المرور الجديدة"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm transition"
                    >
                      حفظ كلمة المرور الجديدة
                    </button>
                  </form>
                </div>

                {/* Backups */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm">النسخ الاحتياطي واستعادة البيانات</h4>
                  <p className="text-slate-600 text-xs">
                    تصدير قاعدة بيانات نقاط التبرع والحرائق كملف JSON آمن للنسخ الاحتياطي.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const jsonStr = exportPointsJson();
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `win-ntbara3-backup-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                      }}
                      className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 flex items-center gap-2 shadow-xs transition"
                    >
                      <Download className="w-4 h-4 text-emerald-700" />
                      <span>تحميل النسخة الاحتياطية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('هل تريد استعادة البيانات الافتراضية؟')) {
                          resetPointsToDefault();
                          onReloadPoints();
                        }
                      }}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 transition"
                    >
                      استعادة البيانات الافتراضية
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
