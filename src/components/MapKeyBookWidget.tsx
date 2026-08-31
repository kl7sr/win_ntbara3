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
    <div className="fixed bottom-20 right-3 sm:right-5 z-30 select-none">
      {/* Attached Map Key Card (Unfolds when clicked) */}
      {isOpen && (
        <div className="mb-2 w-64 sm:w-72 bg-white/98 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-2xl text-right animate-in slide-in-from-bottom-3 duration-200 space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-700 text-white rounded-lg shadow-2xs">
                <KeyRound className="w-3.5 h-3.5" />
              </span>
              <h4 className="text-xs font-bold text-slate-900">
                {mk.title}
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title={currentLanguage === 'ar' ? 'إغلاق' : 'Fermer'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Map Keys List with Real SVG Pins */}
          <div className="space-y-2 text-[11.5px] font-medium text-slate-800">
            {/* 1. Verified Donation Hub */}
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Heart className="w-3 h-3 fill-current" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 block leading-tight">{mk.verified}</span>
                <span className="text-[10px] text-slate-500">{mk.verifiedDesc}</span>
              </div>
            </div>

            {/* 2. Shelter Center */}
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Home className="w-3 h-3 stroke-[2.5]" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 block leading-tight">{mk.shelter}</span>
                <span className="text-[10px] text-emerald-800 font-bold">{mk.shelterDesc}</span>
              </div>
            </div>

            {/* 3. Unconfirmed Spot */}
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <AlertCircle className="w-3 h-3 stroke-[2.5]" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 block leading-tight">{mk.unconfirmed}</span>
                <span className="text-[10px] text-amber-700">{mk.unconfirmedDesc}</span>
              </div>
            </div>

            {/* 4. Active Fire Zone */}
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Flame className="w-3 h-3 stroke-[2.5]" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-red-700 block leading-tight">{mk.activeFire}</span>
                <span className="text-[10px] text-red-500">{mk.activeFireDesc}</span>
              </div>
            </div>

            {/* 5. Extinguished Fire Zone */}
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Flame className="w-3 h-3 stroke-[2.5]" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-700 block leading-tight">{mk.extinguishedFire}</span>
                <span className="text-[10px] text-slate-500">{mk.extinguishedFireDesc}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Holder Tab Button with Key Icon */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-2 rounded-2xl shadow-lg border transition active:scale-95 ${
          isOpen
            ? 'bg-emerald-800 text-white border-emerald-900 shadow-xl'
            : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300 backdrop-blur-md'
        }`}
        title={t.legend}
      >
        <span className={`p-1.5 rounded-lg ${isOpen ? 'bg-white/20 text-white' : 'bg-emerald-700 text-white shadow-2xs'}`}>
          <KeyRound className="w-3.5 h-3.5 stroke-[2.5]" />
        </span>
        <span className="text-xs font-black">
          {t.legend}
        </span>
      </button>
    </div>
  );
};
