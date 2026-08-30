import React, { useState, useEffect, useCallback } from 'react';
import { EmergencyBanner } from './components/EmergencyBanner';
import { Navbar } from './components/Navbar';
import { MapComponent } from './components/MapComponent';
import { PointDetailModal } from './components/PointDetailModal';
import { AddPointModal } from './components/AddPointModal';
import { NearestListDrawer } from './components/NearestListDrawer';
import { AdminPanel } from './components/AdminPanel';
import { EditPointModal } from './components/EditPointModal';
import { InstallAppBanner } from './components/InstallAppBanner';
import { CharityPoint, UserLocation } from './types';
import { Language, TRANSLATIONS } from './i18n/translations';
import { 
  getStoredPoints, 
  addPoint as saveNewPointLocal, 
  updatePoint as saveUpdatedPointLocal, 
  deletePoint as removePointLocal,
  isAdminAuthenticated
} from './services/storage';
import { 
  fetchLivePointsFromD1, 
  createLivePointInD1, 
  updateLivePointInD1, 
  deleteLivePointFromD1 
} from './services/apiService';
import { CheckCircle2, Plus, Compass, Map as MapIcon, ShieldCheck } from 'lucide-react';

export function App() {
  const [points, setPoints] = useState<CharityPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<CharityPoint | null>(null);
  const [editingPoint, setEditingPoint] = useState<CharityPoint | null>(null);
  const [isAdminSession, setIsAdminSession] = useState<boolean>(() => isAdminAuthenticated());
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // Multi-language state (Arabic first by default)
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('win_ntbara3_lang') as Language;
      return (saved === 'ar' || saved === 'fr' || saved === 'en') ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('win_ntbara3_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = TRANSLATIONS[language];

  // Modals & Panels
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNearestDrawerOpen, setIsNearestDrawerOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Filters
  const [selectedWilaya, setSelectedWilaya] = useState<number | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load points directly from Cloudflare D1 Database (with instant local fallback)
  const loadPoints = useCallback(async () => {
    try {
      // 1. Instant local render so there is 0 delay
      const initial = getStoredPoints();
      setPoints([...initial]);

      // 2. Fetch fresh live points from Cloudflare D1 Database
      const livePoints = await fetchLivePointsFromD1();
      if (livePoints && livePoints.length > 0) {
        setPoints([...livePoints]);
      }
    } catch (e) {
      console.error('Error loading points:', e);
    }
  }, []);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  // Handle URL deep linking (e.g. win-ntbara3.pages.dev/?point=cra-national-hq)
  useEffect(() => {
    if (points.length === 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const pointIdFromUrl = params.get('point') || (window.location.hash.startsWith('#point-') ? window.location.hash.replace('#point-', '') : null);
      if (pointIdFromUrl) {
        const target = points.find((p) => p.id === pointIdFromUrl);
        if (target) {
          setSelectedPoint(target);
        }
      }
    } catch {}
  }, [points]);

  // Sync selected point with browser URL query
  useEffect(() => {
    try {
      if (selectedPoint) {
        const newUrl = `${window.location.pathname}?point=${encodeURIComponent(selectedPoint.id)}`;
        window.history.replaceState(null, '', newUrl);
      } else {
        if (window.location.search.includes('point=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    } catch {}
  }, [selectedPoint]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Request user location safely (GPS)
  const requestUserLocation = () => {
    try {
      if (!navigator.geolocation) {
        showToast('خاصية تحديد الموقع غير مدعومة على هذا الجهاز');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: UserLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          setUserLocation(coords);
          showToast('تم تحديد موقعك الحالي بنجاح');
        },
        (err) => {
          console.warn('Geolocation error:', err);
          showToast('يرجى تفعيل الـ GPS في الهاتف لتحديد المراكز القريبة');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } catch (e) {
      console.warn('Geolocation invocation failed:', e);
    }
  };

  // Handlers for points CRUD with Cloudflare D1 real-time sync
  const handleAddPoint = async (newPointData: Omit<CharityPoint, 'id' | 'createdAt'>) => {
    try {
      // 1. Instant UI update & local save
      const created = saveNewPointLocal(newPointData);
      setPoints((prev) => [created, ...prev.filter(p => p.id !== created.id)]);
      
      // Clear filters so new point is unconditionally visible on map
      setSelectedWilaya(null);
      setActiveCategoryFilter(null);
      
      // Focus and select the new point immediately
      setSelectedPoint(created);
      showToast('تم حفظ النقطة في قاعدة البيانات ونشرها بنجاح');

      // 2. Persist to Cloudflare D1 Database in real-time
      await createLivePointInD1(newPointData);
    } catch (e) {
      console.error('Error adding point:', e);
    }
  };

  const handleUpdatePoint = async (id: string, updates: Partial<CharityPoint>) => {
    try {
      saveUpdatedPointLocal(id, updates);
      setPoints((prev) => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      if (selectedPoint?.id === id) {
        setSelectedPoint((prev) => (prev ? { ...prev, ...updates } : null));
      }
      showToast('تم تحديث بيانات النقطة');

      // Sync update to Cloudflare D1
      await updateLivePointInD1(id, updates);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePoint = async (id: string) => {
    try {
      removePointLocal(id);
      setPoints((prev) => prev.filter(p => p.id !== id));
      if (selectedPoint?.id === id) {
        setSelectedPoint(null);
      }
      showToast('تم حذف النقطة');

      // Delete from Cloudflare D1
      await deleteLivePointFromD1(id);
    } catch (e) {
      console.error(e);
    }
  };

  const displayedPoints = points.filter((p) => {
    if (selectedWilaya && p.wilayaCode !== selectedWilaya) return false;
    if (activeCategoryFilter && !p.aidCategories.includes(activeCategoryFilter as any)) return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden select-none relative">
      {/* 1. Helpline Header Banner */}
      <EmergencyBanner />

      {/* 2. Main Navigation Bar */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenNearestDrawer={() => setIsNearestDrawerOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
        totalPoints={displayedPoints.length}
        currentLanguage={language}
        onSelectLanguage={handleLanguageChange}
      />

      {/* 3. Main Full-Screen Map */}
      <main className="flex-1 relative w-full h-full pb-16 overflow-hidden">
        <MapComponent
          points={displayedPoints}
          selectedPoint={selectedPoint}
          onSelectPoint={(p) => setSelectedPoint(p)}
          userLocation={userLocation}
          onRequestUserLocation={requestUserLocation}
          selectedWilaya={selectedWilaya}
        />
      </main>

      {/* 4. Bottom Navigation Bar (Centered Add CTA) */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2 shadow-2xl safe-bottom-padding flex items-center justify-between max-w-lg mx-auto sm:rounded-t-2xl">
        {/* 1. Map Tab */}
        <button
          onClick={() => {
            setIsNearestDrawerOpen(false);
            setSelectedPoint(null);
          }}
          className="flex flex-col items-center justify-center gap-1 py-1 px-4 text-slate-700 hover:text-emerald-700 active:scale-95 transition flex-1"
        >
          <MapIcon className="w-5 h-5 text-emerald-700" />
          <span className="text-[11px] font-bold">{t.exploreMap}</span>
        </button>

        {/* 2. Centered Prominent Add Point Button */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-6">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-xl flex items-center justify-center border-4 border-white active:scale-95 transition shrink-0"
            title={t.addPoint}
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-extrabold text-emerald-800 mt-0.5 whitespace-nowrap">{t.addPoint}</span>
        </div>

        {/* 3. Nearest Tab */}
        <button
          onClick={() => setIsNearestDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-4 text-slate-700 hover:text-emerald-700 active:scale-95 transition flex-1"
        >
          <Compass className="w-5 h-5 text-slate-600" />
          <span className="text-[11px] font-bold">{t.nearestToMe}</span>
        </button>
      </footer>

      {/* 5. Google Maps Style Mobile Bottom Sheet Widget */}
      <PointDetailModal
        point={selectedPoint}
        userLocation={userLocation}
        onClose={() => setSelectedPoint(null)}
        onEditPoint={isAdminSession ? ((point) => setEditingPoint(point)) : undefined}
      />

      {/* 6. Edit Point Modal (Map & Admin Direct Edit) */}
      {isAdminSession && (
        <EditPointModal
          point={editingPoint}
          isOpen={Boolean(editingPoint)}
          onClose={() => setEditingPoint(null)}
          onUpdatePoint={handleUpdatePoint}
        />
      )}

      {/* 7. Add Charity Point Modal */}
      <AddPointModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPoint={handleAddPoint}
        initialCoords={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null}
      />

      {/* 8. Nearest Points Drawer */}
      <NearestListDrawer
        isOpen={isNearestDrawerOpen}
        onClose={() => setIsNearestDrawerOpen(false)}
        points={points}
        userLocation={userLocation}
        onSelectPoint={(point) => {
          setSelectedPoint(point);
          setIsNearestDrawerOpen(false);
        }}
        onRequestLocation={requestUserLocation}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
      />

      {/* 9. Admin Dashboard (Fullscreen Light Mode) */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        points={points}
        onAddPoint={handleAddPoint}
        onUpdatePoint={handleUpdatePoint}
        onDeletePoint={handleDeletePoint}
        onReloadPoints={loadPoints}
        onSelectPointOnMap={(point) => {
          setSelectedPoint(point);
        }}
        onEditPoint={(point) => setEditingPoint(point)}
        onAdminAuthChange={(isAuth) => setIsAdminSession(isAuth)}
      />

      {/* 10. Phone App Install Prompt (PWA) */}
      <InstallAppBanner currentLanguage={language} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
