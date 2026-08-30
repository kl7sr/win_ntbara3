import React, { useState } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Globe, 
  Check
} from 'lucide-react';
import { WILAYAS } from '../data/wilayas';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenNearestDrawer: () => void;
  onOpenAdmin: () => void;
  selectedWilaya: number | null;
  onSelectWilaya: (code: number | null) => void;
  totalPoints: number;
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenNearestDrawer,
  onOpenAdmin,
  selectedWilaya,
  onSelectWilaya,
  totalPoints,
  currentLanguage,
  onSelectLanguage,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = TRANSLATIONS[currentLanguage];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'ar', label: 'العربية', flag: '🇩🇿' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Main Bar */}
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand */}
        <div 
          className="flex items-center gap-2 cursor-pointer shrink-0" 
          onClick={() => onSelectWilaya(null)}
        >
          <img 
            src="/win-ntbara3-icon.svg" 
            alt="وين نتبرع" 
            className="w-9 h-9 object-contain rounded-xl shadow-xs" 
          />
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-1">
              <span>{t.appName}</span>
            </h1>
            <span className="text-[10px] text-emerald-800 font-semibold hidden sm:block">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Wilaya Filter Dropdown */}
        <div className="flex-1 max-w-[170px] sm:max-w-[220px]">
          <div className="relative">
            <select
              value={selectedWilaya ?? ''}
              onChange={(e) => onSelectWilaya(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 appearance-none cursor-pointer truncate font-medium"
            >
              <option value="">{currentLanguage === 'ar' ? 'اختر الولاية' : currentLanguage === 'fr' ? 'Choisir la wilaya' : 'Select Wilaya'}</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} - {currentLanguage === 'ar' ? w.nameAr : w.nameFr}
                </option>
              ))}
            </select>
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Header Action Buttons (Language Switcher & Admin) */}
        <div className="flex items-center gap-1.5">
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold flex items-center gap-1 transition"
              title="تغيير اللغة / Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-xs">{currentLanguage === 'ar' ? 'العربية' : currentLanguage === 'fr' ? 'FR' : 'EN'}</span>
            </button>

            {showLangMenu && (
              <div 
                className="absolute left-0 sm:right-0 sm:left-auto mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowLangMenu(false)}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => onSelectLanguage(lang.code)}
                    className={`w-full px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition ${
                      currentLanguage === lang.code ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
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
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
            title={t.adminPanel}
          >
            <ShieldCheck className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>
    </header>
  );
};
