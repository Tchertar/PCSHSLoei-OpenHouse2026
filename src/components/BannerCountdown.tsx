import React, { useEffect, useState } from 'react';
import { Clock, Sparkles } from 'lucide-react';

export const BannerCountdown: React.FC = () => {
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
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-2.5 sm:p-3.5 w-[270px] sm:w-[320px] md:w-[340px] text-slate-800 transition-transform duration-200 hover:scale-[1.02] select-none pointer-events-auto">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-[11px] sm:text-xs font-black tracking-wider text-blue-950 uppercase">
            OPEN HOUSE 2569
          </span>
        </div>

        <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>28 ส.ค. 69 (08:30 น.)</span>
        </div>
      </div>

      {/* Countdown Digits Grid */}
      {timeLeft.isExpired ? (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs py-2 px-3 rounded-xl text-center shadow-xs">
          🎉 งานเริ่มขึ้นแล้ว! ยินดีต้อนรับทุกท่าน
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
          {/* Days */}
          <div className="bg-gradient-to-b from-blue-50 to-blue-100/70 border border-blue-200/70 rounded-xl py-1 px-1 shadow-2xs">
            <span className="block text-base sm:text-lg md:text-xl font-black text-blue-900 font-mono leading-tight">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-blue-700 font-bold block -mt-0.5">
              วัน
            </span>
          </div>

          {/* Hours */}
          <div className="bg-gradient-to-b from-orange-50 to-orange-100/70 border border-orange-200/70 rounded-xl py-1 px-1 shadow-2xs">
            <span className="block text-base sm:text-lg md:text-xl font-black text-orange-600 font-mono leading-tight">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-orange-700 font-bold block -mt-0.5">
              ชั่วโมง
            </span>
          </div>

          {/* Minutes */}
          <div className="bg-gradient-to-b from-blue-50 to-blue-100/70 border border-blue-200/70 rounded-xl py-1 px-1 shadow-2xs">
            <span className="block text-base sm:text-lg md:text-xl font-black text-blue-900 font-mono leading-tight">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-blue-700 font-bold block -mt-0.5">
              นาที
            </span>
          </div>

          {/* Seconds */}
          <div className="bg-gradient-to-b from-orange-50 to-orange-100/70 border border-orange-200/70 rounded-xl py-1 px-1 shadow-2xs">
            <span className="block text-base sm:text-lg md:text-xl font-black text-orange-600 font-mono leading-tight animate-pulse">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-orange-700 font-bold block -mt-0.5">
              วินาที
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
