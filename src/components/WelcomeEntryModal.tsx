import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  PlusCircle, 
  MapPin, 
  LocateFixed, 
  Loader2, 
  ChevronRight, 
  Compass, 
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Download
} from 'lucide-react';
import { WILAYAS } from '../data/wilayas';
import { Wilaya } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { isWithinAlgeriaBounds } from '../utils/geoParser';
import { usePwaInstall } from '../utils/usePwaInstall';

export type UserIntent = 'find' | 'add' | null;

interface WelcomeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIntentAndWilaya: (intent: 'find' | 'add', wilayaCode: number) => void;
  onDirectMapExplore: () => void;
  onOpenInstall?: () => void;
  currentLanguage: Language;
  initialStep?: 1 | 2;
  initialIntent?: 'find' | 'add';
}

export const WelcomeEntryModal: React.FC<WelcomeEntryModalProps> = ({
  isOpen,
  onClose,
  onSelectIntentAndWilaya,
  onDirectMapExplore,
  onOpenInstall,
  currentLanguage,
  initialStep = 1,
  initialIntent = 'find',
}) => {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [selectedIntent, setSelectedIntent] = useState<'find' | 'add'>(initialIntent);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const t = TRANSLATIONS[currentLanguage];

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setSelectedIntent(initialIntent);
      setSearchQuery('');
      setGpsError('');
    }
  }, [isOpen, initialStep, initialIntent]);

  // Filter wilayas in real-time by Code, Arabic name, or French name
  const filteredWilayas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return WILAYAS;

    return WILAYAS.filter((w) => {
      const matchCode = w.code.toString().startsWith(q) || w.code.toString() === q;
      const matchAr = w.nameAr.toLowerCase().includes(q);
      const matchFr = w.nameFr.toLowerCase().includes(q);
      return matchCode || matchAr || matchFr;
    });
  }, [searchQuery]);

  if (!isOpen) return null;

  const { isStandalone, triggerInstall } = usePwaInstall();

  const handleChooseIntent = (intent: 'find' | 'add') => {
    setSelectedIntent(intent);
    setStep(2);
    setSearchQuery('');
    setGpsError('');
  };

  const handleGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('تحديد الموقع غير مدعوم على متصفحك.');
      return;
    }
    setIsGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        if (!isWithinAlgeriaBounds(userLat, userLng)) {
          setGpsError('موقعك الحالي يقع خارج حدود الجزائر.');
          return;
        }

        // Find closest wilaya center
        const closest = WILAYAS.reduce((prev, curr) => {
          const distPrev = Math.hypot(prev.lat - userLat, prev.lng - userLng);
          const distCurr = Math.hypot(curr.lat - userLat, curr.lng - userLng);
          return distCurr < distPrev ? curr : prev;
        });

        if (closest) {
          onSelectIntentAndWilaya(selectedIntent, closest.code);
        }
      },
      (err) => {
        setIsGpsLoading(false);
        setGpsError('تعذر تحديد الموقع. يرجى البحث عن الولاية يدوياً.');
        console.warn('GPS error in welcome modal:', err);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img 
              src="/win-ntbara3-icon.svg" 
              alt="وين نتبرع" 
              className="w-10 h-10 object-contain rounded-xl shadow-xs shrink-0" 
            />
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                {t.appName}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {step === 2 ? (
            <button
              onClick={() => {
                if (initialStep === 2) {
                  onClose();
                } else {
                  setStep(1);
                }
              }}
              className="p-1.5 px-3 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-bold border border-slate-200 cursor-pointer active:scale-95"
              title={currentLanguage === 'ar' ? 'رجوع' : 'Retour'}
            >
              {currentLanguage === 'ar' ? (
                <>
                  <span>رجوع</span>
                  <ArrowRight className="w-4 h-4 text-slate-700" />
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4 text-slate-700" />
                  <span>{currentLanguage === 'fr' ? 'Retour' : 'Back'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-right">
          {/* Download App Button below Header / Icon (Disappears if running as installed app) */}
          {!isStandalone && (
            <button
              type="button"
              onClick={() => {
                if (onOpenInstall) {
                  onOpenInstall();
                } else {
                  triggerInstall();
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/90 text-emerald-950 transition active:scale-98 shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-emerald-700 text-white shadow-xs">
                  <Download className="w-4 h-4 stroke-[2.5]" />
                </span>
                <div className="text-right">
                  <span className="text-xs font-black block leading-tight">
                    {currentLanguage === 'ar' ? 'تحميل وتثبيت التطبيق على الهاتف' : 'Installer l’application sur votre téléphone'}
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold block">
                    {currentLanguage === 'ar' ? 'وصول فوري وسريع للتبرع والإغاثة' : 'Accès rapide et hors-ligne'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-black bg-emerald-700 text-white px-2.5 py-1 rounded-xl shadow-xs">
                {currentLanguage === 'ar' ? 'تثبيت' : 'Installer'}
              </span>
            </button>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="text-center space-y-1 py-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {currentLanguage === 'ar' 
                    ? 'كيف يمكننا مساعدتك اليوم؟' 
                    : currentLanguage === 'fr' 
                    ? 'Comment pouvons-nous vous aider ?' 
                    : 'How can we help you today?'}
                </h3>
                <p className="text-xs text-slate-600">
                  {currentLanguage === 'ar' 
                    ? 'اختر الخدمة للبدء في توجيه المساعدات بدقة وسرعة' 
                    : currentLanguage === 'fr'
                    ? 'Choisissez une option pour orienter vos dons rapidement'
                    : 'Choose an option to direct aid quickly and accurately'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {/* Button 1: Find a donation spot (Primary Priority Action - Big & Green) */}
                <button
                  type="button"
                  onClick={() => handleChooseIntent('find')}
                  className="group p-4 sm:p-5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white transition shadow-md hover:shadow-lg text-right flex items-center justify-between gap-3 active:scale-[0.99] border border-emerald-700/40"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 bg-white/15 text-white rounded-xl shadow-2xs shrink-0">
                        <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                        {currentLanguage === 'ar' 
                          ? 'البحث عن مركز تبرع أو إغاثة' 
                          : currentLanguage === 'fr' 
                          ? 'Trouver un point de don ou d\'aide' 
                          : 'Find a Donation or Relief Spot'}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-[12.5px] text-emerald-100/90 pr-12 leading-relaxed">
                      {currentLanguage === 'ar'
                        ? 'استكشف نقاط التبرع المعتمدة والمناطق المتضررة في ولايتك وجوارها'
                        : currentLanguage === 'fr'
                        ? 'Consultez les centres actifs dans votre wilaya et ses environs'
                        : 'Explore verified relief hubs and active centers in your wilaya'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/80 rtl:rotate-180 shrink-0 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
                </button>

                {/* Button 2: Add / Pin a donation spot (Secondary Action - Smaller & Clean) */}
                <button
                  type="button"
                  onClick={() => handleChooseIntent('add')}
                  className="group p-3 sm:p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition shadow-2xs text-right flex items-center justify-between gap-3 active:scale-[0.99]"
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-white text-emerald-800 border border-slate-200 rounded-lg shadow-2xs shrink-0">
                        <PlusCircle className="w-4 h-4" />
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        {currentLanguage === 'ar' 
                          ? 'إضافة وتثبيت مركز تبرع جديد' 
                          : currentLanguage === 'fr' 
                          ? 'Ajouter un nouveau point de collecte' 
                          : 'Add or Pin a New Donation Spot'}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 pr-10 leading-normal">
                      {currentLanguage === 'ar'
                        ? 'ساهم في إضافة جمعية، مسجد، أو نقطة تطوع لإرشاد المتبرعين'
                        : currentLanguage === 'fr'
                        ? 'Ajoutez une association ou un lieu de collecte pour guider les donateurs'
                        : 'Share a charity, mosque, or collection point to guide volunteers'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180 shrink-0 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition" />
                </button>
              </div>

              {/* Direct Bypass Link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onDirectMapExplore}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold underline underline-offset-4 transition"
                >
                  {currentLanguage === 'ar'
                    ? 'أو استكشاف كامل الخريطة مباشرة'
                    : currentLanguage === 'fr'
                    ? 'Ou explorer directement toute la carte'
                    : 'Or explore the full map directly'}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Location Step (Search on TOP + Results List + GPS at BOTTOM) */
            <div className="space-y-3">
              {/* Step indicator header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {selectedIntent === 'find' 
                    ? (currentLanguage === 'ar' ? 'الخطوة 2: حدد ولايتك' : 'Step 2: Choose Wilaya')
                    : (currentLanguage === 'ar' ? 'الخطوة 2: أين يقع المركز؟' : 'Step 2: Where is the hub?')}
                </span>
              </div>

              {/* 1. Live Type-to-Filter Search Box (ON TOP) */}
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    currentLanguage === 'ar'
                      ? 'اكتب رقم الولاية أو اسمها (مثال: 16، تيزي، الجزائر، سطيف...)'
                      : 'Tapez le nom ou numéro de wilaya (ex: 15, Alger, Béjaïa...)'
                  }
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:border-emerald-700 focus:bg-white rounded-2xl px-4 py-3 pl-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-medium shadow-2xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 2. Wilayas Filtered Result List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white shadow-2xs">
                {filteredWilayas.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    لا توجد ولاية مطابقة للبحث
                  </div>
                ) : (
                  filteredWilayas.map((wilaya: Wilaya) => (
                    <button
                      key={wilaya.code}
                      type="button"
                      onClick={() => onSelectIntentAndWilaya(selectedIntent, wilaya.code)}
                      className="w-full px-4 py-2.5 text-xs hover:bg-emerald-50/50 transition flex items-center justify-between group text-right"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-700 group-hover:text-white font-mono font-bold text-[11px] text-slate-700 flex items-center justify-center transition shrink-0">
                          {wilaya.code}
                        </span>
                        <span className="font-bold text-slate-900 group-hover:text-emerald-950">
                          {currentLanguage === 'ar' ? wilaya.nameAr : wilaya.nameFr}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({currentLanguage === 'ar' ? wilaya.nameFr : wilaya.nameAr})
                        </span>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 rtl:rotate-180 transition" />
                    </button>
                  ))
                )}
              </div>

              {/* 3. Divider */}
              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold">
                  {currentLanguage === 'ar' ? 'أو استخدم تحديد الموقع' : 'ou par GPS'}
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* 4. 1-Tap GPS Button (Moved to the BOTTOM) */}
              <button
                type="button"
                onClick={handleGpsLocation}
                disabled={isGpsLoading}
                className="w-full p-2.5 sm:p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] disabled:opacity-75"
              >
                {isGpsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <LocateFixed className="w-4 h-4 text-emerald-400" />
                )}
                <span>
                  {currentLanguage === 'ar'
                    ? 'تحديد موقعي الحالي تلقائياً (GPS)'
                    : currentLanguage === 'fr'
                    ? 'Utiliser ma position actuelle (GPS)'
                    : 'Use My Current Location (GPS)'}
                </span>
              </button>

              {gpsError && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
                  {gpsError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
