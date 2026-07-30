import React, { useEffect, useRef } from 'react';

interface StardustParticle {
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
  points: number;
  twinkleSpeed: number;
  type: 'star4' | 'star5' | 'glitter' | 'spark';
}

interface CosmicRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export const ClickEffectCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<StardustParticle[]>([]);
  const ringsRef = useRef<CosmicRing[]>([]);
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

    // Cosmic stardust color palette
    const stardustColors = [
      '#FBBF24', // Gold
      '#F59E0B', // Amber
      '#38BDF8', // Starlight Cyan
      '#C084FC', // Nebula Purple
      '#E879F9', // Cosmic Pink
      '#F43F5E', // Nova Red
      '#34D399', // Emerald Dust
      '#FFFFFF', // Pure White Star
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

      // 1. Expanding Cosmic Stardust Rings
      ringsRef.current.push({
        x,
        y,
        radius: 2,
        maxRadius: 55,
        alpha: 0.9,
        color: stardustColors[Math.floor(Math.random() * stardustColors.length)],
      });
      ringsRef.current.push({
        x,
        y,
        radius: 1,
        maxRadius: 85,
        alpha: 0.6,
        color: '#FFFFFF',
      });

      // 2. Burst of Stardust Sparkles (สะเก็ดดาว)
      const count = 32;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
        const speed = Math.random() * 7 + 2;
        const pType: 'star4' | 'star5' | 'glitter' | 'spark' =
          i % 4 === 0 ? 'star4' : i % 4 === 1 ? 'star5' : i % 4 === 2 ? 'glitter' : 'spark';

        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 8 + 4,
          color: stardustColors[Math.floor(Math.random() * stardustColors.length)],
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 30 + 25,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 16,
          points: i % 2 === 0 ? 4 : 5,
          twinkleSpeed: Math.random() * 0.3 + 0.1,
          type: pType,
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

          // Render Cosmic Rings
          const rings = ringsRef.current;
          for (let i = rings.length - 1; i >= 0; i--) {
            const r = rings[i];
            r.radius += (r.maxRadius - r.radius) * 0.16 + 0.5;
            r.alpha -= 0.03;

            if (r.alpha <= 0 || r.radius >= r.maxRadius) {
              rings.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, r.alpha);
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = r.color;
            ctx.shadowBlur = 12;
            ctx.shadowColor = r.color;
            ctx.stroke();
            ctx.restore();
          }

          // Render Stardust Particles
          const particles = particlesRef.current;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life += 1;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.93; // friction
            p.vy *= 0.93;
            p.vy += 0.08; // light gravity drift
            p.rotation += p.rotSpeed;

            // Twinkle effect
            const fade = 1 - p.life / p.maxLife;
            const twinkle = 0.7 + 0.3 * Math.sin(p.life * p.twinkleSpeed);
            p.alpha = Math.max(0, fade * twinkle);

            if (p.life >= p.maxLife || p.alpha <= 0) {
              particles.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.strokeStyle = p.color;
            ctx.shadowBlur = 12;
            ctx.shadowColor = p.color;

            if (p.type === 'star4' || p.type === 'star5') {
              // Draw Multi-pointed Star Particle (สะเก็ดดาว)
              ctx.translate(p.x, p.y);
              ctx.rotate((p.rotation * Math.PI) / 180);
              const numPoints = p.points;
              const outerRadius = p.size;
              const innerRadius = p.size * 0.35;

              ctx.beginPath();
              for (let pt = 0; pt < numPoints * 2; pt++) {
                const r = pt % 2 === 0 ? outerRadius : innerRadius;
                const angle = (pt * Math.PI) / numPoints;
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
              }
              ctx.closePath();
              ctx.fill();

              // Center bright core dot
              ctx.fillStyle = '#FFFFFF';
              ctx.beginPath();
              ctx.arc(0, 0, p.size * 0.2, 0, Math.PI * 2);
              ctx.fill();
            } else if (p.type === 'glitter') {
              // Draw 4-ray Star Burst Cross
              ctx.translate(p.x, p.y);
              ctx.rotate((p.rotation * Math.PI) / 180);
              const s = p.size * 1.2;

              ctx.beginPath();
              ctx.moveTo(-s, 0);
              ctx.quadraticCurveTo(0, 0, 0, -s);
              ctx.quadraticCurveTo(0, 0, s, 0);
              ctx.quadraticCurveTo(0, 0, 0, s);
              ctx.quadraticCurveTo(0, 0, -s, 0);
              ctx.closePath();
              ctx.fill();
            } else {
              // Sparkle Circle Dust
              ctx.beginPath();
              ctx.arc(p.x, p.y, Math.max(0.5, p.size * fade), 0, Math.PI * 2);
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
