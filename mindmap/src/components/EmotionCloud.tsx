import { useMemo } from "react";
import { useMetrics } from "../context/MetricsContext";
import { useHume } from "../context/HumeContext";
import { Sparkles, Radio } from "lucide-react";

// Color mapping for emotion categories
const emotionColors: Record<string, { bg: string; bar: string; text: string; solid: string }> = {
  // Positive emotions
  Joy: { bg: "bg-amber-500/10", bar: "from-amber-400 to-yellow-400", text: "text-amber-300", solid: "#fbbf24" },
  Amusement: { bg: "bg-amber-500/10", bar: "from-amber-400 to-orange-400", text: "text-amber-300", solid: "#fb923c" },
  Excitement: { bg: "bg-orange-500/10", bar: "from-orange-400 to-red-400", text: "text-orange-300", solid: "#f97316" },
  Interest: { bg: "bg-sky-500/10", bar: "from-sky-400 to-blue-400", text: "text-sky-300", solid: "#38bdf8" },
  Satisfaction: { bg: "bg-emerald-500/10", bar: "from-emerald-400 to-green-400", text: "text-emerald-300", solid: "#34d399" },
  Love: { bg: "bg-pink-500/10", bar: "from-pink-400 to-rose-400", text: "text-pink-300", solid: "#f472b6" },
  Admiration: { bg: "bg-violet-500/10", bar: "from-violet-400 to-purple-400", text: "text-violet-300", solid: "#a78bfa" },
  Calmness: { bg: "bg-teal-500/10", bar: "from-teal-400 to-cyan-400", text: "text-teal-300", solid: "#2dd4bf" },
  Concentration: { bg: "bg-indigo-500/10", bar: "from-indigo-400 to-blue-400", text: "text-indigo-300", solid: "#818cf8" },
  Contemplation: { bg: "bg-slate-500/10", bar: "from-slate-400 to-gray-400", text: "text-slate-300", solid: "#94a3b8" },
  Determination: { bg: "bg-emerald-500/10", bar: "from-emerald-400 to-teal-400", text: "text-emerald-300", solid: "#10b981" },
  Adoration: { bg: "bg-pink-500/10", bar: "from-pink-400 to-rose-400", text: "text-pink-300", solid: "#ec4899" },
  Awe: { bg: "bg-violet-500/10", bar: "from-violet-400 to-purple-400", text: "text-violet-300", solid: "#8b5cf6" },
  Ecstasy: { bg: "bg-fuchsia-500/10", bar: "from-fuchsia-400 to-pink-400", text: "text-fuchsia-300", solid: "#e879f9" },

  // Negative emotions
  Sadness: { bg: "bg-blue-500/10", bar: "from-blue-400 to-indigo-400", text: "text-blue-300", solid: "#60a5fa" },
  Anxiety: { bg: "bg-amber-500/10", bar: "from-amber-400 to-yellow-500", text: "text-amber-300", solid: "#fcd34d" },
  Fear: { bg: "bg-purple-500/10", bar: "from-purple-400 to-violet-400", text: "text-purple-300", solid: "#c084fc" },
  Anger: { bg: "bg-red-500/10", bar: "from-red-400 to-rose-500", text: "text-red-300", solid: "#f87171" },
  Disgust: { bg: "bg-lime-500/10", bar: "from-lime-400 to-green-500", text: "text-lime-300", solid: "#a3e635" },
  Distress: { bg: "bg-rose-500/10", bar: "from-rose-400 to-red-400", text: "text-rose-300", solid: "#fb7185" },
  Boredom: { bg: "bg-gray-500/10", bar: "from-gray-400 to-slate-400", text: "text-gray-300", solid: "#9ca3af" },
  Tiredness: { bg: "bg-slate-500/10", bar: "from-slate-400 to-zinc-400", text: "text-slate-300", solid: "#cbd5e1" },
  Confusion: { bg: "bg-amber-500/10", bar: "from-amber-400 to-orange-400", text: "text-amber-300", solid: "#fbbf24" },
  Disappointment: { bg: "bg-indigo-500/10", bar: "from-indigo-400 to-blue-500", text: "text-indigo-300", solid: "#6366f1" },
  Shame: { bg: "bg-fuchsia-500/10", bar: "from-fuchsia-400 to-pink-400", text: "text-fuchsia-300", solid: "#d946ef" },
  Guilt: { bg: "bg-violet-500/10", bar: "from-violet-400 to-purple-500", text: "text-violet-300", solid: "#7c3aed" },
  Embarrassment: { bg: "bg-pink-500/10", bar: "from-pink-400 to-rose-400", text: "text-pink-300", solid: "#f472b6" },
  Envy: { bg: "bg-green-500/10", bar: "from-green-400 to-emerald-400", text: "text-green-300", solid: "#4ade80" },

  // Neutral/other
  Surprise: { bg: "bg-cyan-500/10", bar: "from-cyan-400 to-teal-400", text: "text-cyan-300", solid: "#22d3ee" },
  "Surprise (positive)": { bg: "bg-emerald-500/10", bar: "from-emerald-400 to-cyan-400", text: "text-emerald-300", solid: "#34d399" },
  "Surprise (negative)": { bg: "bg-violet-500/10", bar: "from-violet-400 to-purple-400", text: "text-violet-300", solid: "#a78bfa" },
  Realization: { bg: "bg-emerald-500/10", bar: "from-emerald-400 to-green-400", text: "text-emerald-300", solid: "#34d399" },
  Nostalgia: { bg: "bg-amber-500/10", bar: "from-amber-400 to-yellow-400", text: "text-amber-300", solid: "#fbbf24" },
  Relief: { bg: "bg-teal-500/10", bar: "from-teal-400 to-emerald-400", text: "text-teal-300", solid: "#2dd4bf" },
  Sympathy: { bg: "bg-pink-500/10", bar: "from-pink-400 to-rose-400", text: "text-pink-300", solid: "#f472b6" },
  Pride: { bg: "bg-amber-500/10", bar: "from-amber-400 to-yellow-400", text: "text-amber-300", solid: "#f59e0b" },
  Desire: { bg: "bg-rose-500/10", bar: "from-rose-400 to-pink-400", text: "text-rose-300", solid: "#fb7185" },
  Romance: { bg: "bg-pink-500/10", bar: "from-pink-400 to-rose-400", text: "text-pink-300", solid: "#ec4899" },
  Triumph: { bg: "bg-amber-500/10", bar: "from-amber-400 to-orange-400", text: "text-amber-300", solid: "#f59e0b" },
  Awkwardness: { bg: "bg-slate-500/10", bar: "from-slate-400 to-gray-400", text: "text-slate-300", solid: "#94a3b8" },
  Horror: { bg: "bg-violet-500/10", bar: "from-violet-500 to-purple-600", text: "text-violet-300", solid: "#7c3aed" },
  Pain: { bg: "bg-red-500/10", bar: "from-red-500 to-rose-600", text: "text-red-300", solid: "#ef4444" },
  Craving: { bg: "bg-orange-500/10", bar: "from-orange-400 to-amber-400", text: "text-orange-300", solid: "#fb923c" },
};

