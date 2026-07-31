import React from 'react';
import { Building2, ExternalLink, QrCode, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface OrgRegistrationNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ORG_FORM_URL = 'https://docs.google.com/forms/d/1dG7ywLC9rDMI5VDEP8nk4otjCyvL03aLivY9cjSN0G4/viewform?edit_requested=true';

export const OrgRegistrationNoticeModal: React.FC<OrgRegistrationNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleProceed = () => {
    window.open(ORG_FORM_URL, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-5 border-b border-purple-800/50 text-white relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              ลงทะเบียนสำหรับหน่วยงาน / โรงเรียน
            </h3>
            <p className="text-xs text-purple-200">
              สำหรับสถาบันการศึกษาและคณะผู้แทนหน่วยงาน
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-purple-300 hover:text-white rounded-full bg-purple-950/60 hover:bg-purple-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-left">
          {/* Important Notice Alert Box */}
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-amber-800">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <span>แจ้งเตือนสำคัญ</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed text-amber-900">
              หากลงทะเบียนใน QR Code ที่ได้รับในหนังสือเชิญแล้ว ไม่ต้องลงทะเบียนซ้ำ
            </p>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              ท่านกำลังจะไปยังแบบฟอร์มลงทะเบียนสำหรับสถาบันการศึกษา โรงเรียน หรือหน่วยงานภายนอก
              เพื่อแจ้งความประสงค์เข้าร่วมงานเป็นหมู่คณะ
            </p>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium">
              <QrCode className="w-4 h-4 text-orange-500 shrink-0" />
              <span>หากได้รับหนังสือเชิญอย่างเป็นทางการและตอบรับแล้ว ข้อมูลของท่านจะถูกบันทึกในระบบเรียบร้อยแล้ว</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer text-center"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleProceed}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-700 hover:via-fuchsia-700 hover:to-purple-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-purple-500/30 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-purple-300/30"
            >
              <span>ไปยังแบบฟอร์มลงทะเบียนหน่วยงาน</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
