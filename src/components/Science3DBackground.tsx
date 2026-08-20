import React from 'react';

interface BubbleData {
  id: string;
  size: number; // in pixels
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  animation: string;
  delay?: string;
  blur?: string;
  opacity?: number;
}

export const Science3DBackground: React.FC = () => {
  // 1. LAYER 1: FAR BACKGROUND BUBBLES (ลดลงครึ่งหนึ่งเหลือ 4 ลูก - Soft Blur, Small to Medium)
  const farBubbles: BubbleData[] = [
    { id: 'far-1', size: 36, left: '7%', top: '10%', animation: 'anim-float-slow', delay: '0s', blur: 'blur-[2px]', opacity: 0.4 },
    { id: 'far-2', size: 46, right: '9%', top: '16%', animation: 'anim-float-reverse', delay: '0.8s', blur: 'blur-[2px]', opacity: 0.45 },
    { id: 'far-3', size: 40, left: '10%', top: '58%', animation: 'anim-float-medium', delay: '1.5s', blur: 'blur-[2px]', opacity: 0.38 },
    { id: 'far-4', size: 50, right: '6%', bottom: '12%', animation: 'anim-float-slow', delay: '2.2s', blur: 'blur-[2px]', opacity: 0.42 },
  ];

  // 2. LAYER 2: MIDGROUND BUBBLES (ลดลงครึ่งหนึ่งเหลือ 6 ลูก - Crisp, High-Detail Pure Clear Soap Bubbles)
  const midBubbles: BubbleData[] = [
    // Left Side Margin
    { id: 'mid-left-1', size: 78, left: '2.5%', top: '8%', animation: 'anim-float-slow', delay: '0s', opacity: 0.8 },
    { id: 'mid-left-2', size: 92, left: '1.8%', top: '48%', animation: 'anim-float-reverse', delay: '1.2s', opacity: 0.82 },
    { id: 'mid-left-3', size: 80, left: '2.5%', bottom: '8%', animation: 'anim-float-medium', delay: '1.9s', opacity: 0.8 },

    // Right Side Margin
    { id: 'mid-right-1', size: 96, right: '2%', top: '22%', animation: 'anim-float-slow', delay: '1.4s', opacity: 0.82 },
    { id: 'mid-right-2', size: 58, right: '4%', top: '52%', animation: 'anim-float-reverse', delay: '0.6s', opacity: 0.75 },
    { id: 'mid-right-3', size: 82, right: '2.5%', bottom: '10%', animation: 'anim-float-medium', delay: '2.5s', opacity: 0.8 },
  ];

  // 3. LAYER 3: FOREGROUND OVERLAPPING BUBBLES (ลดลงครึ่งหนึ่งเหลือ 8 ลูก - ลอยทับแบนเนอร์และองค์ประกอบ แบบใส 100%)
  const foregroundOverlappingBubbles: BubbleData[] = [
    // Overlapping Hero Banner
    { id: 'fg-banner-1', size: 105, left: '2.5%', top: '290px', animation: 'anim-float-slow', delay: '0s', opacity: 0.9 },
    { id: 'fg-banner-2', size: 36, left: '8.5%', top: '265px', animation: 'anim-float-fast', delay: '1.1s', opacity: 0.82 },
    { id: 'fg-banner-3', size: 92, right: '2%', top: '55px', animation: 'anim-float-medium', delay: '0.5s', opacity: 0.9 },
    { id: 'fg-banner-4', size: 60, left: '28%', top: '335px', animation: 'anim-float-reverse', delay: '1.6s', opacity: 0.85 },

    // Overlapping Content Sections (ตารางสถานที่ / ขั้นตอนยืนยัน / กิจกรรม)
    { id: 'fg-elem-1', size: 80, right: '6%', top: '480px', animation: 'anim-float-slow', delay: '1.8s', opacity: 0.86 },
    { id: 'fg-elem-2', size: 55, left: '5%', top: '590px', animation: 'anim-float-medium', delay: '2.0s', opacity: 0.82 },
    { id: 'fg-elem-3', size: 88, left: '6%', top: '800px', animation: 'anim-float-reverse', delay: '0.8s', opacity: 0.86 },
    { id: 'fg-elem-4', size: 90, right: '5%', top: '1160px', animation: 'anim-float-medium', delay: '1.3s', opacity: 0.86 },
  ];

  const renderClearBubbleSVG = (bubble: BubbleData) => {
    const s = bubble.size;
    const r = s / 2;

    return (
      <svg
        viewBox={`0 0 ${s} ${s}`}
        width={s}
        height={s}
        className="w-full h-full drop-shadow-md select-none pointer-events-none"
      >
        {/* 1. Transparent Clear Inner Body Fill */}
        <circle
          cx={r}
          cy={r}
          r={r - 1.5}
          fill="url(#clearBubbleGrad)"
        />

        {/* 2. Crystal Clear Rim Reflection (Pure White / Glass Contour) */}
        <circle
          cx={r}
          cy={r}
          r={r - 1.5}
          fill="none"
          stroke="url(#clearRimGrad)"
          strokeWidth={Math.max(1.2, s * 0.04)}
        />

        {/* 3. Primary Crescent Specular Highlight (Top-Left Glare) */}
        <ellipse
          cx={r * 0.68}
          cy={r * 0.52}
          rx={r * 0.38}
          ry={r * 0.22}
          transform={`rotate(-32 ${r * 0.68} ${r * 0.52})`}
          fill="url(#clearGlarePrimary)"
          opacity="0.9"
        />

        {/* 4. Crisp Specular Light Flare Point (Pure White Spark) */}
        <circle
          cx={r * 0.55}
          cy={r * 0.42}
          r={Math.max(1.5, s * 0.06)}
          fill="#FFFFFF"
          opacity="0.98"
        />

        {/* 5. Secondary Soft Ambient Reflection (Bottom-Right Glare) */}
        <ellipse
          cx={r * 1.35}
          cy={r * 1.38}
          rx={r * 0.32}
          ry={r * 0.14}
          transform={`rotate(-28 ${r * 1.35} ${r * 1.38})`}
          fill="url(#clearGlareSecondary)"
          opacity="0.75"
        />

        {/* 6. Subtle Internal Caustic Light Arc */}
        <path
          d={`M ${r * 0.3} ${r * 1.2} Q ${r * 0.9} ${r * 1.6} ${r * 1.6} ${r * 1.1}`}
          fill="none"
          stroke="url(#clearCausticArc)"
          strokeWidth={Math.max(0.8, s * 0.025)}
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    );
  };

  return (
    <>
      <style>{`
        @keyframes floatBubbleSlow {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(6px, -16px) scale(1.02);
          }
          66% {
            transform: translate(-6px, -8px) scale(0.98);
          }
        }

        @keyframes floatBubbleMedium {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(-8px, -13px) scale(1.03);
          }
          66% {
            transform: translate(7px, -6px) scale(0.97);
          }
        }

        @keyframes floatBubbleFast {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(4px, -10px) scale(1.04);
          }
        }

        @keyframes floatBubbleReverse {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(7px, 13px) scale(0.98);
          }
          66% {
            transform: translate(-5px, 6px) scale(1.02);
          }
        }

        @keyframes pulseBubbleGlow {
          0%, 100% {
            opacity: 0.25;
            transform: scale(1);
          }
          50% {
            opacity: 0.45;
            transform: scale(1.04);
          }
        }

        .anim-float-slow {
          animation: floatBubbleSlow 8.5s ease-in-out infinite;
        }

        .anim-float-medium {
          animation: floatBubbleMedium 7s ease-in-out infinite;
        }

        .anim-float-fast {
          animation: floatBubbleFast 4.8s ease-in-out infinite;
        }

        .anim-float-reverse {
          animation: floatBubbleReverse 8s ease-in-out infinite;
        }

        .anim-pulse-glow {
          animation: pulseBubbleGlow 6s ease-in-out infinite;
        }
      `}</style>

      {/* ========================================================= */}
      {/* 1. FIXED GLOBAL CLEAR SOAP BUBBLES BACKGROUND STAGE */}
      {/* ========================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        
        {/* Soft Modern Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#eaf3fd] via-[#f2f7fd] to-[#e8f0fc]" />

        {/* Soft Ambient Radiance Orbs */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-blue-400/10 rounded-full blur-3xl anim-pulse-glow" />
        <div className="absolute top-1/2 -right-40 w-[560px] h-[560px] bg-sky-300/10 rounded-full blur-3xl anim-pulse-glow" />
        <div className="absolute bottom-10 left-1/4 w-[460px] h-[460px] bg-blue-300/8 rounded-full blur-3xl anim-pulse-glow" />
        
        {/* Subtle Minimal Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.025] bg-[radial-gradient(#1e3a8a_1.5px,transparent_1.5px)] [background-size:26px_26px]" />

        {/* PURE CLEAR TRANSPARENT SVG GRADIENTS & OPTICAL SHADERS */}
        <svg width="0" height="0" className="absolute">
          <defs>
            {/* Pure Clear Bubble Body (Translucent White / Airy Light) */}
            <radialGradient id="clearBubbleGrad" cx="38%" cy="36%" r="68%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="25%" stopColor="rgba(255, 255, 255, 0.12)" />
              <stop offset="60%" stopColor="rgba(240, 249, 255, 0.08)" />
              <stop offset="85%" stopColor="rgba(255, 255, 255, 0.22)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.4)" />
            </radialGradient>

            {/* Pure Clear Glass Rim Gradient */}
            <linearGradient id="clearRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
              <stop offset="35%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="70%" stopColor="rgba(255, 255, 255, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.85)" />
            </linearGradient>

            {/* Primary Specular Glare (Top-Left Highlight) */}
            <linearGradient id="clearGlarePrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Secondary Specular Glare (Bottom-Right Reflection) */}
            <linearGradient id="clearGlareSecondary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.75" />
            </linearGradient>

            {/* Clear Caustic Light Arc */}
            <linearGradient id="clearCausticArc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.85)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.4)" />
            </linearGradient>
          </defs>
        </svg>

        {/* 1.1 Render Far Background Bubbles */}
        {farBubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`absolute ${bubble.animation} ${bubble.blur || ''} pointer-events-none`}
            style={{
              left: bubble.left,
              right: bubble.right,
              top: bubble.top,
              bottom: bubble.bottom,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              opacity: bubble.opacity ?? 0.8,
              animationDelay: bubble.delay || '0s',
            }}
          >
            {renderClearBubbleSVG(bubble)}
          </div>
        ))}

        {/* 1.2 Render Midground Bubbles */}
        {midBubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`absolute ${bubble.animation} pointer-events-none`}
            style={{
              left: bubble.left,
              right: bubble.right,
              top: bubble.top,
              bottom: bubble.bottom,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              opacity: bubble.opacity ?? 0.8,
              animationDelay: bubble.delay || '0s',
            }}
          >
            {renderClearBubbleSVG(bubble)}
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 2. FOREGROUND OVERLAPPING CLEAR BUBBLES STAGE (z-30 pointer-events-none) */}
      {/* ทับบนแบนเนอร์ ตารางสถานที่ และองค์ประกอบส่วนต่างๆ แบบใสสะอาดตา */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden select-none">
        {foregroundOverlappingBubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`absolute ${bubble.animation} pointer-events-none`}
            style={{
              left: bubble.left,
              right: bubble.right,
              top: bubble.top,
              bottom: bubble.bottom,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              opacity: bubble.opacity ?? 0.88,
              animationDelay: bubble.delay || '0s',
            }}
          >
            {renderClearBubbleSVG(bubble)}
          </div>
        ))}
      </div>
    </>
  );
};
