import React from 'react';
import { ScanLine, ArrowLeft, ShieldCheck, Camera, Sparkles, AlertCircle, Home, Users } from 'lucide-react';

interface AdminScannerPageProps {
  onBackToHome: () => void;
}

export const AdminScannerPage: React.FC<AdminScannerPageProps> = ({ onBackToHome }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Prompt',sans-serif] flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 px-3.5 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <ScanLine className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-slate-800">
              สแกน QR Code สำหรับแอดมิน
            </span>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="หน้าแรก"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area - Prepared Blank Page */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
          
          {/* Header Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
            <ScanLine className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold rounded-full mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>หน้าสำหรับ: 2. สแกน QR Code (Admin)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              ระบบสแกน QR Code เจ้าหน้าที่
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
            </p>
          </div>

          {/* Placeholder Notice for Next Instructions */}
          <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-left text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>หน้ารองรับข้อมูล (พร้อมระบบสแกนและเช็คชื่อกลุ่มคณะ)</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              หน้านี้ถูกเตรียมไว้สำหรับระบบล็อกอินแอดมิน / เปิดกล้องสแกน QR Code / ค้นหาชื่อ-โรงเรียน / เช็คชื่อสมาชิกและคณะครู-นักเรียนแบบรายบุคคลเพื่อจัดทำเกียรติบัตร พร้อมให้ท่านส่งคำสั่งเพิ่มรายละเอียดในขั้นตอนถัดไป
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าแรกของเว็บไซต์</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย (PCSHS Loei Open House 2026)
      </footer>
    </div>
  );
};
