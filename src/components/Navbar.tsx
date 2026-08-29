import React from 'react';
import { 
  PlusCircle, 
  Compass, 
  ShieldCheck, 
  MapPin, 
  HeartHandshake, 
  Utensils, 
  Shirt, 
  HeartPulse, 
  BedDouble, 
  Baby,
  Filter
} from 'lucide-react';
import { WILAYAS } from '../data/wilayas';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenNearestDrawer: () => void;
  onOpenAdmin: () => void;
  selectedWilaya: number | null;
  onSelectWilaya: (code: number | null) => void;
  activeFilter: string | null;
  onSelectFilter: (category: string | null) => void;
  totalPoints: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenNearestDrawer,
  onOpenAdmin,
  selectedWilaya,
  onSelectWilaya,
  activeFilter,
  onSelectFilter,
  totalPoints,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Mobile Bar */}
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
              <span>وين نتبرع</span>
            </h1>
            <span className="text-[10px] text-emerald-800 font-semibold hidden sm:block">
              المنصة الوطنية للتبرعات والإغاثة
            </span>
          </div>
        </div>

        {/* Wilaya Filter Dropdown - Compact on Mobile */}
        <div className="flex-1 max-w-[170px] sm:max-w-[220px]">
          <div className="relative">
            <select
              value={selectedWilaya ?? ''}
              onChange={(e) => onSelectWilaya(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 pr-6 focus:outline-none focus:ring-1 focus:ring-emerald-600 appearance-none cursor-pointer truncate font-medium"
            >
              <option value="">كل الولايات ({totalPoints})</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} - {w.nameAr}
                </option>
              ))}
            </select>
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Header Action Buttons (Desktop & Tablet) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenAdmin}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200"
            title="الإدارة"
          >
            <ShieldCheck className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Touch-scrollable Category Filter Bar */}
      <div className="px-3 py-1.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs bg-slate-50/70 no-scrollbar">
        <button
          onClick={() => onSelectFilter(null)}
          className={`px-3 py-1 rounded-md font-semibold transition whitespace-nowrap text-xs ${
            activeFilter === null
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          الكل ({totalPoints})
        </button>

        <button
          onClick={() => onSelectFilter('food_water')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap text-xs ${
            activeFilter === 'food_water'
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <Utensils className="w-3 h-3 text-emerald-600" />
          <span>مواد غذائية</span>
        </button>

        <button
          onClick={() => onSelectFilter('clothes')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap text-xs ${
            activeFilter === 'clothes'
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <Shirt className="w-3 h-3 text-emerald-600" />
          <span>ملابس</span>
        </button>

        <button
          onClick={() => onSelectFilter('medical')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap text-xs ${
            activeFilter === 'medical'
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <HeartPulse className="w-3 h-3 text-red-600" />
          <span>أدوية</span>
        </button>

        <button
          onClick={() => onSelectFilter('shelter')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap text-xs ${
            activeFilter === 'shelter'
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <BedDouble className="w-3 h-3 text-emerald-600" />
          <span>أفرشة</span>
        </button>

        <button
          onClick={() => onSelectFilter('baby_supplies')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap text-xs ${
            activeFilter === 'baby_supplies'
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <Baby className="w-3 h-3 text-emerald-600" />
          <span>رضع</span>
        </button>
      </div>
    </header>
  );
};
