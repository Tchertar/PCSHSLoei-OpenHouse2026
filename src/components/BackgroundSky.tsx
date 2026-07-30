import React from 'react';

export const BackgroundSky: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-1000 ease-in-out">
      {/* ---------------- DAYTIME MODE ---------------- */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-blue-100 to-amber-50/80">
        {/* Sun & Golden Rays */}
        <div className="absolute -top-20 right-10 w-96 h-96 bg-amber-300/40 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-12 right-24 w-28 h-28 bg-amber-300/90 rounded-full shadow-[0_0_80px_30px_rgba(252,211,77,0.5)] border-4 border-amber-200/60" />

        {/* Floating Day Clouds */}
        <div className="absolute top-12 left-10 w-80 md:w-[520px] opacity-75 animate-cloud-slow">
          <svg viewBox="0 0 500 200" fill="white" className="w-full h-auto drop-shadow-md">
            <path d="M120 160 C 90 160, 70 130, 80 100 C 50 90, 40 50, 70 30 C 100 10, 140 10, 160 30 C 190 0, 250 0, 280 30 C 310 10, 360 20, 380 50 C 410 40, 440 60, 440 90 C 450 130, 420 160, 380 160 Z" />
          </svg>
        </div>

        <div className="absolute top-44 right-16 w-72 md:w-[440px] opacity-60 animate-cloud-fast">
          <svg viewBox="0 0 500 200" fill="white" className="w-full h-auto drop-shadow-sm">
            <path d="M100 150 C 70 150, 50 120, 60 90 C 30 80, 20 40, 50 20 C 80 0, 120 0, 140 20 C 170 -10, 230 -10, 260 20 C 290 0, 340 10, 360 40 C 390 30, 420 50, 420 80 C 430 120, 400 150, 360 150 Z" />
          </svg>
        </div>

        {/* Floating Pollen Particles */}
        <div className="absolute top-1/3 left-1/5 w-2 h-2 bg-amber-300 rounded-full blur-[0.5px] animate-ping opacity-60" />
        <div className="absolute top-1/2 left-2/3 w-3 h-3 bg-amber-200 rounded-full blur-[0.5px] animate-pulse opacity-50" />

        {/* SUNFLOWERS (4 Sunflowers: 2 Large + 2 Small) */}

        {/* 1. Main Large Sunflower - Bottom Left */}
        <div className="absolute bottom-0 left-2 sm:left-8 w-36 sm:w-56 h-auto z-10 opacity-90 animate-sway pointer-events-none">
          <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stem & Leaves */}
            <path d="M100 240 C100 180, 95 120, 100 80" stroke="#15803d" strokeWidth="8" strokeLinecap="round" />
            <path d="M100 160 Q60 140 40 150 Q75 185 100 165" fill="#16a34a" />
            <path d="M100 130 Q140 110 160 120 Q125 155 100 135" fill="#15803d" />

            {/* Sunflower Petals */}
            <g transform="translate(100, 80)">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="-38"
                  rx="12"
                  ry="26"
                  fill={i % 2 === 0 ? '#f59e0b' : '#fbbf24'}
                  transform={`rotate(${angle})`}
                />
              ))}
              {/* Center Core */}
              <circle cx="0" cy="0" r="22" fill="#78350f" />
              <circle cx="0" cy="0" r="18" fill="#451a03" />
              {/* Inner Dots */}
              <circle cx="-6" cy="-6" r="2" fill="#d97706" opacity="0.8" />
              <circle cx="6" cy="6" r="2" fill="#d97706" opacity="0.8" />
              <circle cx="6" cy="-6" r="2" fill="#fbbf24" opacity="0.8" />
            </g>
          </svg>
        </div>

        {/* 2. Small Sunflower #1 - Bottom Left (Next to main left sunflower) */}
        <div
          className="absolute bottom-0 left-28 sm:left-52 w-20 sm:w-32 h-auto z-10 opacity-85 animate-sway pointer-events-none"
          style={{ animationDelay: '-1.5s' }}
        >
          <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 240 C100 170, 105 130, 100 90" stroke="#15803d" strokeWidth="6" strokeLinecap="round" />
            <path d="M100 165 Q135 145 150 155 Q115 185 100 168" fill="#16a34a" />
            <g transform="translate(100, 90)">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="-28"
                  rx="9"
                  ry="20"
                  fill={i % 2 === 0 ? '#fbbf24' : '#f59e0b'}
                  transform={`rotate(${angle})`}
                />
              ))}
              <circle cx="0" cy="0" r="15" fill="#78350f" />
              <circle cx="0" cy="0" r="11" fill="#451a03" />
            </g>
          </svg>
        </div>

        {/* 3. Small Sunflower #2 - Bottom Right (Next to main right sunflower) */}
        <div
          className="absolute bottom-0 right-28 sm:right-48 w-18 sm:w-28 h-auto z-10 opacity-80 animate-sway pointer-events-none"
          style={{ animationDelay: '-3.2s' }}
        >
          <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 240 C100 175, 92 135, 100 95" stroke="#15803d" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M100 170 Q65 150 50 160 Q85 190 100 172" fill="#16a34a" />
            <g transform="translate(100, 95)">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="-25"
                  rx="8"
                  ry="18"
                  fill={i % 2 === 0 ? '#f59e0b' : '#fbbf24'}
                  transform={`rotate(${angle})`}
                />
              ))}
              <circle cx="0" cy="0" r="14" fill="#78350f" />
              <circle cx="0" cy="0" r="10" fill="#451a03" />
            </g>
          </svg>
        </div>

        {/* 4. Main Medium Sunflower - Bottom Right */}
        <div
          className="absolute bottom-0 right-2 sm:right-10 w-28 sm:w-44 h-auto z-10 opacity-85 animate-sway pointer-events-none"
          style={{ animationDelay: '-2s' }}
        >
          <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 240 C100 170, 110 130, 100 80" stroke="#15803d" strokeWidth="7" strokeLinecap="round" />
            <path d="M100 150 Q140 130 155 140 Q120 175 100 155" fill="#16a34a" />

            <g transform="translate(100, 80)">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="-34"
                  rx="10"
                  ry="22"
                  fill={i % 2 === 0 ? '#fbbf24' : '#f59e0b'}
                  transform={`rotate(${angle})`}
                />
              ))}
              <circle cx="0" cy="0" r="18" fill="#78350f" />
              <circle cx="0" cy="0" r="14" fill="#451a03" />
            </g>
          </svg>
        </div>
      </div>

      {/* Subtle Grid Dot Pattern Overlay */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:28px_28px]" />
    </div>
  );
};
