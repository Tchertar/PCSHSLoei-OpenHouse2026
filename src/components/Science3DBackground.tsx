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
  hueShift?: number; // 0: sky-cyan, 1: purple-pink, 2: warm-gold, 3: emerald-cyan
  isOverlapBanner?: boolean;
}

export const Science3DBackground: React.FC = () => {
  // Collection of multi-sized iridescent soap bubbles with distinct depth of field & balanced spatial distribution
  const bubbles: BubbleData[] = [
    // --- LAYER 1: FAR BACKGROUND (Soft Blur, Small to Medium) ---
    { id: 'far-1', size: 36, left: '6%', top: '12%', animation: 'anim-float-slow', delay: '0s', blur: 'blur-[2.5px]', opacity: 0.45, hueShift: 0 },
    { id: 'far-2', size: 24, left: '18%', top: '28%', animation: 'anim-float-medium', delay: '1.2s', blur: 'blur-[3px]', opacity: 0.4, hueShift: 1 },
    { id: 'far-3', size: 48, right: '8%', top: '15%', animation: 'anim-float-reverse', delay: '0.5s', blur: 'blur-[2px]', opacity: 0.5, hueShift: 2 },
    { id: 'far-4', size: 30, right: '20%', top: '35%', animation: 'anim-float-slow', delay: '2s', blur: 'blur-[3px]', opacity: 0.4, hueShift: 0 },
    { id: 'far-5', size: 42, left: '10%', top: '65%', animation: 'anim-float-medium', delay: '1.8s', blur: 'blur-[2px]', opacity: 0.45, hueShift: 3 },
    { id: 'far-6', size: 28, right: '12%', bottom: '25%', animation: 'anim-float-slow', delay: '0.8s', blur: 'blur-[2.5px]', opacity: 0.4, hueShift: 1 },
    { id: 'far-7', size: 55, left: '4%', bottom: '15%', animation: 'anim-float-reverse', delay: '2.5s', blur: 'blur-[2px]', opacity: 0.5, hueShift: 2 },
    { id: 'far-8', size: 34, right: '4%', bottom: '8%', animation: 'anim-float-medium', delay: '1.5s', blur: 'blur-[2.5px]', opacity: 0.45, hueShift: 0 },

    // --- LAYER 2: MIDGROUND (Crisp, High-Detail 3D Soap Bubbles - Well Spaced across sides) ---
    // Left Side Margin
    { id: 'mid-left-1', size: 75, left: '2%', top: '8%', animation: 'anim-float-slow', delay: '0s', opacity: 0.85, hueShift: 0 },
    { id: 'mid-left-2', size: 48, left: '4.5%', top: '24%', animation: 'anim-float-medium', delay: '1.5s', opacity: 0.8, hueShift: 1 },
    { id: 'mid-left-3', size: 105, left: '1.5%', top: '44%', animation: 'anim-float-reverse', delay: '0.8s', opacity: 0.9, hueShift: 2 },
    { id: 'mid-left-4', size: 60, left: '3%', top: '62%', animation: 'anim-float-slow', delay: '2.2s', opacity: 0.85, hueShift: 3 },
    { id: 'mid-left-5', size: 85, left: '2%', bottom: '8%', animation: 'anim-float-medium', delay: '1.1s', opacity: 0.88, hueShift: 0 },

    // Right Side Margin
    { id: 'mid-right-1', size: 68, right: '2%', top: '10%', animation: 'anim-float-medium', delay: '0.7s', opacity: 0.85, hueShift: 1 },
    { id: 'mid-right-2', size: 110, right: '1.5%', top: '26%', animation: 'anim-float-slow', delay: '1.9s', opacity: 0.9, hueShift: 0 },
    { id: 'mid-right-3', size: 52, right: '4%', top: '48%', animation: 'anim-float-reverse', delay: '0.4s', opacity: 0.8, hueShift: 2 },
    { id: 'mid-right-4', size: 90, right: '2%', top: '68%', animation: 'anim-float-medium', delay: '1.6s', opacity: 0.88, hueShift: 3 },
    { id: 'mid-right-5', size: 70, right: '2.5%', bottom: '10%', animation: 'anim-float-slow', delay: '2.8s', opacity: 0.85, hueShift: 1 },

    // Clustered tiny companion bubbles for organic feel
    { id: 'tiny-1', size: 18, left: '6%', top: '9%', animation: 'anim-float-fast', delay: '0.3s', opacity: 0.75, hueShift: 0 },
    { id: 'tiny-2', size: 14, left: '2.5%', top: '47%', animation: 'anim-float-fast', delay: '1.1s', opacity: 0.7, hueShift: 2 },
    { id: 'tiny-3', size: 20, right: '5.5%', top: '28%', animation: 'anim-float-fast', delay: '0.6s', opacity: 0.75, hueShift: 1 },
    { id: 'tiny-4', size: 16, right: '3.5%', top: '72%', animation: 'anim-float-fast', delay: '1.7s', opacity: 0.7, hueShift: 3 },
  ];

  // Foreground bubbles that gently overlap the banner
  const bannerOverlapBubbles: BubbleData[] = [
    // Bottom-Left of Banner (Replacing previous flask area)
    { id: 'fg-banner-left-1', size: 115, left: '1.5%', top: '340px', animation: 'anim-float-slow', delay: '0s', opacity: 0.92, hueShift: 1, isOverlapBanner: true },
    { id: 'fg-banner-left-2', size: 45, left: '7%', top: '320px', animation: 'anim-float-medium', delay: '1.2s', opacity: 0.85, hueShift: 0, isOverlapBanner: true },
    { id: 'fg-banner-left-3', size: 22, left: '0.5%', top: '390px', animation: 'anim-float-fast', delay: '0.5s', opacity: 0.8, hueShift: 2, isOverlapBanner: true },

    // Top-Right of Banner (Replacing previous atom area)
    { id: 'fg-banner-right-1', size: 95, right: '1.5%', top: '65px', animation: 'anim-float-medium', delay: '0.4s', opacity: 0.92, hueShift: 0, isOverlapBanner: true },
    { id: 'fg-banner-right-2', size: 40, right: '6.5%', top: '50px', animation: 'anim-float-slow', delay: '1.6s', opacity: 0.85, hueShift: 2, isOverlapBanner: true },
    { id: 'fg-banner-right-3', size: 20, right: '1%', top: '135px', animation: 'anim-float-fast', delay: '0.9s', opacity: 0.78, hueShift: 1, isOverlapBanner: true },
  ];

  const renderBubbleSVG = (bubble: BubbleData) => {
    const s = bubble.size;
    const r = s / 2;
    const gradId = `bubbleGrad-${bubble.hueShift || 0}`;
    const rimGradId = `rimGrad-${bubble.hueShift || 0}`;

    return (
      <svg
        viewBox={`0 0 ${s} ${s}`}
        width={s}
        height={s}
        className="w-full h-full drop-shadow-md select-none pointer-events-none"
      >
        {/* Drop shadow / ambient glow */}
        <circle
          cx={r}
          cy={r}
          r={r - 1.5}
          fill={`url(#${gradId})`}
        />

        {/* Iridescent Rainbow Border Rim */}
        <circle
          cx={r}
          cy={r}
          r={r - 1.5}
          fill="none"
          stroke={`url(#${rimGradId})`}
          strokeWidth={Math.max(1.2, s * 0.045)}
        />

        {/* Primary Crescent Highlight (Top-Left) */}
        <ellipse
          cx={r * 0.68}
          cy={r * 0.52}
          rx={r * 0.38}
          ry={r * 0.22}
          transform={`rotate(-32 ${r * 0.68} ${r * 0.52})`}
          fill="url(#glarePrimary)"
          opacity="0.85"
        />

        {/* Top-edge crisp specular dot */}
        <circle
          cx={r * 0.55}
          cy={r * 0.42}
          r={Math.max(1.5, s * 0.06)}
          fill="#FFFFFF"
          opacity="0.95"
        />

        {/* Secondary Soft Reflection (Bottom-Right) */}
        <ellipse
          cx={r * 1.35}
          cy={r * 1.38}
          rx={r * 0.32}
          ry={r * 0.14}
          transform={`rotate(-28 ${r * 1.35} ${r * 1.38})`}
          fill="url(#glareSecondary)"
          opacity="0.6"
        />

        {/* Internal Prismatic Ring Reflection Curve */}
        <path
          d={`M ${r * 0.3} ${r * 1.2} Q ${r * 0.9} ${r * 1.6} ${r * 1.6} ${r * 1.1}`}
          fill="none"
          stroke="url(#prismaticArc)"
          strokeWidth={Math.max(1, s * 0.03)}
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
            transform: translate(6px, -18px) scale(1.03);
          }
          66% {
            transform: translate(-6px, -10px) scale(0.98);
          }
        }

        @keyframes floatBubbleMedium {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(-8px, -14px) scale(1.04);
          }
          66% {
            transform: translate(7px, -8px) scale(0.97);
          }
        }

        @keyframes floatBubbleFast {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(4px, -12px) scale(1.06);
          }
        }

        @keyframes floatBubbleReverse {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(8px, 14px) scale(0.98);
          }
          66% {
            transform: translate(-5px, 6px) scale(1.03);
          }
        }

        @keyframes pulseBubbleGlow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.55;
            transform: scale(1.05);
          }
        }

        .anim-float-slow {
          animation: floatBubbleSlow 8s ease-in-out infinite;
        }

        .anim-float-medium {
          animation: floatBubbleMedium 6.5s ease-in-out infinite;
        }

        .anim-float-fast {
          animation: floatBubbleFast 4.5s ease-in-out infinite;
        }

        .anim-float-reverse {
          animation: floatBubbleReverse 7.5s ease-in-out infinite;
        }

        .anim-pulse-glow {
          animation: pulseBubbleGlow 6s ease-in-out infinite;
        }
      `}</style>

      {/* ========================================================= */}
      {/* FIXED GLOBAL 3D SOAP BUBBLES BACKGROUND STAGE */}
      {/* ========================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        
        {/* Soft Modern Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#eaf3fd] via-[#f2f7fd] to-[#e8f0fc]" />

        {/* Soft Ambient Radiance Orbs for Translucent Soap Film Depth */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-blue-400/12 rounded-full blur-3xl anim-pulse-glow" />
        <div className="absolute top-1/2 -right-40 w-[560px] h-[560px] bg-indigo-300/12 rounded-full blur-3xl anim-pulse-glow" />
        <div className="absolute bottom-10 left-1/4 w-[460px] h-[460px] bg-sky-300/10 rounded-full blur-3xl anim-pulse-glow" />
        
        {/* Subtle Minimal Scientific Dot Pattern */}
        <div className="absolute inset-0 opacity-[0.025] bg-[radial-gradient(#1e3a8a_1.5px,transparent_1.5px)] [background-size:26px_26px]" />

        {/* SHARED SVG GRADIENT & SHADER DEFINITIONS */}
        <svg width="0" height="0" className="absolute">
          <defs>
            {/* Primary Glare Gradient (Top-Left Highlight) */}
            <linearGradient id="glarePrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="80%" stopColor="#E0F2FE" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0" />
            </linearGradient>

            {/* Secondary Soft Glare Gradient (Bottom-Right Reflection) */}
            <linearGradient id="glareSecondary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBCFE8" stopOpacity="0" />
              <stop offset="40%" stopColor="#DDD6FE" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.75" />
            </linearGradient>

            {/* Prismatic Arc Highlight */}
            <linearGradient id="prismaticArc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="35%" stopColor="#C084FC" />
              <stop offset="70%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>

            {/* --- VARIANT 0: SKY BLUE / CYAN IRIDESCENT BUBBLE --- */}
            <radialGradient id="bubbleGrad-0" cx="38%" cy="36%" r="68%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="30%" stopColor="rgba(224, 242, 254, 0.15)" />
              <stop offset="65%" stopColor="rgba(186, 230, 253, 0.22)" />
              <stop offset="88%" stopColor="rgba(192, 132, 252, 0.35)" />
              <stop offset="98%" stopColor="rgba(56, 189, 248, 0.55)" />
              <stop offset="100%" stopColor="rgba(37, 99, 235, 0.4)" />
            </radialGradient>
            <linearGradient id="rimGrad-0" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
              <stop offset="25%" stopColor="rgba(56, 189, 248, 0.85)" />
              <stop offset="50%" stopColor="rgba(192, 132, 252, 0.8)" />
              <stop offset="75%" stopColor="rgba(244, 114, 182, 0.75)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0.9)" />
            </linearGradient>

            {/* --- VARIANT 1: PURPLE / PINK / LAVENDER IRIDESCENT BUBBLE --- */}
            <radialGradient id="bubbleGrad-1" cx="38%" cy="36%" r="68%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
              <stop offset="30%" stopColor="rgba(243, 232, 255, 0.18)" />
              <stop offset="65%" stopColor="rgba(233, 213, 255, 0.25)" />
              <stop offset="88%" stopColor="rgba(244, 114, 182, 0.38)" />
              <stop offset="98%" stopColor="rgba(147, 51, 234, 0.5)" />
              <stop offset="100%" stopColor="rgba(99, 102, 241, 0.4)" />
            </radialGradient>
            <linearGradient id="rimGrad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
              <stop offset="25%" stopColor="rgba(168, 85, 247, 0.85)" />
              <stop offset="50%" stopColor="rgba(244, 114, 182, 0.8)" />
              <stop offset="75%" stopColor="rgba(56, 189, 248, 0.75)" />
              <stop offset="100%" stopColor="rgba(192, 132, 252, 0.9)" />
            </linearGradient>

            {/* --- VARIANT 2: WARM AMBER / SUNSET GOLD IRIDESCENT BUBBLE --- */}
            <radialGradient id="bubbleGrad-2" cx="38%" cy="36%" r="68%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
              <stop offset="30%" stopColor="rgba(254, 243, 199, 0.15)" />
              <stop offset="65%" stopColor="rgba(253, 230, 138, 0.22)" />
              <stop offset="88%" stopColor="rgba(249, 115, 22, 0.35)" />
              <stop offset="98%" stopColor="rgba(234, 88, 12, 0.5)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0.4)" />
            </radialGradient>
            <linearGradient id="rimGrad-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
              <stop offset="25%" stopColor="rgba(245, 158, 11, 0.85)" />
              <stop offset="50%" stopColor="rgba(244, 63, 94, 0.75)" />
              <stop offset="75%" stopColor="rgba(168, 85, 247, 0.7)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0.9)" />
            </linearGradient>

            {/* --- VARIANT 3: EMERALD / CYAN FRESH IRIDESCENT BUBBLE --- */}
            <radialGradient id="bubbleGrad-3" cx="38%" cy="36%" r="68%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
              <stop offset="30%" stopColor="rgba(207, 250, 254, 0.15)" />
              <stop offset="65%" stopColor="rgba(167, 243, 208, 0.22)" />
              <stop offset="88%" stopColor="rgba(6, 182, 212, 0.35)" />
              <stop offset="98%" stopColor="rgba(16, 185, 129, 0.5)" />
              <stop offset="100%" stopColor="rgba(14, 165, 233, 0.4)" />
            </radialGradient>
            <linearGradient id="rimGrad-3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
              <stop offset="25%" stopColor="rgba(52, 211, 153, 0.85)" />
              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.8)" />
              <stop offset="75%" stopColor="rgba(99, 102, 241, 0.7)" />
              <stop offset="100%" stopColor="rgba(45, 212, 191, 0.9)" />
            </linearGradient>
          </defs>
        </svg>

        {/* RENDER ALL BACKGROUND SOAP BUBBLES */}
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`absolute ${bubble.animation} ${bubble.blur || ''} pointer-events-none transition-all`}
            style={{
              left: bubble.left,
              right: bubble.right,
              top: bubble.top,
              bottom: bubble.bottom,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              opacity: bubble.opacity ?? 0.85,
              animationDelay: bubble.delay || '0s',
            }}
          >
            {renderBubbleSVG(bubble)}
          </div>
        ))}

      </div>

      {/* ========================================================= */}
      {/* LAYER 3: FOREGROUND SOAP BUBBLES OVERLAPPING BANNER EDGES */}
      {/* ========================================================= */}
      {bannerOverlapBubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`fixed z-20 ${bubble.animation} pointer-events-none drop-shadow-xl`}
          style={{
            left: bubble.left,
            right: bubble.right,
            top: bubble.top,
            bottom: bubble.bottom,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            opacity: bubble.opacity ?? 0.9,
            animationDelay: bubble.delay || '0s',
          }}
        >
          {renderBubbleSVG(bubble)}
        </div>
      ))}
    </>
  );
};
