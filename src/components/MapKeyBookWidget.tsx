import React, { useState } from 'react';
import { KeyRound, X, Home, Heart, AlertCircle, Flame } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface MapKeyBookWidgetProps {
  currentLanguage?: Language;
}

export const MapKeyBookWidget: React.FC<MapKeyBookWidgetProps> = ({ currentLanguage = 'ar' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.ar;
  const mk = t.mapKeys;

  return (
    <div className="fixed bottom-20 right-3 sm:right-5 z-30 select-none pointer-events-none">
      {/* 1. Slide-in White Legend Panel from the Side */}
      <div 
        className={`pointer-events-auto transition-all duration-300 ease-out transform ${
          isOpen 
            ? 'opacity-100 translate-x-0 scale-100' 
            : 'opacity-0 translate-x-12 scale-95 pointer-events-none'
        }`}
      >
        <div className="w-68 sm:w-76 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl text-right space-y-3">
          {/* Header with Title and Reverse X Close Button */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-700 text-white rounded-lg shadow-xs">
                <KeyRound className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-black text-slate-900">
                {mk.title}
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition active:scale-90"
              title={currentLanguage === 'ar' ? 'إغلاق ومغادرة الدليل' : 'Fermer'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Map Keys List with Real SVG Pins */}
          <div className="space-y-2.5 text-[12px] font-medium text-slate-800">
            {/* 1. Verified Donation Hub */}
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Heart className="w-3 h-3 fill-current" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 block leading-tight">{mk.verified}</span>
                <span className="text-[10.5px] text-slate-500">{mk.verifiedDesc}</span>
              </div>
            </div>

            {/* 2. Shelter Center */}
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Home className="w-3 h-3 stroke-[2.5]" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 block leading-tight">{mk.shelter}</span>
                <span className="text-[10.5px] text-emerald-800 font-bold">{mk.shelterDesc}</span>
              </div>
            </div>

            {/* 3. Unconfirmed Spot */}
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertCircle className="w-3 h-3 stroke-[2.5]" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 block leading-tight">{mk.unconfirmed}</span>
                <span className="text-[10.5px] text-amber-700 font-medium">{mk.unconfirmedDesc}</span>
              </div>
            </div>

            {/* 4. Active Fire Zone */}
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Flame className="w-3 h-3 stroke-[2.5]" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-red-700 block leading-tight">{mk.activeFire}</span>
                <span className="text-[10.5px] text-red-500">{mk.activeFireDesc}</span>
              </div>
            </div>

            {/* 5. Extinguished Fire Zone */}
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Flame className="w-3 h-3 stroke-[2.5]" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-700 block leading-tight">{mk.extinguishedFire}</span>
                <span className="text-[10.5px] text-slate-500">{mk.extinguishedFireDesc}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Floating Key Button that Fades Out when panel opens */}
      <div className={`pointer-events-auto transition-all duration-300 ease-out ${
        isOpen 
          ? 'opacity-0 scale-75 pointer-events-none' 
          : 'opacity-100 scale-100'
      }`}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl shadow-lg border bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300 transition active:scale-95 cursor-pointer"
          title={t.legend}
        >
          <span className="p-1.5 rounded-lg bg-emerald-700 text-white shadow-xs">
            <KeyRound className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
          <span className="text-xs font-black">
            {t.legend}
          </span>
        </button>
      </div>
    </div>
  );
};
