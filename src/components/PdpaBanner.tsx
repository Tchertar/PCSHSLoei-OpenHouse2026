import React, { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface PdpaBannerProps {
  onOpenPrivacyPolicy: () => void;
}

export const PdpaBanner: React.FC<PdpaBannerProps> = ({ onOpenPrivacyPolicy }) => {
  const [visible, setVisible] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const pdpaSavedDate = localStorage.getItem('pcshs_pdpa_dont_show_date');

    if (pdpaSavedDate !== todayStr) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    if (dontShowToday) {
      const todayStr = new Date().toISOString().substring(0, 10);
      localStorage.setItem('pcshs_pdpa_dont_show_date', todayStr);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-in">
      <div className="bg-white/95 border border-slate-200 backdrop-blur-xl rounded-2xl p-5 shadow-2xl text-slate-900">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 shrink-0 text-amber-500" />
            <span>แจ้งเตือนการคุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
          </div>
          <button
            onClick={handleAccept}
            className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          เว็บไซต์นี้จัดทำขึ้นเพื่อการลงทะเบียนและบริหารจัดการผู้เข้าร่วมงาน PCSHS Loei Open House 2026 ข้อมูลส่วนบุคคลจะถูกเก็บรักษาอย่างปลอดภัยเพื่อวัตถุประสงค์ตามที่แจ้งไว้เท่านั้น
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-slate-700">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="rounded bg-slate-100 border-slate-300 text-orange-500 focus:ring-orange-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>ไม่แสดงข้อความนี้อีกในวันนี้</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPrivacyPolicy}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              อ่านนโยบาย
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-transform hover:scale-105"
            >
              ยอมรับ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
