import { useMemo } from "react";
import { useMetrics } from "../context/MetricsContext";
import { useHume } from "../context/HumeContext";
import { useAudio } from "../context/AudioContext";
import {
  Sparkles,
  Radio,
  Heart,
  AlertTriangle,
  Zap,
  Lightbulb,
  TrendingUp,
  Smile,
  Frown,
  Meh,
} from "lucide-react";

// Emotion categories
const POSITIVE_EMOTIONS = [
  "Joy", "Amusement", "Excitement", "Interest", "Satisfaction",
  "Love", "Admiration", "Calmness", "Relief", "Pride", "Triumph",
  "Adoration", "Ecstasy", "Contentment", "Surprise (positive)"
];
const NEGATIVE_EMOTIONS = [
  "Sadness", "Anxiety", "Fear", "Anger", "Disgust", "Distress",
  "Disappointment", "Shame", "Guilt", "Horror", "Pain", "Contempt",
  "Embarrassment", "Envy", "Surprise (negative)"
];
const HIGH_ENERGY_EMOTIONS = [
  "Excitement", "Anger", "Fear", "Amusement", "Surprise", "Triumph", "Ecstasy"
];

// Color mapping
const emotionColors: Record<string, string> = {
  Joy: "#fbbf24", Amusement: "#fb923c", Excitement: "#f97316", Interest: "#38bdf8",
  Satisfaction: "#34d399", Love: "#f472b6", Admiration: "#a78bfa", Calmness: "#2dd4bf",
  Determination: "#10b981", Adoration: "#ec4899", Awe: "#8b5cf6", Ecstasy: "#e879f9",
  Sadness: "#60a5fa", Anxiety: "#fcd34d", Fear: "#c084fc", Anger: "#f87171",
  Disgust: "#a3e635", Distress: "#fb7185", Disappointment: "#6366f1", Shame: "#d946ef",
  Guilt: "#7c3aed", Embarrassment: "#f472b6", Envy: "#4ade80", Surprise: "#22d3ee",
  "Surprise (positive)": "#34d399", "Surprise (negative)": "#a78bfa",
  Realization: "#34d399", Pride: "#f59e0b", Triumph: "#f59e0b", Contemplation: "#94a3b8",
  Concentration: "#818cf8", Nostalgia: "#fbbf24", Relief: "#2dd4bf", Boredom: "#9ca3af",
  Tiredness: "#cbd5e1", Confusion: "#fbbf24", Horror: "#7c3aed", Pain: "#ef4444",
};

const getEmotionColor = (name: string) => emotionColors[name] || "#94a3b8";

// Mood meter component
function MoodMeter({ sentiment }: { sentiment: number }) {
  const percentage = ((sentiment + 1) / 2) * 100;
  
  const getMoodIcon = () => {
    if (sentiment > 0.15) return <Smile className="h-5 w-5 text-emerald-400" />;
    if (sentiment < -0.15) return <Frown className="h-5 w-5 text-rose-400" />;
    return <Meh className="h-5 w-5 text-amber-400" />;
  };

  const getMoodLabel = () => {
    if (sentiment > 0.4) return "Very Positive";
    if (sentiment > 0.15) return "Positive";
    if (sentiment > -0.15) return "Neutral";
    if (sentiment > -0.4) return "Negative";
    return "Very Negative";
  };

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">Overall Mood</span>
        <div className="flex items-center gap-2">
          {getMoodIcon()}
          <span className="text-sm font-semibold text-slate-200">{getMoodLabel()}</span>
        </div>
      </div>
      
      <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-rose-500/40 via-amber-500/40 to-emerald-500/40 overflow-hidden">
        <div 
          className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-500"
          style={{ left: `calc(${Math.max(2, Math.min(98, percentage))}% - 3px)` }}
        />
      </div>
      
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-600">Negative</span>
        <span className="text-[10px] text-slate-600">Positive</span>
      </div>
    </div>
  );
}

