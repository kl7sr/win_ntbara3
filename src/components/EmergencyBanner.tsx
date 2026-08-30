import React from 'react';
import { Phone, HeartHandshake, Wrench, Flame, ShieldAlert } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-emerald-950 text-white px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-xs border-b border-emerald-900 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-1.5 sm:gap-3">
        {/* Title */}
        <div className="flex items-center gap-1.5 shrink-0">
          <HeartHandshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-bold text-[10.5px] sm:text-xs text-white">
            دليل التبرع والإغاثة
          </span>
        </div>

        {/* Quick Emergency & Support Call Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Firefighters / Civil Protection (14) */}
          <a
            href="tel:14"
            className="bg-red-700 hover:bg-red-600 px-2 py-0.5 rounded-md text-white font-bold flex items-center gap-1 transition shadow-xs active:scale-95 text-[10.5px] sm:text-xs"
            title="الاتصال بالحماية المدنية للطوارئ والحرائق"
          >
            <Phone className="w-3 h-3 animate-pulse text-white" />
            <span>الحماية المدنية:</span>
            <span className="font-mono font-black underline">14</span>
          </a>

          {/* Red Crescent Hotline */}
          <a
            href="tel:021633266"
            className="hidden xs:flex bg-emerald-800 hover:bg-emerald-700 px-2 py-0.5 rounded-md text-white font-semibold items-center gap-1 transition text-[10.5px] sm:text-xs"
            title="الاتصال بالهلال الأحمر الجزائري"
          >
            <Phone className="w-2.5 h-2.5 text-emerald-300" />
            <span>الهلال الأحمر:</span>
            <span dir="ltr" className="font-mono font-bold">021633266</span>
          </a>

          {/* Tech Support */}
          <a
            href="tel:0542258712"
            className="bg-emerald-900/90 hover:bg-emerald-800 px-1.5 py-0.5 rounded-md text-emerald-200 hover:text-white border border-emerald-800 flex items-center gap-1 transition text-[10px] sm:text-[11px]"
            title="للمشاكل التقنية"
          >
            <Wrench className="w-2.5 h-2.5 text-amber-400" />
            <span className="hidden sm:inline">الدعم التقني:</span>
            <span dir="ltr" className="font-mono font-bold">0542258712</span>
          </a>
        </div>
      </div>
    </div>
  );
};
