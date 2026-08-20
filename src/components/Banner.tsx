import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Search, FileText, Download, Building2, Lock } from 'lucide-react';
import { BannerCountdown } from './BannerCountdown';

export const Banner: React.FC<{ onRegisterClick: () => void; onOpenOrgModal?: () => void }> = ({ onRegisterClick, onOpenOrgModal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [containerDim, setContainerDim] = useState({ width: 0, height: 0 });
  const [imgSrc, setImgSrc] = useState('https://lh3.googleusercontent.com/d/1Krk3TbqazkWZOx-XTLRXTuIrBu45rX0-');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const isRegistrationOpen = false;

  // Smooth Parallax tilt & translation state
  const [tilt, setTilt] = useState({ rotX: 0, rotY: 0, transX: 0, transY: 0 });
  const animFrameRef = useRef<number | null>(null);
  const targetTiltRef = useRef({ rotX: 0, rotY: 0, transX: 0, transY: 0 });

  const LENS_SIZE = 220; // Frameless Magnifying Lens Diameter in px
  const ZOOM_LEVEL = 2.2; // Magnification factor

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          window.matchMedia('(pointer: coarse)').matches
      );
    };
    checkTouch();

    // Silky-smooth Lerp loop for fluid, soft banner movement tracking mouse
    let currentTilt = { rotX: 0, rotY: 0, transX: 0, transY: 0 };
    const lerpLoop = () => {
      const factor = 0.08; // Ultra smooth lerp factor
      currentTilt = {
        rotX: currentTilt.rotX + (targetTiltRef.current.rotX - currentTilt.rotX) * factor,
        rotY: currentTilt.rotY + (targetTiltRef.current.rotY - currentTilt.rotY) * factor,
        transX: currentTilt.transX + (targetTiltRef.current.transX - currentTilt.transX) * factor,
        transY: currentTilt.transY + (targetTiltRef.current.transY - currentTilt.transY) * factor,
      };
      setTilt(currentTilt);
      animFrameRef.current = requestAnimationFrame(lerpLoop);
    };
    animFrameRef.current = requestAnimationFrame(lerpLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setContainerDim({ width: rect.width, height: rect.height });
    setMousePos({ x, y });
    if (!isHovering) setIsHovering(true);

    // Normalized coordinates (-1 to +1) from center
    const normX = (x - rect.width / 2) / (rect.width / 2);
    const normY = (y - rect.height / 2) / (rect.height / 2);

    // Target smooth rotation and translation
    targetTiltRef.current = {
      rotX: -normY * 8, // Smooth 3D tilt
      rotY: normX * 10,
      transX: normX * 16, // Smooth translation shift
      transY: normY * 12,
    };
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setContainerDim({ width: rect.width, height: rect.height });
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    targetTiltRef.current = { rotX: 0, rotY: 0, transX: 0, transY: 0 };
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-2 sm:px-4 pt-2 pb-6 z-10 perspective-1000">
      {/* Banner Container - Absolutely NO background box or white container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-visible rounded-3xl cursor-crosshair group bg-transparent p-0 m-0 border-0"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg) translate3d(${tilt.transX}px, ${tilt.transY}px, 0px)`,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {/* Banner Image - Floating with rounded corners and clean drop shadow, strictly NO white background */}
        <div className="relative overflow-hidden rounded-3xl shadow-xl bg-transparent border-0 p-0 m-0">
          <img
            src={imgSrc}
            alt="PCSHS Loei Open House 2026 Banner"
            className="w-full h-auto object-contain block border-0 p-0 m-0 shadow-none outline-none select-none bg-transparent"
            referrerPolicy="no-referrer"
            onError={() => {
              setImgSrc(
                'https://drive.google.com/thumbnail?id=1Krk3TbqazkWZOx-XTLRXTuIrBu45rX0-&sz=w2000'
              );
            }}
          />

          {/* Locked Banner Countdown Timer (Top-Left Area matching red outline with clean white background) */}
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 md:top-5 md:left-5 z-30 pointer-events-auto">
            <BannerCountdown />
          </div>
        </div>

        {/* FRAMELESS MAGNIFYING LENS OVERLAY (ไม่มีกรอบ) */}
        {isHovering && !isTouchDevice && containerDim.width > 0 && (
          <div
            className="pointer-events-none absolute z-40 transition-opacity duration-200 ease-out"
            style={{
              width: `${LENS_SIZE}px`,
              height: `${LENS_SIZE}px`,
              left: `${mousePos.x - LENS_SIZE / 2}px`,
              top: `${mousePos.y - LENS_SIZE / 2}px`,
            }}
          >
            {/* Frameless Round Lens - Pure glass zoom spot with soft ambient shadow */}
            <div
              className="relative w-full h-full rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden"
              style={{
                backgroundImage: `url("${imgSrc}")`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${containerDim.width * ZOOM_LEVEL}px ${containerDim.height * ZOOM_LEVEL}px`,
                backgroundPosition: `-${mousePos.x * ZOOM_LEVEL - LENS_SIZE / 2}px -${mousePos.y * ZOOM_LEVEL - LENS_SIZE / 2}px`,
              }}
            >
              {/* Soft Glass Inner Glare & Edge Gradient - NO solid border line */}
              <div className="absolute inset-0 rounded-full bg-radial from-transparent via-transparent to-black/30 pointer-events-none" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* Hover Hint Badge on Desktop */}
        {!isTouchDevice && (
          <div className="absolute top-4 right-4 z-20 opacity-90 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none hidden sm:flex items-center gap-2 bg-slate-900/80 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md border border-amber-400/30 shadow-lg">
            <Search className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>ขยับเมาส์เพื่อใช้แว่นขยายส่องดูรายละเอียด</span>
          </div>
        )}
      </div>

      {/* Quick Action Bar BELOW banner image */}
      <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/90 text-white rounded-2xl px-5 py-3.5 shadow-xl border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3 text-center md:text-left">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-200">
            28 สิงหาคม 2569 | ณ โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
          </span>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          <a
            href="https://drive.google.com/file/d/15bBeF8VnE4SvJ7eHMNuENl93ea7nMDgT/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-blue-400/30"
          >
            <FileText className="w-4 h-4 text-blue-200" />
            <span>ดาวน์โหลดกำหนดการ (PDF)</span>
          </a>

          <button
            onClick={onRegisterClick}
            disabled={true}
            title="ปิดรับการลงทะเบียนบุคคลทั่วไปออนไลน์แล้ว"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 text-slate-400 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-none cursor-not-allowed border border-slate-700 opacity-85"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span>ปิดรับการลงทะเบียนบุคคลทั่วไปแล้ว</span>
          </button>

          {onOpenOrgModal && (
            <button
              onClick={onOpenOrgModal}
              disabled={true}
              title="ปิดรับการลงทะเบียนสำหรับหน่วยงานออนไลน์แล้ว"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800/90 text-slate-400 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-none cursor-not-allowed border border-slate-700 opacity-85"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>ปิดรับการลงทะเบียนหน่วยงานแล้ว</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
