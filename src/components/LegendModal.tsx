import React from 'react';
import { X, Layers, CheckCircle2, Flame, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage?: Language;
  showFireZones?: boolean;
  onToggleFireZones?: (show: boolean) => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({
  isOpen,
  onClose,
  currentLanguage = 'ar',
  showFireZones = true,
  onToggleFireZones,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">مفتاح الخريطة</h3>
              <p className="text-xs text-slate-500">دلالات ألوان ورموز النقاط والتحكم في الطبقات</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 text-right">
          {/* Fire Zones Interactive Toggle Switch */}
          {onToggleFireZones && (
            <div className="p-3.5 bg-red-50/90 border border-red-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-red-600 shrink-0 shadow-xs"></span>
                <div>
                  <h4 className="text-xs font-bold text-red-950">إظهار مناطق الحرائق على الخريطة</h4>
                  <p className="text-[11px] text-red-700 mt-0.5">تفعيل أو إخفاء طبقة مناطق وبؤر الحرائق</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={showFireZones}
                  onChange={(e) => onToggleFireZones(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          )}

          {/* 1. Verified Donation Hub */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-emerald-700 shrink-0 shadow-xs"></span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-emerald-950">نقطة تبرع مؤكدة (رسمية)</h4>
              <p className="text-[11px] text-emerald-800 mt-0.5">مراكز الهلال الأحمر الجزائري، الكشافة، والجمعيات المعتمدة.</p>
            </div>
          </div>

          {/* 2. Unconfirmed Point */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-amber-600 shrink-0 shadow-xs"></span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-950">نقطة تبرع غير مؤكدة</h4>
              <p className="text-[11px] text-amber-800 mt-0.5">مبادرات تطوعية ومستودعات شعبية (يرجى الاتصال للتأكد قبل التنقل).</p>
            </div>
          </div>

          {/* 3. Contained Fire */}
          <div className="p-3 bg-slate-100 border border-slate-300 rounded-2xl flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-slate-600 shrink-0 shadow-xs"></span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-900">حرائق تم إخمادها والسيطرة عليها</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">مناطق غابية منكوبة تم إخماد النيران بها وهي في طور الإغاثة.</p>
            </div>
          </div>

          {/* 4. Active Fire */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-red-600 shrink-0 shadow-xs"></span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-red-950">بؤر حرائق نشطة</h4>
              <p className="text-[11px] text-red-700 mt-0.5">مناطق عمليات الحماية المدنية (يرجى توخي الحذر والابتعاد).</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition active:scale-98"
          >
            فهمت
          </button>
        </div>
      </div>
    </div>
  );
};
