import React, { useEffect, useRef, useState } from 'react';

export const Banner: React.FC<{ onRegisterClick: () => void }> = ({ onRegisterClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device to auto-disable mouse tilt effect
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
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Gentle tilt angles
    const rotateY = (mouseX / (rect.width / 2)) * 6; // max 6 deg
    const rotateX = -(mouseY / (rect.height / 2)) * 6; // max 6 deg

    setTransform({ rotateX, rotateY, scale: 1.015 });
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-2 sm:px-4 pt-4 pb-6 z-10">
      {/* Container with perspective for 3D tilt */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden rounded-2xl shadow-xl border border-slate-200/80 transition-all duration-300 ease-out bg-white/80 backdrop-blur-md"
        style={{
          perspective: '1200px',
        }}
      >
        <div
          className="w-full transition-transform duration-200 ease-out border-0 p-0 m-0 leading-none"
          style={{
            transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Full Banner Image - w-full h-auto object-contain ensures zero image cropping */}
          <img
            src="https://lh3.googleusercontent.com/d/1Krk3TbqazkWZOx-XTLRXTuIrBu45rX0-"
            alt="PCSHS Loei Open House 2026 Banner"
            className="w-full h-auto object-contain block border-0 p-0 m-0 shadow-none outline-none select-none"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback URL if Google direct link needs alternative parameter
              (e.target as HTMLImageElement).src =
                'https://drive.google.com/thumbnail?id=1Krk3TbqazkWZOx-XTLRXTuIrBu45rX0-&sz=w2000';
            }}
          />
        </div>

        {/* Quick CTA Banner Badge Overlay on desktop */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 hidden sm:flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-amber-500/40 rounded-full px-5 py-2.5 shadow-lg">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-500 animate-ping" />
          <span className="text-white text-xs sm:text-sm font-medium">
            28 สิงหาคม 2569 | ณ โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
          </span>
          <button
            onClick={onRegisterClick}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs px-4 py-1.5 rounded-full shadow transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            ลงทะเบียนด่วน
          </button>
        </div>
      </div>
    </section>
  );
};
