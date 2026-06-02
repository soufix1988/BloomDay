import { useEffect, useRef } from "react";

/** Floating 3D cute particles canvas — hearts, stars, flowers */
export default function FloatingBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const SHAPES = ["❤️", "✨", "🌸", "⭐", "💕", "🌷", "💫", "🦋"];
    type Particle = {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; shape: string;
      rotZ: number; rotSpeed: number;
      scalePhase: number; scaleSpeed: number;
    };

    const particles: Particle[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * (document.documentElement.scrollHeight || 2000),
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.6 - 0.2,
      size: Math.random() * 18 + 10,
      opacity: Math.random() * 0.5 + 0.15,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      rotZ: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      scalePhase: Math.random() * Math.PI * 2,
      scaleSpeed: Math.random() * 0.02 + 0.005,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotZ += p.rotSpeed;
        p.scalePhase += p.scaleSpeed;

        if (p.y < -60) {
          p.y = canvas.height + 60;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -60) p.x = canvas.width + 60;
        if (p.x > canvas.width + 60) p.x = -60;

        const pulse = 1 + Math.sin(p.scalePhase) * 0.12;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotZ);
        ctx.scale(pulse, pulse);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.shape, 0, 0);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
}
