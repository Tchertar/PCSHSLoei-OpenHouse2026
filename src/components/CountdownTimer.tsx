import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Clock, Move, Minimize2, Maximize2, Sparkles, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  const [isMinimized, setIsMinimized] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

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
    <>
      {/* Invisible full-screen drag constraint boundary */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
      />

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.1}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
        className="fixed bottom-6 right-4 sm:right-6 z-40 touch-none select-none"
        style={{ maxWidth: 'calc(100vw - 2rem)' }}
      >
        <AnimatePresence mode="wait">
          {isMinimized ? (
            /* MINIMIZED FLOATING PILL BUTTON */
            <motion.div
              key="minimized"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="group flex items-center gap-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white pl-3.5 pr-2 py-2 rounded-full shadow-2xl border-2 border-amber-400/80 cursor-grab active:cursor-grabbing backdrop-blur-xl hover:border-amber-300 transition-all"
            >
              {/* Drag Handle Indicator */}
              <div
                className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing"
                title="กดค้างแล้วลากเพื่อย้ายตำแหน่ง"
              >
                <Move className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <div className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </span>
                  <span className="text-[11px] font-extrabold tracking-wider text-amber-300">
                    OPEN HOUSE 2569
                  </span>
                </div>
              </div>

              {/* Live Mini Counter */}
              <div
                onClick={() => setIsMinimized(false)}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full text-xs font-mono font-bold cursor-pointer transition-colors"
                title="คลิกเพื่อขยายดูเวลานับถอยหลังเต็มรูปแบบ"
              >
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>
                  {timeLeft.isExpired
                    ? '🎉 ถึงวันงานแล้ว!'
                    : `${timeLeft.days} วัน ${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`}
                </span>
                <Maximize2 className="w-3 h-3 text-slate-300 ml-0.5" />
              </div>
            </motion.div>
          ) : (
            /* EXPANDED FLOATING DRAGGABLE CARD */
            <motion.div
              key="expanded"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-2xl border-2 border-blue-500/60 rounded-3xl p-4 sm:p-5 shadow-2xl w-[320px] sm:w-[380px] text-center relative overflow-hidden ring-4 ring-black/5"
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-amber-400 to-orange-500" />

              {/* Header Bar with Drag Handle & Minimize Button */}
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
                {/* Drag Handle Tag */}
                <div
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full cursor-grab active:cursor-grabbing transition-colors"
                  title="คลิกค้างแล้วลากเพื่อเคลื่อนย้ายตำแหน่งบนหน้าจอ"
                >
                  <Move className="w-3.5 h-3.5 text-blue-600" />
                  <span>ลากเพื่อย้าย</span>
                </div>

                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>28 ส.ค. 2569</span>
                </div>

                {/* Minimize Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  title="ย่อเป็นปุ่มลอยขนาดเล็ก"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <div className="mb-3">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                  นับถอยหลังสู่ PCSHS Loei Open House 2026
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  เริ่มงานเวลา 08:30 น. ณ จุฬาภรณฯ เลย
                </p>
              </div>

              {/* Countdown Digits Grid */}
              {timeLeft.isExpired ? (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-2xl shadow-sm">
                  🎉 งาน PCSHS Loei Open House 2026 กำลังจัดขึ้นแล้ว!
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {/* Days */}
                  <div className="bg-gradient-to-b from-blue-50/90 to-blue-100/60 border border-blue-200/80 rounded-xl p-2 shadow-xs">
                    <span className="block text-xl sm:text-2xl font-black text-blue-900 font-mono">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-blue-700 font-bold block">
                      วัน
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="bg-gradient-to-b from-orange-50/90 to-orange-100/60 border border-orange-200/80 rounded-xl p-2 shadow-xs">
                    <span className="block text-xl sm:text-2xl font-black text-orange-600 font-mono">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-orange-700 font-bold block">
                      ชม.
                    </span>
                  </div>

                  {/* Minutes */}
                  <div className="bg-gradient-to-b from-blue-50/90 to-blue-100/60 border border-blue-200/80 rounded-xl p-2 shadow-xs">
                    <span className="block text-xl sm:text-2xl font-black text-blue-900 font-mono">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-blue-700 font-bold block">
                      นาที
                    </span>
                  </div>

                  {/* Seconds */}
                  <div className="bg-gradient-to-b from-orange-50/90 to-orange-100/60 border border-orange-200/80 rounded-xl p-2 shadow-xs">
                    <span className="block text-xl sm:text-2xl font-black text-orange-600 font-mono animate-pulse">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-orange-700 font-bold block">
                      วินาที
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Quick Action / Info */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>28 ส.ค. 2569 เวลา 08:30 น.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  ย่อขนาด
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
