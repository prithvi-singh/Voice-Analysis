import { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { useMetrics } from "../context/MetricsContext";
import { Map, Target } from "lucide-react";

interface DataPoint {
  energy: number;
  valence: number;
  timeBucket: number;
  index: number;
}

// Custom tooltip component
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DataPoint }> }) {
  if (!active || !payload?.[0]) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <div className="text-xs text-slate-400 mb-1">t = {point.timeBucket * 2}s</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-slate-400">Energy</span>
        </div>
        <span className="font-mono text-emerald-300">{Math.round(point.energy)}%</span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          <span className="text-slate-400">Valence</span>
        </div>
        <span className="font-mono text-sky-300">{Math.round(point.valence)}%</span>
      </div>
    </div>
  );
}

// Color interpolation helper
function interpolateColor(index: number): string {
  // From emerald to sky to fuchsia based on index (0-1)
  if (index < 0.5) {
    // Emerald to sky
    const t = index * 2;
    return `rgb(${Math.round(52 + (56 - 52) * t)}, ${Math.round(211 + (189 - 211) * t)}, ${Math.round(153 + (248 - 153) * t)})`;
  } else {
    // Sky to fuchsia
    const t = (index - 0.5) * 2;
    return `rgb(${Math.round(56 + (232 - 56) * t)}, ${Math.round(189 + (121 - 189) * t)}, ${Math.round(248 + (249 - 248) * t)})`;
  }
}

export function MindMapPlot() {
  const { trajectoryPoints, currentPoint } = useMetrics();

  const data = useMemo(() => {
    const filtered = trajectoryPoints
      .filter((p) => p.energy != null && p.valence != null)
      .map((p, i, arr) => ({
        energy: p.energy!,
        valence: p.valence!,
        timeBucket: p.timeBucket,
        index: arr.length > 1 ? i / (arr.length - 1) : 1,
      }));
    return filtered;
  }, [trajectoryPoints]);

  const currentEnergy = currentPoint?.clinical.energyLevel ?? null;
  const currentValence = currentPoint?.valence ?? null;

  // Calculate quadrant (values are now 0-100 scale)
  const quadrant = useMemo(() => {
    if (currentEnergy === null || currentValence === null) return null;
    const highEnergy = currentEnergy > 50;
    const highValence = currentValence > 50;
    if (highEnergy && highValence) return "Excited / Happy";
    if (highEnergy && !highValence) return "Tense / Angry";
    if (!highEnergy && highValence) return "Calm / Content";
    return "Sad / Fatigued";
  }, [currentEnergy, currentValence]);

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-fuchsia-500/20 border border-emerald-500/30">
            <Map className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-50">MindMap Trajectory</h2>
            <p className="text-xs text-slate-400">Energy vs Valence space</p>
          </div>
        </div>

        {/* Current state indicator */}
        {quadrant && (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">State</div>
            <div className="text-sm font-medium text-slate-200">{quadrant}</div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/50 mb-3">
                <Target className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">
                Trajectory data will appear here
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={true}
                horizontal={true}
              />

              {/* Quadrant reference lines at 50% */}
              <ReferenceLine x={50} stroke="#334155" strokeDasharray="5 5" />
              <ReferenceLine y={50} stroke="#334155" strokeDasharray="5 5" />

              <XAxis
                type="number"
                dataKey="energy"
                name="Energy %"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
                tickFormatter={(v) => `${v}%`}
              />

              <YAxis
                type="number"
                dataKey="valence"
                name="Valence %"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
                tickFormatter={(v) => `${v}%`}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#475569", strokeDasharray: "3 3" }}
              />

              <Scatter
                data={data}
                line={{ stroke: "#4ade80", strokeWidth: 1 }}
                lineJointType="monotoneX"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={interpolateColor(entry.index)}
                    fillOpacity={0.4 + entry.index * 0.6}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2 border-t border-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-gradient-to-r from-emerald-400/50 to-emerald-400" />
          <span>Recent</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-600" />
          <span>Earlier</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono">{data.length}</span>
          <span>points</span>
        </div>
      </div>
    </div>
  );
}
