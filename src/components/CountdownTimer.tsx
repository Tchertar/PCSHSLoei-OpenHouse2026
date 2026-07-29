import React, { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

export const CountdownTimer: React.FC = () => {
  // Target: 28 สิงหาคม 2569 (2026-08-28 08:30:00)
  const targetTime = new Date('2026-08-28T08:30:00+07:00').getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <div className="relative overflow-hidden bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl text-center">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

        <div className="inline-flex items-center justify-center gap-2 mb-3 bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs sm:text-sm px-4 py-1.5 rounded-full tracking-wide">
          <Calendar className="w-4 h-4 text-orange-500 animate-bounce" />
          <span>นับถอยหลังสู่วันงาน PCSHS Loei Open House 2026</span>
          <Clock className="w-4 h-4 text-blue-600" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
          วันศุกร์ที่ 28 สิงหาคม พ.ศ. 2569 (เริ่มงานเวลา 08:30 น.)
        </h3>

        {timeLeft.isExpired ? (
          <div className="inline-block bg-orange-50 border border-orange-200 text-orange-700 font-bold text-lg sm:text-xl px-8 py-4 rounded-xl">
            🎉 งาน PCSHS Loei Open House 2026 กำลังจัดขึ้นอย่างเป็นทางการ!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-2xl mx-auto">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-sm">
              <span className="block text-3xl sm:text-5xl font-extrabold text-blue-900">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm text-slate-600 font-medium mt-1 block">วัน (Days)</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-sm">
              <span className="block text-3xl sm:text-5xl font-extrabold text-orange-600">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm text-slate-600 font-medium mt-1 block">ชั่วโมง (Hours)</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-sm">
              <span className="block text-3xl sm:text-5xl font-extrabold text-blue-900">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm text-slate-600 font-medium mt-1 block">นาที (Minutes)</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-sm">
              <span className="block text-3xl sm:text-5xl font-extrabold text-orange-600">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm text-slate-600 font-medium mt-1 block">วินาที (Seconds)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
