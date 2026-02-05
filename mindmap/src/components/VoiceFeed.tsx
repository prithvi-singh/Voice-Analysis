import { useEffect, useRef, useMemo, useState } from "react";
import { useAudio } from "../context/AudioContext";
import { AudioLines, Waves, Mic } from "lucide-react";

export function VoiceFeed() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { currentTime, duration, metrics, isPlaying, currentFileName } = useAudio();
  const [waveSurferError, setWaveSurferError] = useState(false);

  // Calculate stability metrics
  const jitter = metrics.jitter ?? 0;
  const clampedJitter = Math.max(0, Math.min(1, jitter));
  const stability = 1 - clampedJitter;
  const stabilityPercent = Math.round(stability * 100);

  // Derive voice quality indicators
  const voiceQuality = useMemo(() => {
    const pitch = metrics.pitchHz ?? 0;
    const volume = metrics.volumeDb ?? -60;
    const energy = metrics.energy ?? 0;

    // Classify voice characteristics
    let pitchRange = "—";
    if (pitch > 0) {
      if (pitch < 120) pitchRange = "Low";
      else if (pitch < 200) pitchRange = "Medium";
      else if (pitch < 300) pitchRange = "High";
      else pitchRange = "Very High";
    }

    let volumeLevel = "—";
    if (volume > -60) {
      if (volume < -30) volumeLevel = "Quiet";
      else if (volume < -15) volumeLevel = "Normal";
      else volumeLevel = "Loud";
    }

    let energyLevel = "—";
    if (energy > 0) {
      if (energy < 0.1) energyLevel = "Low";
      else if (energy < 0.3) energyLevel = "Moderate";
      else energyLevel = "High";
    }

    return { pitchRange, volumeLevel, energyLevel };
  }, [metrics]);

  // Stability classification
  const stabilityClass = useMemo(() => {
    if (stability >= 0.8) return { label: "Stable", color: "text-emerald-400", bgColor: "bg-emerald-500" };
    if (stability >= 0.5) return { label: "Variable", color: "text-amber-400", bgColor: "bg-amber-500" };
    return { label: "Unstable", color: "text-rose-400", bgColor: "bg-rose-500" };
  }, [stability]);

  // Progress percentage for simple waveform display
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border border-sky-500/30">
            <AudioLines className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-50">Voice Analysis</h2>
            <p className="text-xs text-slate-400">Voice quality metrics</p>
          </div>
        </div>

        {/* Recording indicator */}
        {isPlaying && (
          <div className="flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-medium text-rose-400">Playing</span>
          </div>
        )}
      </div>

      {/* Simple waveform visualization */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/60 border border-slate-800 h-24">
        {/* Static waveform bars */}
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2">
          {Array.from({ length: 60 }).map((_, i) => {
            const height = 20 + Math.sin(i * 0.3) * 15 + Math.cos(i * 0.5) * 10;
            const isActive = (i / 60) * 100 < progress;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-t from-emerald-500 to-sky-400"
                    : "bg-slate-700/50"
                }`}
                style={{
                  height: `${height}%`,
                  opacity: isActive ? 1 : 0.5,
                }}
              />
            );
          })}
        </div>

        {/* Overlay when no file */}
        {!currentFileName && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
            <div className="text-center">
              <Waves className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Load a file to see waveform</p>
            </div>
          </div>
        )}
      </div>

      {/* Voice Quality Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {/* Pitch */}
        <div className="rounded-lg bg-slate-900/50 p-3 text-center">
          <div className="text-lg font-bold text-sky-400">
            {metrics.pitchHz ? `${Math.round(metrics.pitchHz)}` : "—"}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
            Pitch Hz
          </div>
          <div className="text-xs text-slate-400 mt-1">{voiceQuality.pitchRange}</div>
        </div>

        {/* Volume */}
        <div className="rounded-lg bg-slate-900/50 p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">
            {metrics.volumeDb != null && Number.isFinite(metrics.volumeDb)
              ? `${Math.round(metrics.volumeDb)}`
              : "—"}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
            Volume dB
          </div>
          <div className="text-xs text-slate-400 mt-1">{voiceQuality.volumeLevel}</div>
        </div>

        {/* Energy */}
        <div className="rounded-lg bg-slate-900/50 p-3 text-center">
          <div className="text-lg font-bold text-amber-400">
            {metrics.energy != null ? (metrics.energy * 100).toFixed(0) : "—"}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
            Energy %
          </div>
          <div className="text-xs text-slate-400 mt-1">{voiceQuality.energyLevel}</div>
        </div>

        {/* Stability */}
        <div className="rounded-lg bg-slate-900/50 p-3 text-center">
          <div className={`text-lg font-bold ${stabilityClass.color}`}>
            {stabilityPercent}%
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
            Stability
          </div>
          <div className={`text-xs ${stabilityClass.color} mt-1`}>
            {stabilityClass.label}
          </div>
        </div>
      </div>

      {/* Stability bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Mic className="h-3 w-3" />
            Voice Stability (Jitter)
          </span>
          <span className={`font-medium ${stabilityClass.color}`}>
            {stabilityClass.label}
          </span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${stabilityClass.bgColor} transition-all duration-300`}
            style={{ width: `${stabilityPercent}%` }}
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-300"
            style={{ width: `${stabilityPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500">
          Lower jitter indicates more consistent pitch, suggesting calmer or more controlled speech.
        </p>
      </div>
    </div>
  );
}