const defaultColor = { bg: "bg-slate-500/10", bar: "from-slate-400 to-gray-400", text: "text-slate-300", solid: "#94a3b8" };

// Get intensity label from normalized score
function getIntensityLabel(normalizedScore: number): { label: string; color: string } {
  if (normalizedScore >= 25) return { label: "Strong", color: "text-emerald-400" };
  if (normalizedScore >= 15) return { label: "Moderate", color: "text-sky-400" };
  if (normalizedScore >= 8) return { label: "Mild", color: "text-amber-400" };
  return { label: "Faint", color: "text-slate-500" };
}

interface EmotionBarProps {
  name: string;
  normalizedPercent: number; // 0-100, sums to 100 across all emotions
  rank: number;
}

function EmotionBar({ name, normalizedPercent, rank }: EmotionBarProps) {
  const colors = emotionColors[name] || defaultColor;
  const intensity = getIntensityLabel(normalizedPercent);
  
  return (
    <div className={`group rounded-xl ${colors.bg} border border-white/5 p-3 transition-all hover:border-white/10`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {rank <= 3 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-amber-400">
              {rank}
            </span>
          )}
          <span className={`text-sm font-medium ${colors.text} truncate`}>
            {name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium ${intensity.color}`}>
            {intensity.label}
          </span>
          <span className="font-mono text-xs text-slate-400 tabular-nums w-10 text-right">
            {normalizedPercent.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Progress bar - now represents share of total */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700 ease-out`}
          style={{ width: `${normalizedPercent}%` }}
        />
      </div>
    </div>
  );
}

