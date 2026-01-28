import { useRef, useState, type ChangeEvent } from "react";
import { Play, Pause, Square, Upload, Link2Off } from "lucide-react";
import { useAudio } from "../context/AudioContext";
import { useHume } from "../context/HumeContext";
import { useMetrics } from "../context/MetricsContext";

export function ControlPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { loadFile, start, pause, resume, stop, isPlaying, currentFileName, duration, currentTime } = useAudio();
  const { status, lastError, connect, disconnect, setExternalScores, setExternalLoading } = useHume();
  const { clearSession } = useMetrics();
  const [isLoaded, setIsLoaded] = useState(false);
  const [fileForBackend, setFileForBackend] = useState<File | null>(null);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await loadFile(file);
    setIsLoaded(true);
    setFileForBackend(file);
    clearSession();
  };

  const handleStartAnalysis = async () => {
    if (!isLoaded || !fileForBackend) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }
    clearSession();
    await connect();
    start();

    // Kick off backend analysis in parallel (non-blocking for UI).
    void (async () => {
      try {
        setExternalLoading(true);
        setExternalScores(null);
        const form = new FormData();
        form.append("audio", fileForBackend);
        const res = await fetch("http://localhost:4003/analyze", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          throw new Error(`Backend error: ${res.status}`);
        }
        const data = (await res.json()) as { rawScores?: Record<string, number> };
        if (data.rawScores) {
          setExternalScores(data.rawScores);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setExternalLoading(false);
      }
    })();
  };

  const handleStopAnalysis = () => {
    stop();
    disconnect();
  };

  const handleTogglePlay = () => {
    if (!isLoaded) return;
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const formatTime = (t: number) => {
    if (!Number.isFinite(t)) return "0:00";
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-50">Control Panel</h2>
          <p className="text-xs text-slate-400">Upload an audio file and run analysis.</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
        >
          <Upload className="h-3 w-3" />
          Choose file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      <div className="space-y-2 rounded-lg bg-slate-900/80 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">File</span>
          <span className="truncate text-right text-slate-100">
            {currentFileName ?? (isLoaded ? "Loaded" : "No file selected")}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Progress</span>
          <span className="font-mono text-slate-200">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Hume status</span>
          <span
            className={
              status === "connected"
                ? "text-emerald-400"
                : status === "error"
                  ? "text-rose-400"
                  : "text-amber-300"
            }
          >
            {status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleStartAnalysis}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          disabled={!isLoaded || status === "connecting"}
        >
          <Play className="h-3 w-3" />
          Start analysis
        </button>
        <button
          type="button"
          onClick={handleTogglePlay}
          className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/50 disabled:text-slate-500"
          disabled={!isLoaded}
        >
          {isPlaying ? (
            <>
              <Pause className="h-3 w-3" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              Resume
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleStopAnalysis}
          className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          <Square className="h-3 w-3" />
          Stop
        </button>
      </div>

      {lastError && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-900/60 bg-rose-950/60 p-2 text-xs text-rose-200">
          <Link2Off className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <p>{lastError}</p>
        </div>
      )}
    </div>
  );
}

