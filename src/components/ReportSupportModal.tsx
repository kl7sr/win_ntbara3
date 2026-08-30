import React from 'react';
import { X, Wrench, Phone, MessageSquare, ExternalLink, Instagram } from 'lucide-react';
import { Language } from '../i18n/translations';

interface ReportSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage?: Language;
}

export const ReportSupportModal: React.FC<ReportSupportModalProps> = ({
  isOpen,
  onClose,
  currentLanguage = 'ar',
}) => {
  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const text = encodeURIComponent('السلام عليكم، أود الإبلاغ عن مشكلة تقنية / تعديل نقطة على منصة وين نتبرع:');
    window.open(`https://wa.me/213542258712?text=${text}`, '_blank');
  };

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
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">الدعم الفني والإبلاغ</h3>
              <p className="text-xs text-slate-500">للإبلاغ عن خطأ أو طلب مساعدة تقنية</p>
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
          {/* Direct Support Phone */}
          <a
            href="tel:0542258712"
            className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between transition hover:bg-emerald-100 active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">الاتصال بالدعم الفني</h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">متاح 24/7 لخدمة المتطوعين</p>
              </div>
            </div>
            <span dir="ltr" className="text-xs font-mono font-bold text-emerald-900 bg-white px-2 py-1 rounded-lg border border-emerald-200">
              0542258712
            </span>
          </a>

          {/* WhatsApp Support */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full p-3.5 bg-emerald-800 text-white rounded-2xl flex items-center justify-between transition hover:bg-emerald-900 active:scale-98 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 text-white rounded-xl">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold">مراسلة الدعم عبر واتساب</h4>
                <p className="text-[11px] text-emerald-100 mt-0.5">إرسال تفاصيل الخطأ أو صور المركز</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white/15 px-2.5 py-1 rounded-lg">
              فتح المحادثة 💬
            </span>
          </button>

          {/* Instagram Link */}
          <a
            href="https://www.instagram.com/win_ntbara3/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white rounded-2xl flex items-center justify-between transition hover:opacity-95 active:scale-98 shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 text-white rounded-xl">
                <Instagram className="w-4 h-4" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold">صفحة التطبيق على إنستغرام</h4>
                <p className="text-[11px] text-white/90 mt-0.5">@win_ntbara3 (متابعة آخر الأخبار والتحديثات)</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span>زيارة</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </a>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
