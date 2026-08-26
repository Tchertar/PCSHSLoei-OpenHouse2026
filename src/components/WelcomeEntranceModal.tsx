import React from 'react';
import { QrCode, ScanLine, Globe, ArrowRight, Sparkles, X, ShieldCheck, ChevronRight, ExternalLink } from 'lucide-react';

interface WelcomeEntranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGetQrCode: () => void;
  onOpenAdminScanner: () => void;
}

export const WelcomeEntranceModal: React.FC<WelcomeEntranceModalProps> = ({
  isOpen,
  onClose,
  onOpenGetQrCode,
  onOpenAdminScanner,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      {/* White Clean Card Popup */}
      <div className="relative w-full max-w-lg my-auto bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 text-center transform transition-all">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100/80 hover:bg-slate-200 transition-colors cursor-pointer z-10"
          title="เข้าสู่เว็บไซต์"
        >
          <X className="w-5 h-5" />
        </button>

        {/* School Emblem & Header Badge */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 relative flex items-center justify-center rounded-2xl bg-orange-50 border border-orange-100 p-2 shadow-inner">
            <img
              src="https://upload.wikimedia.org/wikipedia/th/thumb/f/f9/Princess_Chulabhorn%27s_College_Loei_Logo.png/200px-Princess_Chulabhorn%27s_College_Loei_Logo.png"
              alt="PCSHS Loei Logo"
              className="w-full h-full object-contain drop-shadow-sm"
              onError={(e) => {
                // Fallback to QR icon if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100/70 text-orange-700 text-xs font-bold rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>PCSHS Loei Open House 2026</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            ยินดีต้อนรับสู่ระบบงาน Open House
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
            โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
            <br />
            กรุณาเลือกรายการที่ท่านต้องการดำเนินการด้านล่าง
          </p>
        </div>

        {/* 3 Main Action Buttons */}
        <div className="space-y-3.5 text-left">
          
          {/* BUTTON 1: รับ QRCode (ตรงกลาง & โดดเด่นที่สุด) */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
            <button
              type="button"
              onClick={onOpenGetQrCode}
              className="relative w-full p-4 sm:p-4.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-between group transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                  <QrCode className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black tracking-wide">
                      1. รับ QR Code
                    </span>
                    <span className="px-2 py-0.5 bg-white text-orange-700 text-[10px] font-black rounded-full shadow-xs uppercase">
                      แนะนำ
                    </span>
                  </div>
                  <p className="text-xs text-orange-100 font-medium mt-0.5">
                    ค้นหาและรับ QR Code บัตรผู้เข้าร่วมงาน
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>

          {/* BUTTON 2: สแกน QRCode สำหรับแอดมิน */}
          <button
            type="button"
            onClick={onOpenAdminScanner}
            className="w-full p-3.5 sm:p-4 bg-slate-50 hover:bg-slate-100/90 border-2 border-slate-200 hover:border-slate-300 rounded-2xl text-slate-800 transition-all duration-200 cursor-pointer flex items-center justify-between group hover:shadow-md"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600">
                <ScanLine className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    2. สแกน QR Code สำหรับแอดมิน
                  </span>
                  <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระบบสแกนเช็คชื่อและตรวจสอบรายชื่อผู้เข้าร่วม
                </p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-200/80 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform text-slate-600">
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* BUTTON 3: เข้าสู่เว็บไซต์ */}
          <button
            type="button"
            onClick={onClose}
            className="w-full p-3 sm:p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 hover:text-slate-900 transition-all duration-200 cursor-pointer flex items-center justify-between group hover:border-slate-300"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                <Globe className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  3. เข้าสู่เว็บไซต์
                </span>
                <p className="text-[11px] text-slate-400">
                  เข้าชมรายละเอียดกิจกรรม ตารางเวลา และแผนผังงาน
                </p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          สามารถเปิดหน้านี้ได้ตลอดเวลาจากเมนูด้านบนของเว็บไซต์
        </div>
      </div>
    </div>
  );
};
