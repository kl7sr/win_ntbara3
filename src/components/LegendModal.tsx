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
        <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">مفتاح الخريطة</h3>
              <p className="text-[11px] text-slate-500">دلالات ألوان ورموز النقاط والطبقات</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition active:scale-95"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 text-right">
          {/* Fire Layer Interactive Toggle */}
          {onToggleFireZones && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100/80 text-red-700 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">إظهار مناطق الحرائق على الخريطة</h4>
                  <p className="text-[10.5px] text-slate-500">تفعيل أو إخفاء علامات بؤر الحرائق</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={showFireZones}
                  onChange={(e) => onToggleFireZones(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
              </label>
            </div>
          )}

          {/* Unified Legend Elements Card */}
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
            {/* 1. Verified Donation Hub */}
            <div className="p-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition">
              <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0 mt-1"></span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">نقطة تبرع مؤكدة</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">مراكز الهلال الأحمر الجزائري، الكشافة الإسلامية والجمعيات المعتمدة.</p>
              </div>
            </div>

            {/* 2. Unconfirmed Point */}
            <div className="p-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 mt-1"></span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">نقطة تبرع غير مؤكدة</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">مبادرات تطوعية ومستودعات شعبية (يُرجى الاتصال للتأكد قبل التنقل).</p>
              </div>
            </div>

            {/* 3. Active Fire */}
            <div className="p-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition">
              <span className="w-3 h-3 rounded-full bg-red-600 shrink-0 mt-1"></span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">بؤرة حريق نشطة</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">مناطق عمليات وتدخل الحماية المدنية (يرجى توخي الحذر والابتعاد).</p>
              </div>
            </div>

            {/* 4. Contained Fire */}
            <div className="p-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition">
              <span className="w-3 h-3 rounded-full bg-slate-500 shrink-0 mt-1"></span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">حرائق تم إخمادها</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">مناطق تم إخماد النيران والسيطرة عليها وهي في طور الإغاثة.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-98"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
