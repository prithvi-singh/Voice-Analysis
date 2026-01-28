import "./App.css";
import { ControlPanel } from "./components/ControlPanel";
import { LiveMetrics } from "./components/LiveMetrics";
import { EmotionCloud } from "./components/EmotionCloud";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-6">
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-50">MindMap – Voice Analysis</h1>
            <p className="text-xs text-slate-400">
              Upload a voice recording to visualize emotional expression and mental-health proxy metrics.
            </p>
          </div>
          <div className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] text-slate-400">
            Hume emotions · File upload only
          </div>
        </header>

        <main className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
          {/* Left: control + summary metrics (clinical) */}
          <section className="flex flex-col gap-4">
            <ControlPanel />
            <LiveMetrics />
          </section>

          {/* Right: primary focus on Hume emotion space */}
          <section className="flex flex-col gap-4">
            <EmotionCloud />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
