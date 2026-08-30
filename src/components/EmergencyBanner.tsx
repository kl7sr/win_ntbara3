import React from 'react';
import { HeartHandshake } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-emerald-950 text-white px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-xs border-b border-emerald-900 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        {/* Title */}
        <div className="flex items-center gap-1.5 shrink-0">
          <HeartHandshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-bold text-[11px] sm:text-xs text-white">
            طوارئ الجزائر
          </span>
        </div>

        {/* Quick Emergency Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Firefighters / Civil Protection (14) */}
          <a
            href="tel:14"
            className="bg-red-700 hover:bg-red-600 px-2 py-0.5 rounded text-white font-bold flex items-center gap-1 transition active:scale-95 text-[10.5px] sm:text-xs shadow-xs"
            title="الحماية المدنية (14)"
          >
            <span>الحماية:</span>
            <span className="font-mono font-black underline">14</span>
          </a>

          {/* Police (1548) */}
          <a
            href="tel:1548"
            className="bg-blue-800 hover:bg-blue-700 px-2 py-0.5 rounded text-white font-bold flex items-center gap-1 transition active:scale-95 text-[10.5px] sm:text-xs shadow-xs"
            title="الشرطة والأمن الوطني (1548)"
          >
            <span>الشرطة:</span>
            <span className="font-mono font-black underline">1548</span>
          </a>

          {/* Gendarmerie (1055) */}
          <a
            href="tel:1055"
            className="bg-emerald-800 hover:bg-emerald-700 px-2 py-0.5 rounded text-white font-bold flex items-center gap-1 transition active:scale-95 text-[10.5px] sm:text-xs shadow-xs"
            title="الدرك الوطني (1055)"
          >
            <span>الدرك:</span>
            <span className="font-mono font-black underline">1055</span>
          </a>

          {/* Red Crescent */}
          <a
            href="tel:021633266"
            className="hidden xs:flex bg-emerald-900/90 hover:bg-emerald-800 px-2 py-0.5 rounded text-emerald-100 hover:text-white border border-emerald-800 items-center gap-1 transition text-[10.5px] sm:text-xs"
            title="الهلال الأحمر الجزائري"
          >
            <span>الهلال الأحمر:</span>
            <span dir="ltr" className="font-mono font-bold">021633266</span>
          </a>
        </div>
      </div>
    </div>
  );
};
