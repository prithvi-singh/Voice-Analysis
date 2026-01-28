import { useMemo } from "react";
import { useMetrics } from "../context/MetricsContext";
import { useHume } from "../context/HumeContext";

export function EmotionCloud() {
  const { currentPoint } = useMetrics();
  const { isExternalLoading } = useHume();
  const scores = currentPoint?.hume ?? null;

  const entries = useMemo(() => {
    if (!scores) return [];
    const out: Array<{ name: string; score: number }> = [];
    for (const [key, value] of Object.entries(scores)) {
      if (key === "arousal" || key === "valence") continue;
      if (typeof value !== "number") continue;
      out.push({ name: key, score: value });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 16); // top 16 emotions
  }, [scores]);

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-50">Emotion spectrum</h2>
          <p className="text-xs text-slate-400">Top Hume emotions with raw scores.</p>
        </div>
        <div className="text-[10px] uppercase tracking-wide text-slate-500">
          {entries.length
            ? "Live from Hume"
            : isExternalLoading
              ? "Analyzing…"
              : "Waiting for data"}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            {isExternalLoading
              ? "Sending audio to Hume and waiting for expression scores…"
              : "Start an analysis and wait a moment for Hume to return expression scores."}
          </p>
          {isExternalLoading && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-1.5 w-1/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-400" />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {entries.map((e) => (
            <div
              key={e.name}
              className="space-y-1 rounded-lg bg-slate-950/60 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[11px] font-medium text-slate-100">{e.name}</span>
                <span className="font-mono text-[10px] text-slate-400">{e.score.toFixed(2)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-400"
                  style={{ width: `${Math.min(1, e.score) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

