import React, { useEffect, useRef } from 'react';
import { soundFX } from './AudioFeedback';

interface WarpDriveTransitionProps {
  isActive: boolean;
  destinationName?: string;
  onComplete?: () => void;
}

export default function WarpDriveTransition({
  isActive,
  destinationName = 'Target System',
  onComplete,
}: WarpDriveTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive) return;

    soundFX.triggerWarpDrive();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Generate 350 radial star particles
    const starCount = 350;
    const stars: { x: number; y: number; z: number; oZ: number }[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        oZ: Math.random() * width,
      });
    }

    let animId: number;
    let startTime = performance.now();
    const duration = 850; // ms

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);

      // Dark translucent trail
      ctx.fillStyle = 'rgba(2, 1, 8, 0.28)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Warp speed acceleration curve
      const speed = 25.0 + Math.sin(progress * Math.PI) * 110.0;

      stars.forEach((star) => {
        star.z -= speed;
        if (star.z <= 0) {
          star.z = width;
          star.oZ = width;
        }

        const k = 280 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        const ok = 280 / (star.z + speed * 2.5);
        const opx = star.x * ok + cx;
        const opy = star.y * ok + cy;

        // Draw stretched warp line
        ctx.beginPath();
        ctx.moveTo(opx, opy);
        ctx.lineTo(px, py);

        // Color shifts from cyan to indigo to white-hot
        const alpha = Math.min(1.0, (1 - star.z / width) * 1.5);
        ctx.strokeStyle = `rgba(168, 85, 247, ${alpha * 0.75})`;
        ctx.lineWidth = Math.max(1.2, (1 - star.z / width) * 4);
        ctx.stroke();

        // White core streak
        ctx.beginPath();
        ctx.moveTo(opx, opy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = `rgba(224, 242, 254, ${alpha})`;
        ctx.lineWidth = Math.max(0.6, (1 - star.z / width) * 2);
        ctx.stroke();
      });

      if (progress < 1.0) {
        animId = requestAnimationFrame(render);
      } else {
        if (onComplete) onComplete();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center font-mono">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Cinematic Warp HUD Overlay */}
      <div className="relative z-10 flex flex-col items-center gap-2 animate-pulse text-center">
        <div className="flex items-center gap-2 rounded-full border border-cyan-400/80 bg-black/80 px-5 py-1.5 shadow-[0_0_30px_rgba(34,211,238,0.6)]">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-extrabold tracking-widest text-cyan-300 uppercase">
            WARP CONDUIT ENGAGED // RELATIVISTIC JUMP
          </span>
        </div>
        <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-cyan-200 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
          DESTINATION: {destinationName}
        </div>
      </div>
    </div>
  );
}
