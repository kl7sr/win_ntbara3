import React, { useState, useEffect, useCallback } from 'react';
import { EmergencyBanner } from './components/EmergencyBanner';
import { Navbar } from './components/Navbar';
import { MapComponent } from './components/MapComponent';
import { PointDetailModal } from './components/PointDetailModal';
import { AddPointModal } from './components/AddPointModal';
import { NearestListDrawer } from './components/NearestListDrawer';
import { AdminPanel } from './components/AdminPanel';
import { CharityPoint, UserLocation } from './types';
import { 
  getStoredPoints, 
  addPoint as saveNewPoint, 
  updatePoint as saveUpdatedPoint, 
  deletePoint as removePoint 
} from './services/storage';
import { CheckCircle2, Plus, Compass, Map as MapIcon, ShieldCheck } from 'lucide-react';

export function App() {
  const [points, setPoints] = useState<CharityPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<CharityPoint | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // Modals & Panels
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNearestDrawerOpen, setIsNearestDrawerOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Filters
  const [selectedWilaya, setSelectedWilaya] = useState<number | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load points on mount
  const loadPoints = useCallback(() => {
    const loaded = getStoredPoints();
    setPoints(loaded);
  }, []);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Request user location (GPS)
  const requestUserLocation = () => {
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
  };

  useEffect(() => {
    if (navigator.geolocation && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'granted') {
          requestUserLocation();
        }
      });
    }
  }, []);

  // Handlers for points CRUD
  const handleAddPoint = (newPointData: Omit<CharityPoint, 'id' | 'createdAt'>) => {
    const created = saveNewPoint(newPointData);
    setPoints(getStoredPoints());
    setSelectedPoint(created);
    showToast('تم تسجيل ونشر نقطة التبرع بنجاح');
  };

  const handleUpdatePoint = (id: string, updates: Partial<CharityPoint>) => {
    saveUpdatedPoint(id, updates);
    setPoints(getStoredPoints());
    if (selectedPoint?.id === id) {
      setSelectedPoint((prev) => (prev ? { ...prev, ...updates } : null));
    }
    showToast('تم تحديث بيانات النقطة');
  };

  const handleDeletePoint = (id: string) => {
    removePoint(id);
    setPoints(getStoredPoints());
    if (selectedPoint?.id === id) {
      setSelectedPoint(null);
    }
    showToast('تم حذف النقطة');
  };

  const displayedPoints = points.filter((p) => {
    if (selectedWilaya && p.wilayaCode !== selectedWilaya) return false;
    if (activeCategoryFilter && !p.aidCategories.includes(activeCategoryFilter as any)) return false;
    return true;
  });

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden select-none">
      {/* 1. Helpline Header Banner */}
      <EmergencyBanner />

      {/* 2. Main Navigation Bar */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenNearestDrawer={() => setIsNearestDrawerOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
        activeFilter={activeCategoryFilter}
        onSelectFilter={setActiveCategoryFilter}
        totalPoints={displayedPoints.length}
      />

      {/* 3. Main Full-Screen Map (with padding for bottom bar) */}
      <main className="flex-1 relative w-full h-full pb-16 sm:pb-0 overflow-hidden">
        <MapComponent
          points={displayedPoints}
          selectedPoint={selectedPoint}
          onSelectPoint={(p) => setSelectedPoint(p)}
          userLocation={userLocation}
          onRequestUserLocation={requestUserLocation}
          selectedWilaya={selectedWilaya}
        />
      </main>

      {/* 4. Guaranteed Fixed Bottom Bar (Visible on mobile & dynamic on all resolutions) */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 shadow-2xl safe-bottom-padding flex items-center justify-around">
        {/* Map tab */}
        <button
          onClick={() => {
            setIsNearestDrawerOpen(false);
            setSelectedPoint(null);
          }}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-700 hover:text-emerald-700 active:scale-90 transition"
        >
          <MapIcon className="w-5 h-5 text-emerald-700" />
          <span className="text-[11px] font-bold">الخريطة</span>
        </button>

        {/* Nearest tab */}
        <button
          onClick={() => setIsNearestDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-700 hover:text-emerald-700 active:scale-90 transition"
        >
          <Compass className="w-5 h-5 text-slate-600" />
          <span className="text-[11px] font-medium">الأقرب لي</span>
        </button>

        {/* Big Add Point CTA button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-4 rounded-2xl shadow-lg font-bold text-xs active:scale-95 transition -mt-5 border-2 border-white"
        >
          <Plus className="w-4 h-4" />
          <span>أضف نقطة</span>
        </button>

        {/* Admin tab */}
        <button
          onClick={() => setIsAdminOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-700 hover:text-emerald-700 active:scale-90 transition"
        >
          <ShieldCheck className="w-5 h-5 text-slate-600" />
          <span className="text-[11px] font-medium">الإدارة</span>
        </button>
      </footer>

      {/* 5. Google Maps Style Mobile Bottom Sheet Widget */}
      <PointDetailModal
        point={selectedPoint}
        userLocation={userLocation}
        onClose={() => setSelectedPoint(null)}
      />

      {/* 6. Add Charity Point Modal */}
      <AddPointModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPoint={handleAddPoint}
        initialCoords={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null}
      />

      {/* 7. Nearest Points Drawer */}
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

      {/* 8. Admin Dashboard */}
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
