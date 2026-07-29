import React, { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  shape: 'star' | 'circle' | 'spark';
}

export const PaperPlaneCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [angle, setAngle] = useState(-45); // initial angle pointing top-right
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const prevPosRef = useRef({ x: -100, y: -100 });
  const targetPosRef = useRef({ x: -100, y: -100 });
  const targetAngleRef = useRef(-45);
  const currentAngleRef = useRef(-45);
  const animFrameRef = useRef<number | null>(null);
  const lastParticleTimeRef = useRef<number>(0);

  useEffect(() => {
    // Check if device supports fine pointer (mouse)
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    if (isCoarse) return;

    // Handle Canvas resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse Move listener
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;

      if (!isVisible) setIsVisible(true);

      targetPosRef.current = { x, y };

      // Calculate direction angle
      const dx = x - prevPosRef.current.x;
      const dy = y - prevPosRef.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 2) {
        // Math.atan2 gives radians. Convert to degrees.
        // SVG plane naturally points up-right at ~ -45deg, so offset accordingly
        const rad = Math.atan2(dy, dx);
        let deg = (rad * 180) / Math.PI + 90; // Align nose to movement direction
        targetAngleRef.current = deg;

        // Spawn trail particles when moving
        const now = performance.now();
        if (now - lastParticleTimeRef.current > 20) {
          lastParticleTimeRef.current = now;
          spawnParticles(x, y, dx, dy, deg);
        }
      }

      // Check if hovering interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('a, button, input, select, textarea, [role="button"], label, .cursor-pointer')
        );
        setIsHovering(isInteractive);
      }
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Color palette for trail particles
    const colors = ['#F97316', '#FB923C', '#38BDF8', '#60A5FA', '#FDE047', '#FFFFFF'];

    const spawnParticles = (x: number, y: number, dx: number, dy: number, moveAngle: number) => {
      const particleCount = isHovering ? 3 : 2;
      for (let i = 0; i < particleCount; i++) {
        const spread = (Math.random() - 0.5) * 0.8;
        const speed = Math.random() * 2 + 1;
        // Direction opposite to movement + slight random spread
        const backAngle = (moveAngle - 90 + 180) * (Math.PI / 180) + spread;

        particlesRef.current.push({
          id: Math.random(),
          x: x - (dx / 2) + (Math.random() - 0.5) * 6,
          y: y - (dy / 2) + (Math.random() - 0.5) * 6,
          vx: Math.cos(backAngle) * speed + (Math.random() - 0.5),
          vy: Math.sin(backAngle) * speed + (Math.random() - 0.5) - 0.3, // slight upward float
          size: Math.random() * 4 + 2,
          maxSize: Math.random() * 5 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.95,
          life: 0,
          maxLife: Math.random() * 25 + 20,
          rotation: Math.random() * 360,
          shape: Math.random() > 0.4 ? 'star' : Math.random() > 0.5 ? 'spark' : 'circle',
        });
      }
    };

    // Animation Loop
    let lastTime = performance.now();
    const renderLoop = (time: number) => {
      // Lerp position for silky smooth movement
      const lerpFactor = 0.35;
      const currentX = prevPosRef.current.x + (targetPosRef.current.x - prevPosRef.current.x) * lerpFactor;
      const currentY = prevPosRef.current.y + (targetPosRef.current.y - prevPosRef.current.y) * lerpFactor;

      // Lerp angle smoothly (handling angle wrap-around)
      let diffAngle = targetAngleRef.current - currentAngleRef.current;
      while (diffAngle < -180) diffAngle += 360;
      while (diffAngle > 180) diffAngle -= 360;
      currentAngleRef.current += diffAngle * 0.25;

      prevPosRef.current = { x: currentX, y: currentY };
      setPosition({ x: currentX, y: currentY });
      setAngle(currentAngleRef.current);

      // Render Particles Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Update & Draw Particles
          const particles = particlesRef.current;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life += 1;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96; // drag
            p.vy *= 0.96;
            p.alpha = 1 - p.life / p.maxLife;
            p.size = p.maxSize * (1 - p.life / p.maxLife);

            if (p.life >= p.maxLife || p.alpha <= 0) {
              particles.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.strokeStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;

            if (p.shape === 'star') {
              ctx.translate(p.x, p.y);
              ctx.rotate((p.rotation + p.life * 4) * (Math.PI / 180));
              ctx.beginPath();
              for (let s = 0; s < 4; s++) {
                ctx.lineTo(Math.cos((s * 90 * Math.PI) / 180) * p.size, Math.sin((s * 90 * Math.PI) / 180) * p.size);
                ctx.lineTo(
                  Math.cos(((s * 90 + 45) * Math.PI) / 180) * (p.size * 0.35),
                  Math.sin(((s * 90 + 45) * Math.PI) / 180) * (p.size * 0.35)
                );
              }
              ctx.closePath();
              ctx.fill();
            } else if (p.shape === 'spark') {
              ctx.beginPath();
              ctx.arc(p.x, p.y, Math.max(0.5, p.size * 0.7), 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isVisible, isHovering]);

  if (!isVisible) return null;

  return (
    <>
      {/* Background Canvas for Particle Wind Trail */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* Custom Paper Plane Cursor */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0px) translate(-50%, -50%)`,
        }}
      >
        <div
          className="transition-all duration-200 ease-out"
          style={{
            transform: `rotate(${angle}deg) scale(${isMouseDown ? 0.85 : isHovering ? 1.35 : 1})`,
          }}
        >
          {/* Paper Plane Vector Graphics */}
          <div className="relative filter drop-shadow-[0_4px_12px_rgba(249,115,22,0.45)]">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transform -rotate-45"
            >
              <defs>
                {/* Gradient for left wing */}
                <linearGradient id="planeBodyLeft" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF7ED" />
                  <stop offset="60%" stopColor="#FED7AA" />
                  <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
                {/* Gradient for right wing */}
                <linearGradient id="planeBodyRight" x1="32" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="70%" stopColor="#FDBA74" />
                  <stop offset="100%" stopColor="#EA580C" />
                </linearGradient>
                {/* Inner fold shadow */}
                <linearGradient id="planeFoldShadow" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#C2410C" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#7C2D12" stopOpacity="0.4" />
                </linearGradient>
                {/* Glow filter */}
                <filter id="paperGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#F97316" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* Main Outer Paper Wings */}
              {/* Left Wing */}
              <path
                d="M16 2L3 28L16 21V2Z"
                fill="url(#planeBodyLeft)"
                stroke="#F97316"
                strokeWidth="0.75"
                strokeLinejoin="round"
              />

              {/* Right Wing */}
              <path
                d="M16 2L29 28L16 21V2Z"
                fill="url(#planeBodyRight)"
                stroke="#EA580C"
                strokeWidth="0.75"
                strokeLinejoin="round"
              />

              {/* Center Fold Lines & Underneath Shade */}
              <path
                d="M16 21L11 29L16 25L21 29L16 21Z"
                fill="url(#planeFoldShadow)"
              />

              {/* Center Spine Glow Line */}
              <line
                x1="16"
                y1="2"
                x2="16"
                y2="25"
                stroke="#FFFFFF"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>

            {/* Hover Pulsing Ring */}
            {isHovering && (
              <div className="absolute -inset-2 border-2 border-orange-400/70 rounded-full animate-ping pointer-events-none" />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
