import { Activity, Brain, Gauge, Mic2 } from "lucide-react";
import { useMetrics } from "../context/MetricsContext";

export function LiveMetrics() {
  const { currentPoint } = useMetrics();

  const energy = currentPoint?.clinical.energyLevel ?? null;
  const depression = currentPoint?.clinical.depressionRisk ?? null;
  const anxiety = currentPoint?.clinical.anxietyScore ?? null;
  const mania = currentPoint?.clinical.maniaScore ?? null;
  const dominantEmotion = currentPoint?.dominantEmotion ?? "—";

  const cards = [
    {
      label: "Energy",
      value: energy != null ? energy.toFixed(2) : "—",
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      label: "Depression risk",
      value: depression != null ? depression.toFixed(2) : "—",
      icon: Brain,
      color: "text-sky-400",
    },
    {
      label: "Anxiety",
      value: anxiety != null ? anxiety.toFixed(2) : "—",
      icon: Gauge,
      color: "text-amber-400",
    },
    {
      label: "Mania",
      value: mania != null ? mania.toFixed(2) : "—",
      icon: Mic2,
      color: "text-fuchsia-400",
    },
  ];

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-50">Live Metrics</h2>
          <p className="text-xs text-slate-400">Clinical proxies and dominant emotion.</p>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-400">Dominant emotion</div>
          <div className="font-medium text-slate-50">{dominantEmotion}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-3 py-2"
          >
            <div className={`rounded-md bg-slate-900/80 p-1.5 ${card.color}`}>
              <card.icon className="h-3 w-3" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] text-slate-400">{card.label}</div>
              <div className="font-mono text-xs text-slate-100">{card.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