// Simple donut chart for emotion distribution
function EmotionDonut({ emotions }: { emotions: Array<{ name: string; percent: number }> }) {
  const topEmotions = emotions.slice(0, 5);
  const otherPercent = emotions.slice(5).reduce((sum, e) => sum + e.percent, 0);
  
  // Calculate SVG arc paths
  let cumulativePercent = 0;
  const segments: Array<{ path: string; color: string; name: string; percent: number }> = [];
  
  const createArcPath = (startPercent: number, endPercent: number) => {
    const startAngle = (startPercent / 100) * 360 - 90;
    const endAngle = (endPercent / 100) * 360 - 90;
    const largeArc = endPercent - startPercent > 50 ? 1 : 0;
    
    const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
    const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
    const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
    const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
    
    return `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`;
  };
  
  for (const emotion of topEmotions) {
    const startPercent = cumulativePercent;
    cumulativePercent += emotion.percent;
    const colors = emotionColors[emotion.name] || defaultColor;
    segments.push({
      path: createArcPath(startPercent, cumulativePercent),
      color: colors.solid,
      name: emotion.name,
      percent: emotion.percent,
    });
  }
  
  if (otherPercent > 0) {
    segments.push({
      path: createArcPath(cumulativePercent, 100),
      color: "#475569",
      name: "Other",
      percent: otherPercent,
    });
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill={seg.color}
            className="transition-all duration-500 hover:opacity-80"
          />
        ))}
        {/* Inner circle for donut effect */}
        <circle cx="50" cy="50" r="25" fill="#0f172a" />
      </svg>
      
      {/* Legend */}
      <div className="flex-1 space-y-1">
        {topEmotions.slice(0, 4).map((e) => {
          const colors = emotionColors[e.name] || defaultColor;
          return (
            <div key={e.name} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.solid }} />
              <span className="text-slate-400 truncate flex-1">{e.name}</span>
              <span className="font-mono text-slate-300">{e.percent.toFixed(0)}%</span>
            </div>
          );
        })}
        {otherPercent > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-slate-600" />
            <span className="text-slate-500 flex-1">Other</span>
            <span className="font-mono text-slate-500">{otherPercent.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmotionCloud() {
  const { currentPoint } = useMetrics();
  const { isExternalLoading, lastScores } = useHume();
  
  // Use lastScores directly as fallback if currentPoint.hume is empty
  const scores = (currentPoint?.hume && Object.keys(currentPoint.hume).length > 0) 
    ? currentPoint.hume 
    : lastScores;

  // Process and normalize entries so they sum to 100%
  const { normalizedEntries } = useMemo(() => {
    if (!scores) return { normalizedEntries: [], totalRawScore: 0 };
    
    const raw: Array<{ name: string; score: number }> = [];
    let total = 0;
    
    for (const [key, value] of Object.entries(scores)) {
      if (key === "arousal" || key === "valence") continue;
      if (typeof value !== "number" || value <= 0) continue;
      raw.push({ name: key, score: value });
      total += value;
    }
    
    // Sort by score descending
    raw.sort((a, b) => b.score - a.score);
    
    // Normalize to 100%
    const normalized = raw.map(e => ({
      name: e.name,
      rawScore: e.score,
      percent: total > 0 ? (e.score / total) * 100 : 0,
    }));
    
    return { normalizedEntries: normalized, totalRawScore: total };
  }, [scores]);

  // Get top entries for display
  const topEntries = normalizedEntries.slice(0, 12);
  const activeCount = normalizedEntries.filter(e => e.percent >= 3).length;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-sky-500/20 border border-fuchsia-500/30">
            <Sparkles className="h-5 w-5 text-fuchsia-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-50">Emotion Spectrum</h2>
            <p className="text-xs text-slate-400">Hume AI expression analysis</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {topEntries.length > 0 ? (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
              <Radio className="h-3 w-3 animate-pulse" />
              Live
            </div>
          ) : isExternalLoading ? (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs text-amber-400">
              <span className="loading-dot h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="loading-dot h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="loading-dot h-1.5 w-1.5 rounded-full bg-amber-400" />
            </div>
          ) : (
            <div className="text-xs text-slate-500">Waiting</div>
          )}
        </div>
      </div>

      {/* Content */}
      {topEntries.length === 0 ? (
        <div className="py-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/50 mb-4">
            <Sparkles className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-sm text-slate-400 max-w-[240px] mx-auto">
            {isExternalLoading
              ? "Analyzing voice patterns and extracting emotional expressions..."
              : "Upload an audio file and start analysis to see emotion data"}
          </p>
          {isExternalLoading && (
            <div className="mt-4 mx-auto max-w-[200px]">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-400 animate-[pulse_1.2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Donut chart showing distribution */}
          <div className="rounded-xl bg-slate-900/50 p-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">
              Emotional Composition (adds up to 100%)
            </div>
            <EmotionDonut emotions={topEntries.map(e => ({ name: e.name, percent: e.percent }))} />
          </div>

          {/* Detailed breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                All Detected Emotions
              </span>
              <span className="text-xs text-slate-500">
                {activeCount} significant
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {topEntries.map((e, i) => (
                <EmotionBar
                  key={e.name}
                  name={e.name}
                  normalizedPercent={e.percent}
                  rank={i + 1}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