// Horizontal bar for emotion
function EmotionBar({ name, percent, rank }: { name: string; percent: number; rank: number }) {
  const color = getEmotionColor(name);
  const isTop3 = rank <= 3;
  
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex items-center gap-2">
        {isTop3 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-amber-400">
            {rank}
          </span>
        )}
        <span className={`text-xs truncate ${isTop3 ? "text-slate-200 font-medium" : "text-slate-400"}`}>
          {name}
        </span>
      </div>
      <div className="flex-1 h-2 bg-slate-800/60 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-10 text-right text-xs font-mono text-slate-400">
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}

// Simple pie chart
function EmotionPie({ emotions }: { emotions: Array<{ name: string; percent: number }> }) {
  // Build conic gradient
  let gradientStops: string[] = [];
  let cumulative = 0;
  
  for (const e of emotions) {
    const color = getEmotionColor(e.name);
    const start = cumulative;
    cumulative += e.percent;
    gradientStops.push(`${color} ${start}% ${cumulative}%`);
  }
  
  const gradient = `conic-gradient(from 0deg, ${gradientStops.join(", ")})`;

  return (
    <div className="relative">
      <div 
        className="h-32 w-32 rounded-full"
        style={{ background: gradient }}
      />
      {/* Inner circle for donut effect */}
      <div className="absolute inset-4 rounded-full bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-slate-200">{emotions.length}</div>
          <div className="text-[10px] text-slate-500">emotions</div>
        </div>
      </div>
    </div>
  );
}

