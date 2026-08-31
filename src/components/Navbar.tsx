import React, { useState } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Globe, 
  Check,
  RefreshCw,
  Download
} from 'lucide-react';
import { WILAYAS } from '../data/wilayas';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { usePwaInstall } from '../utils/usePwaInstall';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenNearestDrawer: () => void;
  onOpenAdmin: () => void;
  onOpenInstall?: () => void;
  selectedWilaya: number | null;
  onSelectWilaya: (code: number | null) => void;
  totalPoints: number;
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenNearestDrawer,
  onOpenAdmin,
  onOpenInstall,
  selectedWilaya,
  onSelectWilaya,
  totalPoints,
  currentLanguage,
  onSelectLanguage,
  onRefresh,
  isRefreshing = false,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { isStandalone, triggerInstall } = usePwaInstall();
  const t = TRANSLATIONS[currentLanguage];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'ar', label: 'العربية', flag: '🇩🇿' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs shrink-0 select-none">
      {/* Main Bar */}
      <div className="px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-3 max-w-7xl mx-auto">
        {/* Brand */}
        <div 
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0" 
          onClick={() => onSelectWilaya(null)}
          title="الرئيسية / إعادة ضبط الخريطة"
        >
          <img 
            src="/win-ntbara3-icon.svg" 
            alt="وين نتبرع" 
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg shadow-xs" 
          />
          <div>
            <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-none flex items-center gap-1">
              <span>{t.appName}</span>
            </h1>
            <span className="text-[9px] sm:text-[10px] text-emerald-800 font-bold hidden md:block">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Wilaya Filter Dropdown */}
        <div className="flex-1 max-w-[140px] xs:max-w-[170px] sm:max-w-[220px]">
          <div className="relative">
            <select
              value={selectedWilaya ?? ''}
              onChange={(e) => onSelectWilaya(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 text-[11px] sm:text-xs rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 appearance-none cursor-pointer truncate font-bold transition shadow-2xs"
            >
              <option value="">{currentLanguage === 'ar' ? 'كل الولايات' : currentLanguage === 'fr' ? 'Toutes les wilayas' : 'All Wilayas'}</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} - {currentLanguage === 'ar' ? w.nameAr : w.nameFr}
                </option>
              ))}
            </select>
            <MapPin className="w-3 h-3 text-slate-400 absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Header Action Buttons (Refresh, Language Switcher & Admin) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Small Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold flex items-center justify-center transition active:scale-90 disabled:opacity-50"
              title="تحديث البيانات المباشرة / Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          )}

          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition active:scale-95"
              title="تغيير اللغة / Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[10px] sm:text-xs font-black">{currentLanguage === 'ar' ? 'عربي' : currentLanguage === 'fr' ? 'FR' : 'EN'}</span>
            </button>

            {showLangMenu && (
              <div 
                className="absolute left-0 sm:right-0 sm:left-auto mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowLangMenu(false)}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => onSelectLanguage(lang.code)}
                    className={`w-full px-3 py-1.5 text-xs font-bold flex items-center justify-between hover:bg-slate-100 transition ${
                      currentLanguage === lang.code ? 'text-slate-900 bg-slate-100' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    {currentLanguage === lang.code && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Admin Button */}
          <button
            onClick={onOpenAdmin}
            className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition active:scale-95"
            title={t.adminPanel}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
          </button>
        </div>
      </div>
    </header>
  );
};
