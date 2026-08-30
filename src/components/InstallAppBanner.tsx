import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Check, MoreVertical } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface InstallAppBannerProps {
  currentLanguage?: Language;
}

export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({ currentLanguage = 'ar' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  const t = TRANSLATIONS[currentLanguage];

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Capture Chrome/Android PWA event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 3. Detect iOS Safari or Mobile Browsers
    const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (isIosDevice) {
      setIsIos(true);
    }

    if (isMobile && !isStandalone) {
      // Show install banner on mobile after 1.5 seconds
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowGuideModal(false);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Bottom Floating Install Banner */}
      <aside 
        aria-label="تثبيت التطبيق"
        className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white border border-emerald-300 rounded-2xl shadow-2xl p-3.5 sm:p-4 animate-in slide-in-from-bottom duration-300 flex items-center justify-between gap-3 text-right"
      >
        {/* App Icon */}
        <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Smartphone className="w-5 h-5 text-white" />
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {t.pwa.installTitle}
            </h4>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
              {t.pwa.free}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
            {t.pwa.installDesc}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.pwa.installBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Manual Step-by-Step Installation Modal for iOS / Browser Menus */}
      {showGuideModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowGuideModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 text-slate-900 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold">
                  {isIos ? 'تثبيت التطبيق على الآيفون' : 'تثبيت التطبيق على الهاتف'}
                </h3>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIos ? (
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <div>
                    اضغط على زر المشاركة في شريط متصفح Safari بالأسفل.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <div>
                    مرر للأسفل واختر <span className="font-bold text-slate-900">«إضافة إلى الصفحة الرئيسية»</span>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <div>
                    اضغط على <span className="font-bold text-emerald-700">«إضافة»</span> لتثبيت التطبيق فوراً.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <div>
                    اضغط على قائمة المتصفح (النقاط الثلاث في الزاوية العلوية).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <div>
                    اختر <span className="font-bold text-slate-900">«تثبيت التطبيق»</span> أو <span className="font-bold text-slate-900">«إضافة إلى الشاشة الرئيسية»</span>.
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm transition"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