export function EmotionalAnalysis() {
  const { currentPoint, sessionData } = useMetrics();
  const { isExternalLoading, lastScores } = useHume();
  const { metrics: audioMetrics } = useAudio();
  
  const scores = useMemo(() => {
    if (currentPoint?.hume && Object.keys(currentPoint.hume).length > 0) {
      return currentPoint.hume;
    }
    return lastScores;
  }, [currentPoint, lastScores]);

  // Process and normalize emotions
  const analysis = useMemo(() => {
    if (!scores || Object.keys(scores).length === 0) return null;

    // Filter and collect emotions
    const raw: Array<{ name: string; score: number }> = [];
    let total = 0;
    
    for (const [key, value] of Object.entries(scores)) {
      if (key === "arousal" || key === "valence") continue;
      if (typeof value !== "number" || value <= 0) continue;
      raw.push({ name: key, score: value });
      total += value;
    }
    
    if (total === 0) return null;
    
    // Sort and normalize
    raw.sort((a, b) => b.score - a.score);
    const normalized = raw.map(e => ({
      name: e.name,
      percent: (e.score / total) * 100,
    }));

    // Calculate sentiment
    let positiveSum = 0;
    let negativeSum = 0;
    for (const e of normalized) {
      if (POSITIVE_EMOTIONS.includes(e.name)) positiveSum += e.percent;
      if (NEGATIVE_EMOTIONS.includes(e.name)) negativeSum += e.percent;
    }
    const totalPosNeg = positiveSum + negativeSum;
    const sentiment = totalPosNeg > 0 ? (positiveSum - negativeSum) / totalPosNeg : 0;

    // Energy from high-energy emotions
    let energySum = 0;
    for (const e of normalized) {
      if (HIGH_ENERGY_EMOTIONS.includes(e.name)) energySum += e.percent;
    }

    // Significant emotions (>3%)
    const significant = normalized.filter(e => e.percent >= 3);

    return {
      all: normalized,
      top8: normalized.slice(0, 8),
      sentiment,
      positivePercent: positiveSum,
      negativePercent: negativeSum,
      energyPercent: energySum,
      significantCount: significant.length,
      dominant: normalized[0],
    };
  }, [scores]);

  // Key insight
  const insight = useMemo(() => {
    if (!analysis) return null;
    
    const { sentiment, dominant, energyPercent } = analysis;
    
    if (sentiment > 0.3 && energyPercent > 20) {
      return {
        icon: Sparkles,
        text: `High positive energy! ${dominant.name} dominates at ${dominant.percent.toFixed(0)}%.`,
        color: "emerald",
      };
    }
    if (sentiment > 0.15) {
      return {
        icon: Heart,
        text: `Positive tone detected. ${dominant.name} leads at ${dominant.percent.toFixed(0)}%.`,
        color: "emerald",
      };
    }
    if (sentiment < -0.3) {
      return {
        icon: AlertTriangle,
        text: `Stress indicators present. Primary: ${dominant.name} (${dominant.percent.toFixed(0)}%).`,
        color: "amber",
      };
    }
    if (energyPercent > 25) {
      return {
        icon: Zap,
        text: `High intensity expression. ${dominant.name} at ${dominant.percent.toFixed(0)}%.`,
        color: "fuchsia",
      };
    }
    return {
      icon: Lightbulb,
      text: `Balanced state. ${dominant.name} is most prominent (${dominant.percent.toFixed(0)}%).`,
      color: "sky",
    };
  }, [analysis]);

  const hasData = analysis !== null;
  const voiceStability = audioMetrics?.stability ?? 0;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-emerald-500/20 border border-fuchsia-500/30">
            <Sparkles className="h-5 w-5 text-fuchsia-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-50">Emotional Analysis</h2>
            <p className="text-xs text-slate-400">AI-powered voice insights</p>
          </div>
        </div>
        
        {hasData ? (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
            <Radio className="h-3 w-3 animate-pulse" />
            Live
          </div>
        ) : isExternalLoading ? (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs text-amber-400">
            Analyzing...
          </div>
        ) : (
          <div className="text-xs text-slate-500">Waiting</div>
        )}
      </div>

      {!hasData ? (
        <div className="py-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/50 mb-4">
            <Sparkles className="h-7 w-7 text-slate-600" />
          </div>
          <p className="text-sm text-slate-400 max-w-[220px] mx-auto">
            {isExternalLoading 
              ? "Analyzing voice patterns..." 
              : "Upload audio to see emotional analysis"}
          </p>
        </div>
      ) : (
        <>
          {/* Mood Meter */}
          <MoodMeter sentiment={analysis.sentiment} />

          {/* Key Insight */}
          {insight && (
            <div className={`flex items-start gap-3 rounded-xl p-3 ${
              insight.color === "emerald" ? "bg-emerald-500/10 border border-emerald-500/20" :
              insight.color === "amber" ? "bg-amber-500/10 border border-amber-500/20" :
              insight.color === "fuchsia" ? "bg-fuchsia-500/10 border border-fuchsia-500/20" :
              "bg-sky-500/10 border border-sky-500/20"
            }`}>
              <insight.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                insight.color === "emerald" ? "text-emerald-400" :
                insight.color === "amber" ? "text-amber-400" :
                insight.color === "fuchsia" ? "text-fuchsia-400" :
                "text-sky-400"
              }`} />
              <p className="text-sm text-slate-300">{insight.text}</p>
            </div>
          )}

          {/* Composition: Pie + Legend */}
          <div className="flex items-center gap-6">
            <EmotionPie emotions={analysis.all} />
            
            <div className="flex-1 space-y-1.5">
              {analysis.top8.slice(0, 5).map((e, i) => (
                <div key={e.name} className="flex items-center gap-2 text-xs">
                  <span 
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: getEmotionColor(e.name) }} 
                  />
                  <span className="text-slate-300 truncate flex-1">{e.name}</span>
                  <span className="font-mono text-slate-400">{e.percent.toFixed(0)}%</span>
                </div>
              ))}
              {analysis.all.length > 5 && (
                <div className="text-[10px] text-slate-500 pt-1">
                  +{analysis.all.length - 5} more emotions
                </div>
              )}
            </div>
          </div>

          {/* All Emotions Bars */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Emotional Breakdown (totals 100%)
            </div>
            <div className="space-y-1.5">
              {analysis.top8.map((e, i) => (
                <EmotionBar key={e.name} name={e.name} percent={e.percent} rank={i + 1} />
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/50">
            <div className="text-center">
              <div className="text-sm font-bold text-emerald-400">{analysis.positivePercent.toFixed(0)}%</div>
              <div className="text-[10px] text-slate-500">Positive</div>
            </div>
            <div className="text-center border-x border-slate-800">
              <div className="text-sm font-bold text-rose-400">{analysis.negativePercent.toFixed(0)}%</div>
              <div className="text-[10px] text-slate-500">Negative</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-sky-400">{voiceStability > 0 ? `${voiceStability.toFixed(0)}%` : "—"}</div>
              <div className="text-[10px] text-slate-500">Voice Stability</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
