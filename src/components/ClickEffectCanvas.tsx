import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
  type: 'star' | 'circle' | 'spark' | 'ring';
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export const ClickEffectCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<ClickRipple[]>([]);
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

    const colors = ['#F97316', '#FB923C', '#38BDF8', '#818CF8', '#F43F5E', '#10B981', '#FBBF24', '#A855F7'];

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

      // 1. Add expanding click ripple rings
      ripplesRef.current.push({
        x,
        y,
        radius: 4,
        maxRadius: 42,
        alpha: 0.9,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
      ripplesRef.current.push({
        x,
        y,
        radius: 2,
        maxRadius: 65,
        alpha: 0.6,
        color: '#FFFFFF',
      });

      // 2. Add colorful particle burst
      const count = 18;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 5 + 2.5;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 5 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 25 + 20,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'spark' : 'circle',
        });
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });

    // Render loop
    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Update & Draw Click Ripples
          const ripples = ripplesRef.current;
          for (let i = ripples.length - 1; i >= 0; i--) {
            const r = ripples[i];
            r.radius += (r.maxRadius - r.radius) * 0.18 + 0.5;
            r.alpha -= 0.035;

            if (r.alpha <= 0 || r.radius >= r.maxRadius) {
              ripples.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, r.alpha);
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = r.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = r.color;
            ctx.stroke();
            ctx.restore();
          }

          // Update & Draw Particles
          const particles = particlesRef.current;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life += 1;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.94; // friction
            p.vy *= 0.94;
            p.vy += 0.15; // gravity
            p.rotation += p.rotSpeed;
            p.alpha = 1 - p.life / p.maxLife;

            if (p.life >= p.maxLife || p.alpha <= 0) {
              particles.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;

            if (p.type === 'star') {
              ctx.translate(p.x, p.y);
              ctx.rotate((p.rotation * Math.PI) / 180);
              ctx.beginPath();
              for (let s = 0; s < 4; s++) {
                ctx.lineTo(
                  Math.cos((s * 90 * Math.PI) / 180) * p.size,
                  Math.sin((s * 90 * Math.PI) / 180) * p.size
                );
                ctx.lineTo(
                  Math.cos(((s * 90 + 45) * Math.PI) / 180) * (p.size * 0.35),
                  Math.sin(((s * 90 + 45) * Math.PI) / 180) * (p.size * 0.35)
                );
              }
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(p.x, p.y, Math.max(0.5, p.size * (1 - p.life / p.maxLife)), 0, Math.PI * 2);
              ctx.fill();
            }

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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
