import React, { useEffect, useRef } from 'react';

interface CelebrationCanvasProps {
  active: boolean;
  type: 'confetti' | 'fireworks' | 'both';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  type: 'confetti' | 'spark';
  rotation?: number;
  rotationSpeed?: number;
}

export const CelebrationCanvas: React.FC<CelebrationCanvasProps> = ({ active, type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!active) {
      particlesRef.current = [];
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];

    const createConfetti = () => {
      const pCount = 120;
      for (let i = 0; i < pCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: -20 - Math.random() * 100,
          vx: (Math.random() - 0.5) * 6,
          vy: 2 + Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 8,
          alpha: 1,
          decay: 0.002 + Math.random() * 0.003,
          type: 'confetti',
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
        });
      }
    };

    const createFirework = (x: number, y: number) => {
      const pCount = 60;
      const fireworkColor = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < pCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: fireworkColor,
          size: 2 + Math.random() * 3,
          alpha: 1,
          decay: 0.015 + Math.random() * 0.01,
          type: 'spark',
        });
      }
    };

    // Bootstrap initial particles
    if (type === 'confetti' || type === 'both') {
      createConfetti();
    }

    let lastFireworkTime = 0;

    const loop = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Periodically trigger fireworks in background
      if ((type === 'fireworks' || type === 'both') && timestamp - lastFireworkTime > 1200) {
        lastFireworkTime = timestamp;
        // Launch a random firework
        const fireworkX = 100 + Math.random() * (canvas.width - 200);
        const fireworkY = 100 + Math.random() * (canvas.height / 2);
        createFirework(fireworkX, fireworkY);
      }

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'confetti') {
          p.vy += 0.05; // gravity for confetti
          p.vx += Math.sin(timestamp * 0.005 + i) * 0.02; // wind sway
          if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
            p.rotation += p.rotationSpeed;
          }
        } else {
          p.vy += 0.08; // gravity for firework sparks
          p.vx *= 0.98; // friction
          p.vy *= 0.98;
        }

        p.alpha -= p.decay;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.type === 'confetti') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation || 0);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 1.5);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Filter out dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0 && p.y < canvas.height + 20);

      // Keep spawning minor confetti if active
      if ((type === 'confetti' || type === 'both') && particlesRef.current.filter(p => p.type === 'confetti').length < 60) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: -20,
          vx: (Math.random() - 0.5) * 4,
          vy: 2 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 5 + Math.random() * 8,
          alpha: 1,
          decay: 0.002 + Math.random() * 0.003,
          type: 'confetti',
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
        });
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [active, type]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
    />
  );
};
