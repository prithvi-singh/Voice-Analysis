import { useEffect, useRef, useState } from "react";
import { useAudio } from "../context/AudioContext";

interface Props {
  barCount?: number;
  className?: string;
}

// Helper function to draw rounded rectangle (polyfill for older browsers)
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export function AudioVisualizer({ barCount = 64, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, metrics } = useAudio();
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(0));

  // Create simulated bars based on metrics when playing
  useEffect(() => {
    if (!isPlaying) {
      // Fade out bars when not playing
      setBars((prev) => prev.map((v) => Math.max(0, v * 0.95)));
      return;
    }

    const energy = metrics.energy ?? 0;
    const pitch = metrics.pitchHz ?? 200;

    // Generate smooth, visually appealing bars based on audio metrics
    const newBars: number[] = [];
    const centerIndex = barCount / 2;
    const normalizedPitch = Math.min(1, pitch / 1000);

    for (let i = 0; i < barCount; i++) {
      // Create a bell curve distribution centered around the pitch
      const distFromCenter = Math.abs(i - centerIndex) / centerIndex;
      const pitchInfluence = Math.exp(-distFromCenter * 3) * normalizedPitch;

      // Add some randomness based on energy
      const randomFactor = 0.3 + Math.random() * 0.7;
      const energyFactor = Math.min(1, energy * 10);

      // Combine factors
      const value = Math.min(1, (pitchInfluence + energyFactor * 0.5) * randomFactor);

      // Smooth transition
      const prevValue = bars[i] ?? 0;
      newBars.push(prevValue * 0.7 + value * 0.3);
    }

    setBars(newBars);
  }, [isPlaying, metrics.energy, metrics.pitchHz, barCount]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / barCount;
    const gap = 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, "#10b981"); // emerald-500
    gradient.addColorStop(0.5, "#38bdf8"); // sky-400
    gradient.addColorStop(1, "#e879f9"); // fuchsia-400

    // Draw bars
    bars.forEach((value, i) => {
      const barHeight = Math.max(2, value * height * 0.9);
      const x = i * barWidth + gap / 2;
      const y = (height - barHeight) / 2;
      const radius = Math.min(barWidth / 2 - gap, 4);

      // Draw bar with rounded corners
      ctx.fillStyle = gradient;
      drawRoundedRect(ctx, x, y, barWidth - gap, barHeight, radius);
      ctx.fill();

      // Add subtle glow for active bars
      if (value > 0.5) {
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(56, 189, 248, 0.3)";
        drawRoundedRect(ctx, x, y, barWidth - gap, barHeight, radius);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }, [bars, barCount]);

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-950/80" />

      {/* Center line */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="relative h-full w-full"
      />

      {/* Overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/20 pointer-events-none" />

      {/* Idle state indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600" />
            <span>Waiting for audio</span>
          </div>
        </div>
      )}
    </div>
  );
}
