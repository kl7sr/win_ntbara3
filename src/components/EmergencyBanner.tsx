import React from 'react';
import { HeartHandshake, Phone } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface EmergencyBannerProps {
  currentLanguage?: Language;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ currentLanguage = 'ar' }) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.ar;
  const em = t.emergency;

  return (
    <div className="bg-emerald-950 text-white px-2 sm:px-4 py-1 text-[10px] sm:text-xs border-b border-emerald-900 shadow-xs shrink-0 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1">
        {/* Title */}
        <div className="flex items-center gap-1 shrink-0">
          <HeartHandshake className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="font-bold text-[10.5px] sm:text-xs text-emerald-100 whitespace-nowrap">
            {em.bannerTitle}
          </span>
        </div>

        {/* Quick Emergency Badges */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Firefighters / Civil Protection (14) */}
          <a
            href="tel:14"
            className="bg-red-700 hover:bg-red-600 px-1.5 py-0.5 rounded text-white font-bold flex items-center gap-1 transition active:scale-95 text-[10px] sm:text-[11px] shadow-xs shrink-0 no-underline"
            title={`${em.firefighters} 14`}
          >
            <Phone className="w-2.5 h-2.5 shrink-0" />
            <span>{em.firefighters}</span>
            <span className="font-mono font-black">14</span>
          </a>

          {/* Police (1548) */}
          <a
            href="tel:1548"
            className="bg-blue-800 hover:bg-blue-700 px-1.5 py-0.5 rounded text-white font-bold flex items-center gap-1 transition active:scale-95 text-[10px] sm:text-[11px] shadow-xs shrink-0 no-underline"
            title={`${em.police} 1548`}
          >
            <Phone className="w-2.5 h-2.5 shrink-0" />
            <span>{em.police}</span>
            <span className="font-mono font-black">1548</span>
          </a>

          {/* Gendarmerie (1055) */}
          <a
            href="tel:1055"
            className="bg-emerald-800 hover:bg-emerald-700 px-1.5 py-0.5 rounded text-white font-bold flex items-center gap-1 transition active:scale-95 text-[10px] sm:text-[11px] shadow-xs shrink-0 no-underline"
            title={`${em.gendarmerie} 1055`}
          >
            <Phone className="w-2.5 h-2.5 shrink-0" />
            <span>{em.gendarmerie}</span>
            <span className="font-mono font-black">1055</span>
          </a>

          {/* Red Crescent */}
          <a
            href="tel:021633266"
            className="hidden sm:flex bg-emerald-900 hover:bg-emerald-800 px-1.5 py-0.5 rounded text-emerald-200 hover:text-white border border-emerald-800 items-center gap-1 transition text-[10px] sm:text-[11px] shrink-0 no-underline"
            title={`${em.redCrescent} 021633266`}
          >
            <Phone className="w-2.5 h-2.5 shrink-0" />
            <span>{em.redCrescent}</span>
            <span dir="ltr" className="font-mono font-bold">021633266</span>
          </a>
        </div>
      </div>
    </div>
  );
};
