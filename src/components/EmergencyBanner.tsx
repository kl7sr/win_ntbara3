import React from 'react';
import { Phone, HeartHandshake, Wrench } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-emerald-900 text-white px-3 sm:px-4 py-2 text-[11px] sm:text-xs border-b border-emerald-950">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="font-semibold">
            دليل مواقع ونقاط جمع التبرعات والمناطق المنكوبة بالجزائر
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-emerald-100">
          <a 
            href="tel:0542258712" 
            className="bg-emerald-800/80 hover:bg-emerald-700 px-2 py-0.5 rounded-md border border-emerald-700 text-white flex items-center gap-1.5 transition font-medium"
            title="اتصل بالدعم الفني في حال وجود أي مشكل تقني"
          >
            <Wrench className="w-3 h-3 text-amber-300" />
            <span>للمشاكل التقنية:</span>
            <span dir="ltr" className="font-mono font-bold tracking-wide">0542258712</span>
          </a>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-emerald-700">|</span>
            <a href="tel:021633266" className="hover:text-white flex items-center gap-1 transition">
              <Phone className="w-3 h-3 text-red-300" />
              <span>الهلال الأحمر: 021633266</span>
            </a>
            <span className="text-emerald-700">|</span>
            <a href="tel:14" className="hover:text-white flex items-center gap-1 transition">
              <Phone className="w-3 h-3 text-red-300" />
              <span>الحماية المدنية: 14</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
