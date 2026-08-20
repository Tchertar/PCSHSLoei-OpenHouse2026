import React, { useEffect, useRef } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

interface PaperAirplane {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  scale: number;
  alpha: number;
  life: number;
  maxLife: number;
  curveFactor: number;
  wingColor: string;
  shadowColor: string;
  accentColor: string;
  trail: TrailPoint[];
  wobblePhase: number;
  wobbleSpeed: number;
}

export const ClickEffectCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const planesRef = useRef<PaperAirplane[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Color palettes for paper airplanes (Clean White, Sky Blue, Warm Orange, Pastel Lavender, Golden Glow)
    const planeVariants = [
      {
        wing: '#FFFFFF',
        shadow: '#E2E8F0',
        accent: '#3B82F6',
        trail: 'rgba(59, 130, 246, 0.4)',
      },
      {
        wing: '#FFFFFF',
        shadow: '#CBD5E1',
        accent: '#F97316',
        trail: 'rgba(249, 115, 22, 0.4)',
      },
      {
        wing: '#F0F9FF',
        shadow: '#BAE6FD',
        accent: '#0284C7',
        trail: 'rgba(2, 132, 199, 0.4)',
      },
      {
        wing: '#FFFBEB',
        shadow: '#FDE68A',
        accent: '#F59E0B',
        trail: 'rgba(245, 158, 11, 0.4)',
      },
      {
        wing: '#FAF5FF',
        shadow: '#E9D5FF',
        accent: '#9333EA',
        trail: 'rgba(147, 51, 234, 0.4)',
      },
    ];

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      let x = 0;
      let y = 0;
      if (e instanceof MouseEvent) {
        x = e.clientX;
        y = e.clientY;
      } else if (e.touches && e.touches.length > 0) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      }

      // หายไปทันทีเมื่อคลิกครั้งต่อไป: Clear previous paper airplanes instantly on new click
      planesRef.current = [];

      // Spawn 2 to 3 paper airplanes flying outwards on click
      const spawnCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 planes

      for (let i = 0; i < spawnCount; i++) {
        // Natural upward & sideways soaring trajectories (-25deg to -155deg or full 360 spread with upward bias)
        const baseAngle =
          (Math.PI * 2 * (i + Math.random() * 0.5)) / spawnCount - Math.PI / 2;
        const initialSpeed = Math.random() * 4 + 6.5; // Smooth launch velocity
        const variant = planeVariants[Math.floor(Math.random() * planeVariants.length)];

        planesRef.current.push({
          x,
          y,
          vx: Math.cos(baseAngle) * initialSpeed,
          vy: Math.sin(baseAngle) * initialSpeed,
          angle: baseAngle,
          speed: initialSpeed,
          scale: Math.random() * 0.35 + 0.75, // Scale 0.75x to 1.1x
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 35 + 55, // 55 to 90 frames (~1.0 - 1.5 seconds)
          curveFactor: (Math.random() - 0.5) * 0.035, // Aerodynamic gentle bank curve
          wingColor: variant.wing,
          shadowColor: variant.shadow,
          accentColor: variant.accent,
          trail: [{ x, y, alpha: 1 }],
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.12 + 0.08,
        });
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });

    // Render loop for Paper Airplanes
    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const planes = planesRef.current;

          for (let i = planes.length - 1; i >= 0; i--) {
            const p = planes[i];
            p.life++;

            // Fade out towards end of life
            if (p.life > p.maxLife * 0.7) {
              const remaining = p.maxLife - p.life;
              const fadeDuration = p.maxLife * 0.3;
              p.alpha = Math.max(0, remaining / fadeDuration);
            }

            if (p.life >= p.maxLife || p.alpha <= 0) {
              planes.splice(i, 1);
              continue;
            }

            // Aerodynamic flight physics: gliding, lift, and gentle swooping curve
            p.angle += p.curveFactor;
            p.vy -= 0.04; // Slight aerodynamic thermal lift
            p.speed *= 0.985; // Natural drag

            p.vx = Math.cos(p.angle) * p.speed;
            p.vy = Math.sin(p.angle) * p.speed - 0.2; // Soaring lift
            p.x += p.vx;
            p.y += p.vy;

            p.wobblePhase += p.wobbleSpeed;

            // Record wind flight path trail
            if (p.life % 2 === 0) {
              p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
              if (p.trail.length > 14) {
                p.trail.shift();
              }
            }

            // 1. DRAW FLIGHT STREAM / WIND CONTRAIL (เส้นทางลมพริ้วๆ)
            if (p.trail.length > 1) {
              ctx.save();
              ctx.setLineDash([4, 4]);
              ctx.lineCap = 'round';
              ctx.lineWidth = 1.8 * p.scale;
              ctx.strokeStyle = p.accentColor;

              for (let t = 0; t < p.trail.length - 1; t++) {
                const pt1 = p.trail[t];
                const pt2 = p.trail[t + 1];
                const trailAlpha = (t / p.trail.length) * pt2.alpha * 0.5;

                ctx.globalAlpha = trailAlpha;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              }
              ctx.restore();
            }

            // 2. DRAW 3D ORIGAMI PAPER AIRPLANE
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.scale(p.scale, p.scale);
            ctx.globalAlpha = p.alpha;

            // Subtle bank/roll perspective wobble
            const bankRoll = Math.sin(p.wobblePhase) * 0.15;
            ctx.transform(1, 0, bankRoll, 1, 0, 0);

            // Plane Dimensions
            const noseX = 22;
            const noseY = 0;
            const tailX = -18;
            const tailInnerX = -12;
            const wingSpanY = 15;
            const keelDepthY = 5;

            // Drop shadow under plane for 3D elevation
            ctx.save();
            ctx.translate(2, 6);
            ctx.beginPath();
            ctx.moveTo(noseX, noseY);
            ctx.lineTo(tailX, -wingSpanY);
            ctx.lineTo(tailInnerX, 0);
            ctx.lineTo(tailX, wingSpanY);
            ctx.closePath();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
            ctx.filter = 'blur(3px)';
            ctx.fill();
            ctx.restore();

            // Wing Top Half (Light Face)
            ctx.beginPath();
            ctx.moveTo(noseX, noseY);
            ctx.lineTo(tailX, -wingSpanY);
            ctx.lineTo(tailInnerX, 0);
            ctx.closePath();
            ctx.fillStyle = p.wingColor;
            ctx.fill();
            ctx.lineWidth = 0.8;
            ctx.strokeStyle = '#CBD5E1';
            ctx.stroke();

            // Center Fold / Keel Top Shadow
            ctx.beginPath();
            ctx.moveTo(noseX, noseY);
            ctx.lineTo(tailInnerX, 0);
            ctx.lineTo(tailX, -keelDepthY);
            ctx.closePath();
            ctx.fillStyle = p.shadowColor;
            ctx.fill();

            // Wing Bottom Half (Shadowed/Tilted Face for 3D Origami Crease)
            ctx.beginPath();
            ctx.moveTo(noseX, noseY);
            ctx.lineTo(tailInnerX, 0);
            ctx.lineTo(tailX, wingSpanY);
            ctx.closePath();
            ctx.fillStyle = p.shadowColor;
            ctx.fill();
            ctx.lineWidth = 0.8;
            ctx.strokeStyle = '#94A3B8';
            ctx.stroke();

            // Accent Decorative Stripe on Top Wing (Sporty Open House aesthetic)
            ctx.beginPath();
            ctx.moveTo(noseX - 8, -1.5);
            ctx.lineTo(tailX + 4, -wingSpanY * 0.65);
            ctx.lineTo(tailX + 1, -wingSpanY * 0.85);
            ctx.lineTo(noseX - 4, -0.8);
            ctx.closePath();
            ctx.fillStyle = p.accentColor;
            ctx.fill();

            // Center Spine Highlight
            ctx.beginPath();
            ctx.moveTo(noseX, noseY);
            ctx.lineTo(tailInnerX, 0);
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();

            ctx.restore();
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
    />
  );
};
