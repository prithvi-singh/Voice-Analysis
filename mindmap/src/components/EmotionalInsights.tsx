import { useMemo } from "react";
import { useMetrics } from "../context/MetricsContext";
import { useHume } from "../context/HumeContext";
import { useAudio } from "../context/AudioContext";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Heart,
  AlertTriangle,
  Zap,
} from "lucide-react";

// Emotion categories for analysis
const POSITIVE_EMOTIONS = [
  "Joy", "Amusement", "Excitement", "Interest", "Satisfaction",
  "Love", "Admiration", "Calmness", "Relief", "Pride", "Triumph"
];
const NEGATIVE_EMOTIONS = [
  "Sadness", "Anxiety", "Fear", "Anger", "Disgust", "Distress",
  "Disappointment", "Shame", "Guilt", "Horror", "Pain"
];
const HIGH_ENERGY_EMOTIONS = [
  "Excitement", "Anger", "Fear", "Amusement", "Surprise", "Triumph"
];

interface InsightBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: "emerald" | "sky" | "amber" | "fuchsia" | "rose";
}

function InsightBadge({ icon: Icon, label, value, color }: InsightBadgeProps) {
  const colorClasses = {
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
    sky: "from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
    fuchsia: "from-fuchsia-500/20 to-fuchsia-600/10 border-fuchsia-500/30 text-fuchsia-400",
    rose: "from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400",
  };

  return (
    <div className={`rounded-xl bg-gradient-to-br ${colorClasses[color]} border p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}

// Mood meter component
function MoodMeter({ sentiment }: { sentiment: number }) {
  // sentiment: -1 (negative) to +1 (positive)
  const percentage = ((sentiment + 1) / 2) * 100;
  
  const getMoodIcon = () => {
    if (sentiment > 0.2) return <Smile className="h-6 w-6 text-emerald-400" />;
    if (sentiment < -0.2) return <Frown className="h-6 w-6 text-rose-400" />;
    return <Meh className="h-6 w-6 text-amber-400" />;
  };

  const getMoodLabel = () => {
    if (sentiment > 0.5) return "Very Positive";
    if (sentiment > 0.2) return "Positive";
    if (sentiment > -0.2) return "Neutral";
    if (sentiment > -0.5) return "Negative";
    return "Very Negative";
  };

  const getMoodColor = () => {
    if (sentiment > 0.2) return "from-emerald-500 to-emerald-400";
    if (sentiment < -0.2) return "from-rose-500 to-rose-400";
    return "from-amber-500 to-amber-400";
  };

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">Overall Sentiment</span>
        {getMoodIcon()}
      </div>
      
      {/* Mood bar */}
      <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-rose-500/30 via-amber-500/30 to-emerald-500/30 overflow-hidden mb-2">
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50 transition-all duration-500"
          style={{ left: `calc(${percentage}% - 2px)` }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Negative</span>
        <span className={`text-sm font-semibold bg-gradient-to-r ${getMoodColor()} bg-clip-text text-transparent`}>
          {getMoodLabel()}
        </span>
        <span className="text-xs text-slate-500">Positive</span>
      </div>
    </div>
  );
}

// Top emotion pill - now shows normalized percentage (share of total)
function EmotionPill({ name, normalizedPercent, rank }: { name: string; normalizedPercent: number; rank: number }) {
  const isPositive = POSITIVE_EMOTIONS.includes(name);
  
  return (
    <div className="flex items-center gap-2 rounded-full bg-slate-800/60 border border-slate-700/50 px-3 py-1.5">
      <span className={`text-xs font-medium ${
        rank === 1 ? "text-amber-300" : 
        isPositive ? "text-emerald-300" : "text-rose-300"
      }`}>
        #{rank}
      </span>
      <span className="text-sm text-slate-200">{name}</span>
      <span className="text-xs text-slate-500">{Math.round(normalizedPercent)}%</span>
    </div>
  );
}

export function EmotionalInsights() {
  const { currentPoint, sessionData } = useMetrics();
  const { lastScores, isExternalLoading } = useHume();
  const { metrics: audioMetrics } = useAudio();

  // Use lastScores directly if currentPoint doesn't have Hume data
  const scores = useMemo(() => {
    if (currentPoint?.hume && Object.keys(currentPoint.hume).length > 0) {
      return currentPoint.hume;
    }
    return lastScores;
  }, [currentPoint, lastScores]);

  // Calculate insights with normalized percentages
  const insights = useMemo(() => {
    if (!scores || Object.keys(scores).length === 0) {
      return null;
    }

    const entries = Object.entries(scores)
      .filter(([key]) => key !== "arousal" && key !== "valence")
      .filter(([, value]) => typeof value === "number" && value > 0)
      .map(([name, score]) => ({ name, rawScore: score as number }))
      .sort((a, b) => b.rawScore - a.rawScore);

    // Calculate total for normalization
    const totalScore = entries.reduce((sum, e) => sum + e.rawScore, 0);
    
    // Normalize scores to percentages that add up to 100%
    const normalizedEntries = entries.map(e => ({
      name: e.name,
      rawScore: e.rawScore,
      normalizedPercent: totalScore > 0 ? (e.rawScore / totalScore) * 100 : 0,
    }));

    // Top 5 emotions with normalized percentages
    const topEmotions = normalizedEntries.slice(0, 5);

    // Calculate sentiment (positive vs negative balance) using normalized values
    let positiveSum = 0;
    let negativeSum = 0;
    for (const { name, normalizedPercent } of normalizedEntries) {
      if (POSITIVE_EMOTIONS.includes(name)) positiveSum += normalizedPercent;
      if (NEGATIVE_EMOTIONS.includes(name)) negativeSum += normalizedPercent;
    }
    
    // Sentiment from -1 (all negative) to +1 (all positive)
    const totalPosNeg = positiveSum + negativeSum;
    const sentiment = totalPosNeg > 0 ? (positiveSum - negativeSum) / totalPosNeg : 0;

    // Calculate energy level from high-energy emotions
    let energySum = 0;
    for (const { name, normalizedPercent } of normalizedEntries) {
      if (HIGH_ENERGY_EMOTIONS.includes(name)) {
        energySum += normalizedPercent;
      }
    }
    const emotionalEnergy = energySum / 100; // 0-1 scale

    // Emotional diversity (how many emotions have significant presence)
    const activeEmotions = normalizedEntries.filter(e => e.normalizedPercent >= 3).length;

    // Positive ratio (already 0-1 since we're dividing percentages)
    const positiveRatio = totalPosNeg > 0 ? positiveSum / totalPosNeg : 0.5;

    return {
      topEmotions,
      sentiment,
      emotionalEnergy,
      activeEmotions,
      positiveRatio, // Already 0-1 scale
    };
  }, [scores]);

  // Generate key observation
  const keyObservation = useMemo(() => {
    if (!insights) return null;

    const { topEmotions, sentiment, emotionalEnergy } = insights;
    const dominant = topEmotions[0]?.name || "Unknown";
    const dominantPercent = topEmotions[0]?.normalizedPercent || 0;
    
    if (sentiment > 0.3 && emotionalEnergy > 0.2) {
      return {
        icon: Sparkles,
        text: `High positive energy detected. ${dominant} is dominant at ${Math.round(dominantPercent)}% of emotional expression.`,
        color: "emerald" as const,
      };
    }
    if (sentiment > 0.15) {
      return {
        icon: Heart,
        text: `Positive emotional tone. ${dominant} leads at ${Math.round(dominantPercent)}% of the emotional mix.`,
        color: "emerald" as const,
      };
    }
    if (sentiment < -0.3) {
      return {
        icon: AlertTriangle,
        text: `Elevated stress indicators detected. Consider a wellness check-in.`,
        color: "amber" as const,
      };
    }
    if (emotionalEnergy > 0.25) {
      return {
        icon: Zap,
        text: `High emotional intensity. ${dominant} accounts for ${Math.round(dominantPercent)}% of expression.`,
        color: "fuchsia" as const,
      };
    }
    return {
      icon: Lightbulb,
      text: `Balanced emotional state. ${dominant} is most prominent at ${Math.round(dominantPercent)}%.`,
      color: "sky" as const,
    };
  }, [insights]);

  // Voice quality summary
  const voiceQuality = useMemo(() => {
    // Derive stability from jitter (stability = 1 - jitter), then scale to 0-100
    const jitter = audioMetrics?.jitter ?? 0;
    const stability = (1 - Math.max(0, Math.min(1, jitter))) * 100;
    
    if (stability > 80) return { label: "Very Stable", trend: "up" as const };
    if (stability > 50) return { label: "Moderate", trend: "stable" as const };
    return { label: "Variable", trend: "down" as const };
  }, [audioMetrics]);

  const TrendIcon = voiceQuality.trend === "up" ? TrendingUp : 
                    voiceQuality.trend === "down" ? TrendingDown : Minus;

  const hasData = insights !== null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-fuchsia-500/20 border border-amber-500/30">
          <Lightbulb className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-50">Emotional Insights</h2>
          <p className="text-xs text-slate-400">AI-powered voice analysis summary</p>
        </div>
      </div>

      {!hasData ? (
        <div className="py-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/50 mb-4">
            <Lightbulb className="h-7 w-7 text-slate-600" />
          </div>
          <p className="text-sm text-slate-400 max-w-[220px] mx-auto">
            {isExternalLoading 
              ? "Analyzing voice patterns..." 
              : "Upload and analyze audio to see emotional insights"}
          </p>
          {isExternalLoading && (
            <div className="mt-4 mx-auto max-w-[180px]">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-400 via-fuchsia-400 to-amber-400 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Mood Meter */}
          <MoodMeter sentiment={insights.sentiment} />

          {/* Key Observation */}
          {keyObservation && (
            <div className={`flex items-start gap-3 rounded-xl p-3 ${
              keyObservation.color === "emerald" ? "bg-emerald-500/10 border border-emerald-500/20" :
              keyObservation.color === "amber" ? "bg-amber-500/10 border border-amber-500/20" :
              keyObservation.color === "fuchsia" ? "bg-fuchsia-500/10 border border-fuchsia-500/20" :
              "bg-sky-500/10 border border-sky-500/20"
            }`}>
              <keyObservation.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                keyObservation.color === "emerald" ? "text-emerald-400" :
                keyObservation.color === "amber" ? "text-amber-400" :
                keyObservation.color === "fuchsia" ? "text-fuchsia-400" :
                "text-sky-400"
              }`} />
              <p className="text-sm text-slate-300">{keyObservation.text}</p>
            </div>
          )}

          {/* Top Emotions */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Top Detected Emotions</div>
            <div className="flex flex-wrap gap-2">
              {insights.topEmotions.map((e, i) => (
                <EmotionPill key={e.name} name={e.name} normalizedPercent={e.normalizedPercent} rank={i + 1} />
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <InsightBadge
              icon={Heart}
              label="Positive Ratio"
              value={`${Math.round(insights.positiveRatio * 100)}%`}
              color={insights.positiveRatio > 0.5 ? "emerald" : "rose"}
            />
            <InsightBadge
              icon={TrendIcon}
              label="Voice Stability"
              value={voiceQuality.label}
              color={voiceQuality.trend === "up" ? "emerald" : voiceQuality.trend === "down" ? "amber" : "sky"}
            />
          </div>

          {/* Session info */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/50">
            <span>{insights.activeEmotions} emotions detected</span>
            <span>{sessionData.length} data points</span>
          </div>
        </>
      )}
    </div>
  );
}
