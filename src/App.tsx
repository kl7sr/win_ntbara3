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
import { WelcomeEntryModal } from './components/WelcomeEntryModal';
import { WilayaResultsModal } from './components/WilayaResultsModal';
import { LegendModal } from './components/LegendModal';
import { ReportSupportModal } from './components/ReportSupportModal';
import { CharityPoint, UserLocation } from './types';
import { Language, TRANSLATIONS } from './i18n/translations';
import { WILAYAS } from './data/wilayas';
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
import { CheckCircle2, Plus, Compass, Map as MapIcon, RotateCcw, MapPin, Layers, Wrench } from 'lucide-react';

export function App() {
  const [points, setPoints] = useState<CharityPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<CharityPoint | null>(null);
  const [editingPoint, setEditingPoint] = useState<CharityPoint | null>(null);
  const [isAdminSession, setIsAdminSession] = useState<boolean>(() => isAdminAuthenticated());
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // Modals & Panels
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    // If opening via direct share deep-link ?point=..., don't show welcome modal
    if (typeof window !== 'undefined' && window.location.search.includes('point=')) {
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

  // Load points directly from Cloudflare D1 Database (with instant local fallback and photo preservation)
  const loadPoints = useCallback(async () => {
    try {
      const initial = getStoredPoints();
      setPoints([...initial]);

      const livePoints = await fetchLivePointsFromD1();
      if (livePoints && livePoints.length > 0) {
        // Merge live points with local photos so uploaded images are never lost on refresh
        const merged = livePoints.map((lp) => {
          const localMatch = initial.find((ip) => ip.id === lp.id);
          if (localMatch && localMatch.images && localMatch.images.length > 0 && (!lp.images || lp.images.length === 0)) {
            return { ...lp, images: localMatch.images, imageUrl: localMatch.imageUrl };
          }
          return lp;
        });
        setPoints(merged);
        savePoints(merged);
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
          setIsWelcomeModalOpen(false);
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
          const loc: UserLocation = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy),
            timestamp: Date.now(),
          };
          setUserLocation(loc);

          // Find closest Wilaya and automatically update the dropdown and selectedWilaya
          const closest = WILAYAS.reduce((prev, curr) => {
            const distPrev = Math.hypot(prev.lat - loc.lat, prev.lng - loc.lng);
            const distCurr = Math.hypot(curr.lat - loc.lat, curr.lng - loc.lng);
            return distCurr < distPrev ? curr : prev;
          });

          if (closest) {
            setSelectedWilaya(closest.code);
            showToast(`تم تحديد موقعك: ولاية ${closest.nameAr}`);
          } else {
            showToast('تم تحديد موقعك بدقة');
          }
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          showToast('تعذر الوصول إلى نظام GPS، يرجى تفعيل الموقع');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } catch (e) {
      console.warn('Location request exception:', e);
    }
  };

  // Handle Intent & Wilaya Selection from WelcomeEntryModal
  const handleSelectIntentAndWilaya = (intent: 'find' | 'add', wilayaCode: number) => {
    setSelectedWilaya(wilayaCode);
    setIsWelcomeModalOpen(false);

    if (intent === 'add') {
      setIsAddModalOpen(true);
    } else {
      // Find mode: show clean Wilaya Results Modal with collapsible neighboring centers dropdown!
      setIsWilayaResultsModalOpen(true);
      showToast(`تم تحديد ولاية ${WILAYAS.find((w) => w.code === wilayaCode)?.nameAr || ''}`);
    }
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

      await updateLivePointInD1(id, updates);
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
      <EmergencyBanner />

      {/* 2. Main Navigation Bar */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenNearestDrawer={() => setIsNearestDrawerOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
        totalPoints={activeVisiblePoints.length}
        currentLanguage={language}
        onSelectLanguage={handleLanguageChange}
      />

      {/* 3. Main Full-Screen Map */}
      <main className="flex-1 relative w-full h-full pb-16 overflow-hidden">
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

        {/* Clean Floating Fire Toggle on Map (Top Right) - Only when no modal/drawer is active */}
        {!isWelcomeModalOpen && !isWilayaResultsModalOpen && !isNearestDrawerOpen && !selectedPoint && !isAddModalOpen && !isAdminOpen && (
          <div className="absolute top-3 right-3 z-20 flex items-center pointer-events-auto animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowFireZones(!showFireZones)}
              className={`px-3 py-1.5 rounded-full shadow-lg border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap ${
                showFireZones
                  ? 'bg-red-600 text-white border-red-700 shadow-red-500/20'
                  : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200'
              }`}
              title="إظهار أو إخفاء مناطق الحرائق"
            >
              <input
                type="checkbox"
                checked={showFireZones}
                onChange={() => {}}
                className="w-3.5 h-3.5 accent-red-600 rounded pointer-events-none"
              />
              <span>مناطق الحرائق</span>
            </button>
          </div>
        )}
      </main>

      {/* 4. Bottom Navigation Bar (5 Action Items) */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 sm:px-6 py-2 shadow-2xl safe-bottom-padding flex items-center justify-between max-w-lg mx-auto sm:rounded-t-2xl">
        {/* 1. Map Key / Legend Tab */}
        <button
          onClick={() => setIsLegendModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-1.5 text-slate-700 hover:text-emerald-700 active:scale-95 transition flex-1"
          title="مفتاح الخريطة"
        >
          <Layers className="w-4 h-4 text-slate-600" />
          <span className="text-[10px] font-bold">المفتاح</span>
        </button>

        {/* 2. Map Tab */}
        <button
          onClick={() => {
            setIsNearestDrawerOpen(false);
            setSelectedPoint(null);
          }}
          className="flex flex-col items-center justify-center gap-1 py-1 px-1.5 text-slate-700 hover:text-emerald-700 active:scale-95 transition flex-1"
          title={t.exploreMap}
        >
          <MapIcon className="w-4 h-4 text-emerald-700" />
          <span className="text-[10px] font-bold">{t.exploreMap}</span>
        </button>

        {/* 3. Add Point CTA */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-6">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-xl flex items-center justify-center border-4 border-white active:scale-95 transition shrink-0"
            title={t.addPoint}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9.5px] sm:text-[10px] font-extrabold text-emerald-800 mt-0.5 whitespace-nowrap">{t.addPoint}</span>
        </div>

        {/* 4. Nearest Drawer Tab */}
        <button
          onClick={() => setIsNearestDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-1.5 text-slate-700 hover:text-emerald-700 active:scale-95 transition flex-1"
          title={t.nearestToMe}
        >
          <Compass className="w-4 h-4 text-slate-600" />
          <span className="text-[10px] font-bold">{t.nearestToMe}</span>
        </button>

        {/* 5. Support / Report Technical Problems Tab */}
        <button
          onClick={() => setIsSupportModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-1.5 text-slate-700 hover:text-amber-700 active:scale-95 transition flex-1"
          title="الدعم الفني والإبلاغ"
        >
          <Wrench className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] font-bold">الدعم الفني</span>
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
