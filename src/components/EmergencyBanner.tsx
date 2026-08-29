import React from 'react';
import { Phone, HeartHandshake, Info } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-emerald-800 text-white px-4 py-2 text-xs border-b border-emerald-900">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-200" />
          <span className="font-semibold">
            دليل مواقع ونقاط جمع التبرعات والمساعدات الإنسانية في الجزائر
          </span>
        </div>

        <div className="flex items-center gap-4 text-emerald-100">
          <a href="tel:021633266" className="hover:text-white flex items-center gap-1 transition">
            <Phone className="w-3 h-3 text-red-300" />
            <span>الهلال الأحمر الجزائري: 021633266</span>
          </a>
          <span className="text-emerald-500">|</span>
          <a href="tel:115" className="hover:text-white flex items-center gap-1 transition">
            <Phone className="w-3 h-3 text-red-300" />
            <span>الإسعاف: 115</span>
          </a>
        </div>
      </div>
    </div>
  );
};
