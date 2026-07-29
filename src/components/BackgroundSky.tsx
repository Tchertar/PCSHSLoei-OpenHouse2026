import React from 'react';

export const BackgroundSky: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-sky-100/80 via-blue-50/60 to-slate-100">
      {/* Decorative sun glow / beam top right */}
      <div className="absolute -top-32 right-10 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl" />

      {/* Floating Cloud 1 - Back Layer Slow */}
      <div className="absolute top-12 left-10 w-80 md:w-[500px] opacity-60 animate-cloud-slow">
        <svg viewBox="0 0 500 200" fill="white" className="w-full h-auto drop-shadow-sm">
          <path d="M120 160 C 90 160, 70 130, 80 100 C 50 90, 40 50, 70 30 C 100 10, 140 10, 160 30 C 190 0, 250 0, 280 30 C 310 10, 360 20, 380 50 C 410 40, 440 60, 440 90 C 450 130, 420 160, 380 160 Z" />
        </svg>
      </div>

      {/* Floating Cloud 2 - Mid Layer Fast */}
      <div className="absolute top-48 right-12 w-72 md:w-[420px] opacity-45 animate-cloud-fast">
        <svg viewBox="0 0 500 200" fill="white" className="w-full h-auto drop-shadow">
          <path d="M100 150 C 70 150, 50 120, 60 90 C 30 80, 20 40, 50 20 C 80 0, 120 0, 140 20 C 170 -10, 230 -10, 260 20 C 290 0, 340 10, 360 40 C 390 30, 420 50, 420 80 C 430 120, 400 150, 360 150 Z" />
        </svg>
      </div>

      {/* Floating Cloud 3 - Lower Sky Layer */}
      <div className="absolute top-2/3 left-1/4 w-96 md:w-[600px] opacity-35 animate-cloud-slow">
        <svg viewBox="0 0 500 200" fill="white" className="w-full h-auto">
          <path d="M110 150 C 80 150, 60 120, 70 90 C 40 80, 30 40, 60 20 C 90 0, 130 0, 150 20 C 180 -10, 240 -10, 270 20 C 300 0, 350 10, 370 40 C 400 30, 430 50, 430 80 C 440 120, 410 150, 370 150 Z" />
        </svg>
      </div>

      {/* Subtle Grid Dot Pattern */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:28px_28px]" />
    </div>
  );
};
