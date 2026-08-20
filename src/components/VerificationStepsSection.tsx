import React from 'react';
import { Attendee } from '../types';
import {
  LogIn,
  QrCode,
  ScanLine,
  CheckCircle2,
  BookOpen,
  Gift,
  AlertCircle,
  UserCheck,
  ArrowRight,
  Calendar,
  Stamp,
} from 'lucide-react';

interface VerificationStepsSectionProps {
  currentAttendee: Attendee | null;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
}

export const VerificationStepsSection: React.FC<VerificationStepsSectionProps> = ({
  currentAttendee,
  onOpenLogin,
  onOpenProfile,
}) => {
  const steps = [
    {
      step: 1,
      title: 'เข้าสู่ระบบ',
      desc: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์หรืออีเมลที่ลงทะเบียนไว้',
      icon: LogIn,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
    },
    {
      step: 2,
      title: 'รับ QR Code',
      desc: 'เปิดหน้าบัตรประจำตัวเพื่อแสดง QR Code ส่วนบุคคล',
      icon: QrCode,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
    },
    {
      step: 3,
      title: 'สแกน QR Code โดยเจ้าหน้าที่',
      desc: 'ยื่น QR Code ให้เจ้าหน้าที่จุดลงทะเบียนสแกนเช็คอินเข้างาน',
      icon: ScanLine,
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      iconBg: 'bg-cyan-600 text-white',
    },
    {
      step: 4,
      title: 'รับสติ๊กเกอร์ยืนยันตัวตน',
      desc: 'รับสติ๊กเกอร์ประจำตัวผู้เข้าร่วมงานเพื่อติดที่เสื้อ',
      icon: CheckCircle2,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      step: 5,
      title: 'รับไกด์บุ๊คหรือคู่มือกิจกรรม',
      desc: 'รับแผนที่ แผ่นพับ และคู่มือแนะนำกิจกรรมประจำฐานต่างๆ',
      icon: BookOpen,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-600 text-white',
    },
    {
      step: 6,
      title: 'เข้าร่วมกิจกรรมเพื่อสะสมสติ๊กตามฐานกิจกรรม',
      desc: 'ร่วมสนุก ทดลอง และแข่งขันตามฐานเพื่อเก็บสติ๊กเกอร์ผลงาน',
      icon: Stamp,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
    },
    {
      step: 7,
      title: 'นำสติ๊กเกอร์มาแลกรับของที่ระลึก',
      desc: 'นำสติ๊กเกอร์ที่สะสมครบตามเกณฑ์มาแลกรับของที่ระลึกสุดพิเศษ',
      icon: Gift,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-600 text-white',
    },
  ];

  return (
    <section id="verification-steps" className="my-10 px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto z-10">
      <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl backdrop-blur-xl relative overflow-hidden">
        
        {/* Subtle Decorative Ambient Background Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full mb-3 shadow-xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>28 สิงหาคม 2569</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 leading-snug">
            ขั้นตอนการยืนยันตัวตน
          </h2>
          
          <p className="text-base sm:text-xl text-blue-700 font-bold">
            เพื่อเข้าร่วมงานในวันที่ 28 สิงหาคม 2569
          </p>
        </div>

        {/* 7 Verification Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 relative z-10 mb-8">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === steps.length - 1;

            return (
              <div
                key={item.step}
                className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:border-blue-300 bg-white/90 ${
                  isLast ? 'md:col-span-2 lg:col-span-3 bg-gradient-to-r from-rose-50/50 via-white to-amber-50/50 border-rose-200' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Step Number Badge & Icon */}
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shadow">
                      {item.step}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Important Notice Callout Box */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 mb-8 relative z-10 shadow-xs flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm sm:text-base font-bold text-amber-900 mb-0.5">
              หมายเหตุสำคัญ
            </h4>
            <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed">
              ผู้ที่ลงทะเบียนไม่ทัน <strong>สามารถลงทะเบียนเพิ่มเติมภายในงานได้</strong> ณ จุดประชาสัมพันธ์และลงทะเบียนหน้างาน
            </p>
          </div>
        </div>

        {/* Action Button Area */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          {currentAttendee ? (
            <button
              onClick={onOpenProfile}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-xl hover:shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 border border-emerald-400/40"
            >
              <UserCheck className="w-5 h-5" />
              <span>ดูบัตรประจำตัวและ QR Code ของคุณ ({currentAttendee.firstName})</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-xl hover:shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 border border-blue-400/40"
            >
              <LogIn className="w-5 h-5 text-blue-200" />
              <span>เข้าสู่ระบบเพื่อรับ QR Code</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

      </div>
    </section>
  );
};
