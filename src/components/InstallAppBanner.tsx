import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

const DISMISS_KEY = 'win_ntbara3_pwa_install_dismissed';

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if user dismissed recently (in the last 4 days)
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const diffDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (diffDays < 4) {
        return;
      }
    }

    // 3. Android / Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait 2.5 seconds after page load before showing the pleasant popup
      setTimeout(() => {
        setShowBanner(true);
      }, 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. iOS Safari Detection
    const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIosDevice && !isStandalone) {
      setIsIos(true);
      setTimeout(() => {
        setShowBanner(true);
      }, 3500);
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
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIosGuide(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Bottom Floating Install Banner */}
      <aside 
        aria-label="تثبيت التطبيق"
        className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 backdrop-blur-md border border-emerald-200 rounded-2xl shadow-2xl p-3.5 sm:p-4 animate-in slide-in-from-bottom duration-300 flex items-center justify-between gap-3 text-right"
      >
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md">
          <Smartphone className="w-6 h-6 text-emerald-100" />
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              تثبيت تطبيق «وين نتبرع»
            </h4>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
              مجاني
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
            أضف التطبيق لشاشتك للوصول الفوري والعمل بدون إنترنت
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تثبيت</span>
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

      {/* iOS Step-by-Step Installation Modal */}
      {showIosGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowIosGuide(false)}
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
                <h3 className="text-sm font-bold">تثبيت التطبيق على الآيفون (iOS)</h3>
              </div>
              <button onClick={() => setShowIosGuide(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <div>
                  اضغط على زر المشاركة <Share className="w-4 h-4 inline text-blue-600 mx-1" /> في شريط متصفح Safari بالأسفل.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <div>
                  مرر للأسفل واختر <span className="font-bold text-slate-900">«إضافة إلى الصفحة الرئيسية»</span> <PlusSquare className="w-4 h-4 inline text-slate-700 mx-1" />.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <div>
                  اضغط على <span className="font-bold text-emerald-700">«إضافة (Add)»</span> في الزاوية العلوية لتثبيت التطبيق فوراً.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
