import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { useAudio } from "../context/AudioContext";

export function VoiceFeed() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const { currentTime, duration, metrics } = useAudio();

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#22c55e",
      progressColor: "#4ade80",
      cursorColor: "#e5e7eb",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      normalize: true,
      dragToSeek: false,
      interact: false,
    });

    waveSurferRef.current = ws;

    return () => {
      ws.destroy();
      waveSurferRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!waveSurferRef.current || !duration) return;
    const progress = duration ? currentTime / duration : 0;
    waveSurferRef.current.setTime(progress * duration);
  }, [currentTime, duration]);

  const jitter = metrics.jitter ?? 0;
  const clampedJitter = Math.max(0, Math.min(1, jitter));
  const stability = 1 - clampedJitter;

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-50">Voice Feed</h2>
        <p className="text-xs text-slate-400">Waveform preview and jitter-based stability.</p>
      </div>

      <div
        ref={containerRef}
        className="h-20 w-full overflow-hidden rounded-lg bg-slate-950/60"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Jitter stability</span>
          <span className="font-mono text-slate-100">{Math.round(stability * 100)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-[width] duration-150"
            style={{ width: `${stability * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

