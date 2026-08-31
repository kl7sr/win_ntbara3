import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EmergencyBanner } from './components/EmergencyBanner';
import { Navbar } from './components/Navbar';
import { MapComponent } from './components/MapComponent';
import { PointDetailModal } from './components/PointDetailModal';
import { AddPointModal } from './components/AddPointModal';
import { NearestListDrawer } from './components/NearestListDrawer';
import { AdminPanel } from './components/AdminPanel';
import { EditPointModal } from './components/EditPointModal';
import { InstallAppBanner } from './components/InstallAppBanner';
import { WelcomeEntryModal } from './components/WelcomeEntryModal';
import { WilayaResultsModal } from './components/WilayaResultsModal';
import { LegendModal } from './components/LegendModal';
import { ReportSupportModal } from './components/ReportSupportModal';
import { MapKeyBookWidget } from './components/MapKeyBookWidget';
import { CharityPoint, UserLocation } from './types';
import { Language, TRANSLATIONS } from './i18n/translations';
import { WILAYAS } from './data/wilayas';
import { SEED_CHARITY_POINTS } from './data/seedPoints';
import { 
  getStoredPoints, 
  savePoints,
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
import { CheckCircle2, Plus, Compass, Map as MapIcon, RotateCcw, MapPin, Layers, Wrench, Search, Download } from 'lucide-react';
import { usePwaInstall } from './utils/usePwaInstall';

export function App() {
  const [points, setPoints] = useState<CharityPoint[]>([]);
  const isInitialMount = useRef(true);
  const { isStandalone } = usePwaInstall();

  // Directly initialize selectedPoint from URL ?point=... so deep links open immediately!
  const [selectedPoint, setSelectedPoint] = useState<CharityPoint | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const pointId = params.get('point') || (window.location.hash.startsWith('#point-') ? window.location.hash.replace('#point-', '') : null);
        if (pointId) {
          const initial = getStoredPoints();
          return initial.find(p => p.id === pointId) || SEED_CHARITY_POINTS.find(p => p.id === pointId) || null;
        }
      }
    } catch {}
    return null;
  });

  const [editingPoint, setEditingPoint] = useState<CharityPoint | null>(null);
  const [isAdminSession, setIsAdminSession] = useState<boolean>(() => isAdminAuthenticated());
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // Modals & Panels
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    // If opening via direct share deep-link ?point=..., NEVER show welcome modal
    if (typeof window !== 'undefined' && (window.location.search.includes('point=') || window.location.hash.includes('point-'))) {
      return false;
    }
    return true;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNearestDrawerOpen, setIsNearestDrawerOpen] = useState(false);
  const [isWilayaResultsModalOpen, setIsWilayaResultsModalOpen] = useState(false);
  const [isLegendModalOpen, setIsLegendModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [activeIntent, setActiveIntent] = useState<'find' | 'add'>('find');
  const [welcomeInitialStep, setWelcomeInitialStep] = useState<1 | 2>(1);
  const [welcomeInitialIntent, setWelcomeInitialIntent] = useState<'find' | 'add'>('find');

  // Filters
  const [selectedWilaya, setSelectedWilaya] = useState<number | null>(null);
  const [showFireZones, setShowFireZones] = useState<boolean>(false);

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

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load points directly from Cloudflare D1 Database (with instant local fallback and photo preservation)
  const loadPoints = useCallback(async () => {
    try {
      const initial = getStoredPoints();
      setPoints([...initial]);

      const livePoints = await fetchLivePointsFromD1();
      if (livePoints && livePoints.length > 0) {
        const mergedMap = new Map<string, CharityPoint>();
        // 1. Start with all initial / seed points
        initial.forEach((ip) => mergedMap.set(ip.id, ip));

        // 2. Overlay live points from D1 (live points take 100% precedence)
        livePoints.forEach((lp) => {
          const localMatch = mergedMap.get(lp.id);
          const images = (lp.images && lp.images.length > 0)
            ? lp.images
            : (localMatch?.images && localMatch.images.length > 0 ? localMatch.images : []);
          mergedMap.set(lp.id, {
            ...localMatch,
            ...lp,
            images,
            imageUrl: images[0] || lp.imageUrl,
          });
        });

        const finalList = Array.from(mergedMap.values());
        setPoints(finalList);
        savePoints(finalList);
      }
    } catch (e) {
      console.error('Error loading points:', e);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadPoints();
      showToast('تم تحديث البيانات مباشرة بنجاح 🔄');
    } catch {
      showToast('تعذر تحديث البيانات');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  // Handle URL deep linking (e.g. win-ntbara3.pages.dev/?point=sma-scouts-birkhadem)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pointIdFromUrl = params.get('point') || (window.location.hash.startsWith('#point-') ? window.location.hash.replace('#point-', '') : null);
      if (pointIdFromUrl) {
        const target = points.find((p) => p.id === pointIdFromUrl) || SEED_CHARITY_POINTS.find((p) => p.id === pointIdFromUrl);
        if (target) {
          setSelectedPoint(target);
          setSelectedWilaya(target.wilayaCode);
          setIsWelcomeModalOpen(false);
          setIsNearestDrawerOpen(false);
        }
      } else if (selectedPoint) {
        // Keep currently open point synced with latest live data (including photos)
        const fresh = points.find((p) => p.id === selectedPoint.id);
        if (fresh && (
          fresh.images?.length !== selectedPoint.images?.length || 
          fresh.imageUrl !== selectedPoint.imageUrl ||
          fresh.lat !== selectedPoint.lat ||
          fresh.lng !== selectedPoint.lng
        )) {
          setSelectedPoint(fresh);
        }
      }
    } catch {}
  }, [points]);

  // Sync selected point with browser URL query
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
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
          const loc: UserLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 10),
            timestamp: Date.now(),
          };
          setUserLocation(loc);
          showToast('تم تحديد موقعك بنجاح 📍');
        },
        (err) => {
          console.warn('Geolocation failed:', err);
          showToast('تعذر الحصول على موقعك بدقة، يرجى تفعيل الـ GPS');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } catch {
      showToast('تعذر الوصول إلى الموقع الجغرافي');
    }
  };

  // Handle Intent & Wilaya Selection from WelcomeEntryModal
  const handleSelectIntentAndWilaya = (intent: 'find' | 'add', wilayaCode: number | null) => {
    setActiveIntent(intent);
    setSelectedWilaya(wilayaCode);
    setIsWelcomeModalOpen(false);

    if (intent === 'add') {
      setIsAddModalOpen(true);
    } else {
      // Find mode: show clean Wilaya Results Modal with collapsible neighboring centers dropdown!
      setIsWilayaResultsModalOpen(true);
      if (wilayaCode) {
        showToast(`تم تحديد ولاية ${WILAYAS.find((w) => w.code === wilayaCode)?.nameAr || ''}`);
      }
    }
  };

  const handleOpenSearchModal = (intent: 'find' | 'add' = 'find') => {
    setWelcomeInitialStep(2);
    setWelcomeInitialIntent(intent);
    setIsWelcomeModalOpen(true);
  };

  // Add Point
  const handleAddPoint = async (newPointData: Omit<CharityPoint, 'id' | 'createdAt'>) => {
    try {
      const created = saveNewPointLocal(newPointData);
      setPoints((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      showToast('تمت إضافة النقطة ونشرها بنجاح!');
      setSelectedPoint(created);

      await createLivePointInD1(created);
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء إضافة النقطة');
    }
  };

  // Update Point
  const handleUpdatePoint = async (id: string, updates: Partial<CharityPoint>) => {
    try {
      const updated = saveUpdatedPointLocal(id, updates);
      if (updated) {
        setPoints((prev) => prev.map((p) => (p.id === id ? updated : p)));
        if (selectedPoint?.id === id) {
          setSelectedPoint(updated);
        }
        showToast('تم تحديث البيانات بنجاح!');
      }
      setEditingPoint(null);

      await updateLivePointInD1(id, updates, updated || undefined);
    } catch (e) {
      console.error(e);
      showToast('تعذر حفظ التعديلات على الخادم');
    }
  };

  // Delete Point
  const handleDeletePoint = async (id: string) => {
    try {
      removePointLocal(id);
      setPoints((prev) => prev.filter((p) => p.id !== id));
      if (selectedPoint?.id === id) {
        setSelectedPoint(null);
      }
      showToast('تم حذف النقطة');

      await deleteLivePointFromD1(id);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter points according to fire toggle
  const activeVisiblePoints = points.filter((p) => {
    if (!showFireZones && p.pointType === 'burnt_zone') return false;
    return true;
  });

  const selectedWilayaObj = WILAYAS.find((w) => w.code === selectedWilaya);

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden select-none relative">
      {/* 1. Helpline Header Banner */}
      <EmergencyBanner currentLanguage={language} />

      {/* 2. Main Navigation Bar */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenNearestDrawer={() => setIsNearestDrawerOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
        totalPoints={activeVisiblePoints.length}
        currentLanguage={language}
        onSelectLanguage={handleLanguageChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 3. Main Full-Screen Map */}
      <main className="flex-1 relative w-full h-full pb-14 overflow-hidden">
        <MapComponent
          points={activeVisiblePoints}
          selectedPoint={selectedPoint}
          onSelectPoint={(p) => {
            setSelectedPoint(p);
          }}
          userLocation={userLocation}
          onRequestUserLocation={requestUserLocation}
          selectedWilaya={selectedWilaya}
        />

        {/* Map Key Book Holder Widget on Bottom-Right of Map */}
        <MapKeyBookWidget currentLanguage={language} />

        {/* Floating Download App Chip on Map (Outside of header, disappears if running as installed app) */}
        {!isStandalone && (
          <div className="fixed top-13 left-3 sm:left-4 z-20 pointer-events-auto select-none">
            <button
              type="button"
              onClick={() => setIsInstallModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 shadow-md backdrop-blur-md text-[11px] font-black transition active:scale-95 cursor-pointer"
              title="تحميل وتثبيت التطبيق"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
              <span>{language === 'ar' ? 'تحميل التطبيق' : 'Télécharger l’app'}</span>
            </button>
          </div>
        )}
      </main>

      {/* 4. Bottom Navigation Bar (Dynamic Primary CTA & Side Slot based on User Intent) */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 sm:px-4 py-1.5 shadow-2xl flex items-center justify-between max-w-lg mx-auto sm:rounded-t-2xl pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {/* 1. Map Tab (Right in RTL) */}
        <button
          onClick={() => {
            setIsNearestDrawerOpen(false);
            setSelectedPoint(null);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 active:scale-95 transition flex-1 focus:outline-none focus:ring-0 outline-none select-none ${
            !isNearestDrawerOpen
              ? 'text-emerald-800 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title={t.exploreMap}
        >
          <MapIcon className={`w-4 h-4 ${!isNearestDrawerOpen ? 'text-emerald-700' : 'text-slate-600'}`} />
          <span className="text-[9.5px] font-bold">{t.exploreMap}</span>
        </button>

        {/* 2. Side Dynamic Slot (Shows Add if Active Intent is Find, or Search if Active Intent is Add) */}
        {activeIntent === 'find' ? (
          <button
            type="button"
            onClick={() => {
              setActiveIntent('add');
              setIsAddModalOpen(true);
            }}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 text-slate-600 hover:text-emerald-700 active:scale-95 transition flex-1 focus:outline-none focus:ring-0 outline-none select-none cursor-pointer"
            title={t.addPoint}
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span className="text-[9.5px] font-bold">{t.addPoint}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setActiveIntent('find');
              handleOpenSearchModal('find');
            }}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 text-slate-600 hover:text-emerald-700 active:scale-95 transition flex-1 focus:outline-none focus:ring-0 outline-none select-none cursor-pointer"
            title={t.search}
          >
            <Search className="w-4 h-4 text-slate-600" />
            <span className="text-[9.5px] font-bold">{t.search}</span>
          </button>
        )}

        {/* 3. Center Elevated CTA (Shows Search if Active Intent is Find, or Add if Active Intent is Add) */}
        {activeIntent === 'find' ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-5">
            <button
              onClick={() => handleOpenSearchModal('find')}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg flex items-center justify-center border-[3px] border-white active:scale-95 transition shrink-0 focus:outline-none focus:ring-0 outline-none select-none"
              title={t.search}
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
            </button>
            <span className="text-[9px] sm:text-[9.5px] font-black text-emerald-800 mt-0.5 whitespace-nowrap select-none">{t.search}</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center -mt-5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg flex items-center justify-center border-[3px] border-white active:scale-95 transition shrink-0 focus:outline-none focus:ring-0 outline-none select-none"
              title={t.addPoint}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
            <span className="text-[9px] sm:text-[9.5px] font-black text-emerald-800 mt-0.5 whitespace-nowrap select-none">{t.addPoint}</span>
          </div>
        )}

        {/* 4. Nearest Drawer Tab */}
        <button
          onClick={() => setIsNearestDrawerOpen((prev) => !prev)}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 active:scale-95 transition flex-1 focus:outline-none focus:ring-0 outline-none select-none ${
            isNearestDrawerOpen
              ? 'text-emerald-800 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title={t.nearestToMe}
        >
          <Compass className={`w-4 h-4 ${isNearestDrawerOpen ? 'text-emerald-700' : 'text-slate-600'}`} />
          <span className="text-[9.5px] font-bold">{t.nearestToMe}</span>
        </button>

        {/* 5. Support / Report Technical Problems Tab (Left in RTL) */}
        <button
          onClick={() => setIsSupportModalOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 text-slate-700 hover:text-amber-700 active:scale-95 transition flex-1 focus:outline-none focus:ring-0 outline-none select-none"
          title={t.support}
        >
          <Wrench className="w-4 h-4 text-amber-600" />
          <span className="text-[9.5px] font-bold">{t.support}</span>
        </button>
      </footer>

      {/* 5. Onboarding Welcome Entry Modal (Step 1 & 2) */}
      <WelcomeEntryModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        onSelectIntentAndWilaya={handleSelectIntentAndWilaya}
        onDirectMapExplore={() => {
          setSelectedWilaya(null);
          setIsWelcomeModalOpen(false);
        }}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        initialStep={welcomeInitialStep}
        initialIntent={welcomeInitialIntent}
        currentLanguage={language}
      />

      {/* 6. Full Point Details Modal (Expandable) */}
      <PointDetailModal
        point={selectedPoint}
        userLocation={userLocation}
        onClose={() => setSelectedPoint(null)}
        onEditPoint={isAdminSession ? (point) => setEditingPoint(point) : undefined}
      />

      {/* 7. Map Key / Legend Modal */}
      <LegendModal
        isOpen={isLegendModalOpen}
        onClose={() => setIsLegendModalOpen(false)}
        currentLanguage={language}
        showFireZones={showFireZones}
        onToggleFireZones={setShowFireZones}
      />

      {/* 8. Technical Support & Report Modal */}
      <ReportSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        currentLanguage={language}
      />

      {/* 9. Admin In-Place Edit Modal */}
      {editingPoint && (
        <EditPointModal
          point={editingPoint}
          isOpen={true}
          onClose={() => setEditingPoint(null)}
          onUpdatePoint={handleUpdatePoint}
        />
      )}

      {/* 10. Wilaya Results Modal with Neighboring Centers Accordion */}
      <WilayaResultsModal
        isOpen={isWilayaResultsModalOpen}
        onClose={() => setIsWilayaResultsModalOpen(false)}
        wilayaCode={selectedWilaya}
        points={activeVisiblePoints}
        userLocation={userLocation}
        onSelectPointOnMap={(point) => {
          setIsWilayaResultsModalOpen(false);
          setSelectedPoint(point);
        }}
        onOpenFullDetails={(point) => {
          setIsWilayaResultsModalOpen(false);
          setSelectedPoint(point);
        }}
        onChangeWilaya={() => {
          setIsWilayaResultsModalOpen(false);
          setIsWelcomeModalOpen(true);
        }}
        currentLanguage={language}
      />

      {/* 11. Add Point Modal */}
      <AddPointModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPoint={handleAddPoint}
        initialWilayaCode={selectedWilaya || undefined}
      />

      {/* 12. Nearest Points Drawer (with Smart Border Centers) */}
      <NearestListDrawer
        isOpen={isNearestDrawerOpen}
        onClose={() => setIsNearestDrawerOpen(false)}
        points={activeVisiblePoints}
        userLocation={userLocation}
        onSelectPoint={(point) => {
          setSelectedPoint(point);
          setIsNearestDrawerOpen(false);
        }}
        onRequestLocation={requestUserLocation}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
        currentLanguage={language}
        showFireZones={showFireZones}
        onToggleFireZones={setShowFireZones}
      />

      {/* 13. Admin Dashboard */}
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

      {/* 14. Phone App Install Prompt (PWA) */}
      <InstallAppBanner 
        currentLanguage={language} 
        isVisible={!selectedPoint && !isAddModalOpen && !isAdminOpen && !isWilayaResultsModalOpen && !isNearestDrawerOpen && !isWelcomeModalOpen && !editingPoint && !isLegendModalOpen && !isSupportModalOpen}
        isOpenModal={isInstallModalOpen}
        onCloseModal={() => setIsInstallModalOpen(false)}
      />

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
