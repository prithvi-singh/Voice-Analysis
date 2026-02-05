import "./App.css";
import { ControlPanel } from "./components/ControlPanel";
import { LiveMetrics } from "./components/LiveMetrics";
import { EmotionalAnalysis } from "./components/EmotionalAnalysis";
import { VoiceFeed } from "./components/VoiceFeed";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { Waves, Github, ExternalLink } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative mx-auto min-h-screen max-w-7xl px-4 py-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-sky-500 to-fuchsia-500 shadow-lg shadow-emerald-500/25">
                  <Waves className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-500 via-sky-500 to-fuchsia-500 opacity-30 blur-lg" />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="gradient-text">MindMap</span>
                  <span className="text-slate-400 font-normal ml-2">Voice Analysis</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI-powered emotion and mental health insights from voice
                </p>
              </div>
            </div>

            {/* Header badges */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Powered by Hume AI
              </div>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </header>

        {/* Audio Visualizer Banner */}
        <div className="mb-6">
          <AudioVisualizer barCount={80} className="h-24 rounded-2xl glass-card" />
        </div>

        {/* Main Grid Layout */}
        <main className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Controls and Clinical Metrics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
              <ControlPanel />
            </div>
            <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <LiveMetrics />
            </div>
          </div>

          {/* Right Column - Emotional Analysis and Voice Feed */}
          <div className="lg:col-span-8 space-y-6">
            {/* Emotional Analysis - Full Width */}
            <div className="fade-in-up" style={{ animationDelay: "0.3s" }}>
              <EmotionalAnalysis />
            </div>

            {/* Voice Feed - Full Width */}
            <div className="fade-in-up" style={{ animationDelay: "0.4s" }}>
              <VoiceFeed />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-800/50 pt-6 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>Built with React, TypeScript & Tailwind</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Emotion analysis by Hume AI</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://hume.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-slate-300 transition-colors"
              >
                Hume AI <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <span>MindMap MVP v1.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
