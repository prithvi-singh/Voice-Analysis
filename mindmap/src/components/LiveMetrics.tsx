import { Activity, Brain, Gauge, Zap, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { useMetrics } from "../context/MetricsContext";
import { useHume } from "../context/HumeContext";
import { useMemo } from "react";

interface MetricCardProps {
  label: string;
  value: number | null;
  icon: React.ComponentType<{ className?: string }>;
  color: "emerald" | "sky" | "amber" | "fuchsia";
  description?: string;
  trend?: "up" | "down" | "stable";
}

function MetricCard({ label, value, icon: Icon, color, description, trend }: MetricCardProps) {
  const colorConfig = {
    emerald: {
      bg: "from-emerald-500/20 to-emerald-600/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      bar: "from-emerald-400 to-emerald-500",
      glow: "shadow-emerald-500/20",
      icon: "from-emerald-500/30 to-emerald-600/20",
    },
    sky: {
      bg: "from-sky-500/20 to-sky-600/10",
      border: "border-sky-500/30",
      text: "text-sky-400",
      bar: "from-sky-400 to-sky-500",
      glow: "shadow-sky-500/20",
      icon: "from-sky-500/30 to-sky-600/20",
    },
    amber: {
      bg: "from-amber-500/20 to-amber-600/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      bar: "from-amber-400 to-amber-500",
      glow: "shadow-amber-500/20",
      icon: "from-amber-500/30 to-amber-600/20",
    },
    fuchsia: {
      bg: "from-fuchsia-500/20 to-fuchsia-600/10",
      border: "border-fuchsia-500/30",
      text: "text-fuchsia-400",
      bar: "from-fuchsia-400 to-fuchsia-500",
      glow: "shadow-fuchsia-500/20",
      icon: "from-fuchsia-500/30 to-fuchsia-600/20",
    },
  };

  const config = colorConfig[color];
  // Values are now 0-100 scale (percentages)
  const percentage = value != null ? Math.min(100, value) : 0;
  const displayValue = value != null ? `${Math.round(value)}%` : "—";
  const isWaiting = value == null;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={`metric-card relative overflow-hidden rounded-xl bg-gradient-to-br ${config.bg} border ${config.border} p-4 shadow-lg ${config.glow}`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-current blur-2xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${config.icon}`}>
            <Icon className={`h-4 w-4 ${config.text}`} />
          </div>
          {value != null && trend && (
            <div className={`flex items-center gap-1 text-xs ${config.text}`}>
              <TrendIcon className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-1">
          <span className={`text-2xl font-bold tracking-tight ${isWaiting ? "text-slate-500" : config.text} value-animate`}>
            {displayValue}
          </span>
        </div>

        {/* Label */}
        <div className="mb-3">
          <span className="text-sm font-medium text-slate-300">{label}</span>
          {description && (
            <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60">
          <div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${config.bar} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
          {/* Animated shine */}
          {value != null && value > 0.1 && (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/20 animate-pulse"
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function LiveMetrics() {
  const { currentPoint, sessionData } = useMetrics();
  const { isExternalLoading, lastScores } = useHume();

  const energy = currentPoint?.clinical.energyLevel ?? null;
  const depression = currentPoint?.clinical.depressionRisk ?? null;
  const anxiety = currentPoint?.clinical.anxietyScore ?? null;
  const mania = currentPoint?.clinical.maniaScore ?? null;
  const dominantEmotion = currentPoint?.dominantEmotion ?? "Waiting...";
  
  // Check if we have Hume data
  const hasHumeData = lastScores && Object.keys(lastScores).length > 0;

  // Calculate trends by comparing recent vs older data
  const trends = useMemo(() => {
    if (sessionData.length < 10) return { energy: undefined, depression: undefined, anxiety: undefined, mania: undefined };

    const recent = sessionData.slice(-5);
    const older = sessionData.slice(-10, -5);

    const avgRecent = (key: "energyLevel" | "depressionRisk" | "anxietyScore" | "maniaScore") => {
      const vals = recent.map((d) => d.clinical[key]).filter((v) => v != null) as number[];
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    const avgOlder = (key: "energyLevel" | "depressionRisk" | "anxietyScore" | "maniaScore") => {
      const vals = older.map((d) => d.clinical[key]).filter((v) => v != null) as number[];
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    const getTrend = (key: "energyLevel" | "depressionRisk" | "anxietyScore" | "maniaScore"): "up" | "down" | "stable" | undefined => {
      const r = avgRecent(key);
      const o = avgOlder(key);
      if (r == null || o == null) return undefined;
      const diff = r - o;
      if (Math.abs(diff) < 5) return "stable"; // 5% threshold for 0-100 scale
      return diff > 0 ? "up" : "down";
    };

    return {
      energy: getTrend("energyLevel"),
      depression: getTrend("depressionRisk"),
      anxiety: getTrend("anxietyScore"),
      mania: getTrend("maniaScore"),
    };
  }, [sessionData]);

  const cards: MetricCardProps[] = [
    {
      label: "Energy Level",
      value: energy,
      icon: Zap,
      color: "emerald",
      description: "Russell's Circumplex arousal",
      trend: trends.energy,
    },
    {
      label: "Depression Risk",
      value: depression,
      icon: Brain,
      color: "sky",
      description: "Beck Depression Inventory proxy",
      trend: trends.depression,
    },
    {
      label: "Anxiety Score",
      value: anxiety,
      icon: Gauge,
      color: "amber",
      description: "STAI & Hamilton Scale proxy",
      trend: trends.anxiety,
    },
    {
      label: "Mania Indicator",
      value: mania,
      icon: Activity,
      color: "fuchsia",
      description: "Young Mania Rating proxy",
      trend: trends.mania,
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-50">Clinical Proxies</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mental health indicators derived from voice patterns
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            {isExternalLoading ? "Analyzing..." : "Dominant"}
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-1.5">
            {isExternalLoading ? (
              <Loader2 className="h-4 w-4 text-sky-400 animate-spin" />
            ) : (
              <>
                <span className={`h-2 w-2 rounded-full ${hasHumeData ? "bg-gradient-to-r from-emerald-400 to-sky-400" : "bg-slate-600"}`} />
                <span className="text-sm font-medium text-slate-200 capitalize">
                  {dominantEmotion}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      {/* Data points indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/50">
        <span className="flex items-center gap-2">
          Data points: <span className="font-mono text-slate-400">{sessionData.length}</span>
        </span>
        <span className={`flex items-center gap-1.5 ${hasHumeData ? "text-emerald-400" : "text-slate-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${hasHumeData ? "bg-emerald-400" : "bg-slate-600"}`} />
          {hasHumeData ? "Hume data loaded" : isExternalLoading ? "Analyzing..." : "Local audio only"}
        </span>
      </div>
    </div>
  );
}
