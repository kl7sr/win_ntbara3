import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, ArrowUpRight } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

const INSTALLED_KEY = 'win_ntbara3_pwa_installed';
const DISMISSED_SESSION_KEY = 'win_ntbara3_pwa_dismissed_session';

export const InstallAppBanner: React.FC<{ 
  currentLanguage?: Language;
  isVisible?: boolean;
}> = ({ currentLanguage = 'ar', isVisible = true }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  const t = TRANSLATIONS[currentLanguage];

  useEffect(() => {
    // 1. Comprehensive Installed / Standalone App Checks
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches 
      || window.matchMedia('(display-mode: fullscreen)').matches
      || window.matchMedia('(display-mode: minimal-ui)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    const isPwaUrl = window.location.search.includes('mode=standalone');
    const isStoredInstalled = localStorage.getItem(INSTALLED_KEY) === 'true';
    const isDismissedThisSession = sessionStorage.getItem(DISMISSED_SESSION_KEY) === 'true';

    // If running as the installed app or user dismissed this session, don't show
    if (isStandaloneDisplay || isIosStandalone || isPwaUrl || isStoredInstalled || isDismissedThisSession) {
      return;
    }

    // 2. Listen to native app install completion event
    const handleAppInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, 'true');
      setShowBanner(false);
      setShowGuideModal(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 3. Android/Chrome native install prompt capture
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. Mobile browser check
    const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (isIosDevice) {
      setIsIos(true);
    }

    if (isMobile) {
      const timer = setTimeout(() => {
        if (sessionStorage.getItem(DISMISSED_SESSION_KEY) !== 'true') {
          setShowBanner(true);
        }
      }, 2500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, 'true');
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
    setShowGuideModal(false);
    sessionStorage.setItem(DISMISSED_SESSION_KEY, 'true');
  };

  if (!showBanner || !isVisible) return null;

  return (
    <>
      {/* Small, Sleek, Unobtrusive Floating Pill at Bottom Left */}
      <aside 
        aria-label="تثبيت التطبيق"
        onClick={handleInstallClick}
        className="fixed bottom-20 sm:bottom-6 left-3 z-40 bg-slate-900/95 hover:bg-slate-900 text-white rounded-full shadow-xl px-3 py-1.5 backdrop-blur-md border border-slate-700 flex items-center gap-2 cursor-pointer transition active:scale-95 animate-in slide-in-from-bottom duration-200"
      >
        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        </span>

        <span className="text-[11px] font-bold text-slate-100 whitespace-nowrap">
          {currentLanguage === 'ar' 
            ? 'تثبيت التطبيق على الهاتف' 
            : currentLanguage === 'fr' 
            ? "Installer l'application" 
            : 'Install Mobile App'}
        </span>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition -mr-1 rtl:-ml-1 rtl:mr-0 shrink-0"
          title="إغلاق"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </aside>

      {/* Manual Step Guide Modal (Only if browser doesn't support 1-tap prompt like Safari iOS) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  {currentLanguage === 'ar' ? 'تثبيت التطبيق على الهاتف' : "Installer l'application"}
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              {isIos ? (
                <>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                    <Share className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>1. اضغط على زر <b>المشاركة (Share)</b> في أسفل المتصفح Safari.</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                    <PlusSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>2. اختر <b>«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</b>.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>1. اضغط على القائمة (ثلاث نقاط) في أعلى المتصفح.</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>2. اختر <b>«تثبيت التطبيق»</b> أو <b>«Install App»</b>.</span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
