import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { BannerCountdown } from './BannerCountdown';

export const Banner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [containerDim, setContainerDim] = useState({ width: 0, height: 0 });
  const [imgSrc, setImgSrc] = useState('https://lh3.googleusercontent.com/d/1Krk3TbqazkWZOx-XTLRXTuIrBu45rX0-');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

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

          {/* Locked Banner Countdown Timer on Desktop (Top-Left Area over banner) */}
          <div className="hidden lg:block absolute top-3 left-3 xl:top-5 xl:left-5 z-30 pointer-events-auto">
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

      {/* Countdown Timer BELOW banner on Smart Phone & iPad / Tablet */}
      <div className="lg:hidden mt-3 sm:mt-4 flex justify-center w-full z-20">
        <BannerCountdown />
      </div>
    </section>
  );
};
