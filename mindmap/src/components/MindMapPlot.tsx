import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMetrics } from "../context/MetricsContext";

export function MindMapPlot() {
  const { trajectoryPoints } = useMetrics();

  const data = trajectoryPoints
    .filter((p) => p.energy != null && p.valence != null)
    .map((p) => ({
      energy: p.energy!,
      valence: p.valence!,
      timeBucket: p.timeBucket,
    }));

  return (
    <div className="h-72 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-50">MindMap Trajectory</h2>
          <p className="text-xs text-slate-400">Energy vs Valence over time (every 2s).</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            type="number"
            dataKey="energy"
            name="Energy"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={{ stroke: "#4b5563" }}
            tickLine={{ stroke: "#4b5563" }}
          />
          <YAxis
            type="number"
            dataKey="valence"
            name="Valence"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={{ stroke: "#4b5563" }}
            tickLine={{ stroke: "#4b5563" }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "#4b5563" }}
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #1f2937",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
            }}
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as any;
              if (!point) return "";
              return `t = ${point.timeBucket * 2}s`;
            }}
            formatter={(value: any, name: any) => [value.toFixed(2), name]}
          />
          <Scatter
            data={data}
            fill="#22c55e"
            line={{ stroke: "#4ade80", strokeWidth: 1 }}
            lineJointType="monotoneX"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

