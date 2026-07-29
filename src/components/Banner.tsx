import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

export const Banner: React.FC<{ onRegisterClick: () => void }> = ({ onRegisterClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [containerDim, setContainerDim] = useState({ width: 0, height: 0 });
  const [imgSrc, setImgSrc] = useState('https://lh3.googleusercontent.com/d/1Krk3TbqazkWZOx-XTLRXTuIrBu45rX0-');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const LENS_SIZE = 180; // Diameter of the magnifying lens in pixels
  const ZOOM_LEVEL = 2.2; // Magnification factor

  useEffect(() => {
    // Detect touch device
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          window.matchMedia('(pointer: coarse)').matches
      );
    };
    checkTouch();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setContainerDim({ width: rect.width, height: rect.height });
    setMousePos({ x, y });
    if (!isHovering) setIsHovering(true);
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
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-2 sm:px-4 pt-4 pb-6 z-10">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden rounded-2xl shadow-xl border border-slate-200/80 bg-white/80 backdrop-blur-md cursor-crosshair group"
      >
        {/* Base Banner Image */}
        <img
          src={imgSrc}
          alt="PCSHS Loei Open House 2026 Banner"
          className="w-full h-auto object-contain block border-0 p-0 m-0 shadow-none outline-none select-none transition-transform duration-300"
          referrerPolicy="no-referrer"
          onError={() => {
            setImgSrc(
              'https://drive.google.com/thumbnail?id=1Krk3TbqazkWZOx-XTLRXTuIrBu45rX0-&sz=w2000'
            );
          }}
        />

        {/* Magnifying Glass Lens Overlay */}
        {isHovering && !isTouchDevice && containerDim.width > 0 && (
          <div
            className="pointer-events-none absolute rounded-full border-2 border-amber-400/90 shadow-[0_12px_36px_rgba(0,0,0,0.45)] ring-4 ring-black/20 overflow-hidden transition-opacity duration-150 ease-out z-30"
            style={{
              width: `${LENS_SIZE}px`,
              height: `${LENS_SIZE}px`,
              left: `${mousePos.x - LENS_SIZE / 2}px`,
              top: `${mousePos.y - LENS_SIZE / 2}px`,
              backgroundImage: `url("${imgSrc}")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${containerDim.width * ZOOM_LEVEL}px ${containerDim.height * ZOOM_LEVEL}px`,
              backgroundPosition: `-${mousePos.x * ZOOM_LEVEL - LENS_SIZE / 2}px -${mousePos.y * ZOOM_LEVEL - LENS_SIZE / 2}px`,
            }}
          >
            {/* Glass shine refraction overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 rounded-full pointer-events-none" />
            
            {/* Subtle Crosshair indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-2.5 h-2.5 border border-amber-300 rounded-full bg-amber-400/30" />
            </div>
          </div>
        )}

        {/* Hover Hint Badge on Desktop */}
        {!isTouchDevice && (
          <div className="absolute top-3 right-3 z-20 opacity-80 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none hidden sm:flex items-center gap-1.5 bg-slate-900/70 text-amber-300 text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-md border border-amber-400/30">
            <Search className="w-3.5 h-3.5" />
            <span>ขยับเมาส์เพื่อใช้ส่องแว่นขยาย</span>
          </div>
        )}
      </div>

      {/* Quick Action Bar BELOW the banner image (Does not block/cover banner) */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 text-white rounded-2xl px-5 py-3 shadow-lg border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-200">
            28 สิงหาคม 2569 | ณ โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
          </span>
        </div>

        <button
          onClick={onRegisterClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-200 shrink-0"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google เพื่อลงทะเบียนเข้าร่วมงาน</span>
        </button>
      </div>
    </section>
  );
};

