import React from 'react';
import { Calendar, Clock, AlertCircle, X, Building2, Sparkles } from 'lucide-react';

interface RegistrationNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrgModal?: () => void;
  openDateText?: string;
}

export const RegistrationNoticeModal: React.FC<RegistrationNoticeModalProps> = ({
  isOpen,
  onClose,
  onOpenOrgModal,
  openDateText = '5 สิงหาคม 2569',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 text-white relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white leading-tight">
              ยังไม่ถึงกำหนดเปิดรับลงทะเบียน
            </h3>
            <p className="text-xs text-amber-100 font-medium">
              ลงทะเบียนสำหรับบุคคลทั่วไป
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full bg-black/10 hover:bg-black/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Highlight Badge Box */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/80 rounded-2xl text-amber-950 space-y-2 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-orange-600 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>กำหนดการเปิดรับลงทะเบียน</span>
            </div>
            <div className="text-2xl font-black text-amber-900 tracking-tight">
              {openDateText}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              (ระบบจะเปิดให้กดลงทะเบียนได้ในวันที่ 5 สิงหาคม 2569 เป็นต้นไป)
            </p>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed text-left bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                ขออภัยในความไม่สะดวก ขณะนี้ระบบยังไม่เปิดรับลงทะเบียนบุคคลทั่วไป กรุณากลับมาลงทะเบียนอีกครั้งเมื่อถึงวันเปิดรับระบบ
              </p>
            </div>
            {onOpenOrgModal && (
              <div className="pt-2 border-t border-slate-200 mt-2 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-slate-700">
                  สำหรับ <strong className="text-purple-700 font-bold">คณะครู นักเรียน หรือหน่วยงาน/โรงเรียน</strong> ที่ได้รับหนังสือเชิญ สามารถลงทะเบียนในนามหน่วยงานได้ล่วงหน้า
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
            {onOpenOrgModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenOrgModal();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4 text-purple-200" />
                <span>ลงทะเบียนสำหรับหน่วยงาน</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition-all cursor-pointer"
            >
              รับทราบ (ปิดหน้าต่าง)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
