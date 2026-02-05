import { useRef, useState, type ChangeEvent } from "react";
import {
  Play,
  Pause,
  Square,
  Upload,
  AlertCircle,
  Loader2,
  Music2,
  AudioWaveform,
  CheckCircle2,
} from "lucide-react";
import { useAudio } from "../context/AudioContext";
import { useHume } from "../context/HumeContext";
import { useMetrics } from "../context/MetricsContext";

export function ControlPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    loadFile,
    start,
    pause,
    resume,
    stop,
    isPlaying,
    currentFileName,
    duration,
    currentTime,
  } = useAudio();
  const { status, lastError, connect, disconnect, setExternalScores, setExternalLoading, isExternalLoading } =
    useHume();
  const { clearSession } = useMetrics();
  const [isLoaded, setIsLoaded] = useState(false);
  const [fileForBackend, setFileForBackend] = useState<File | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFileLoad(file);
  };

  const handleFileLoad = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("audio/")) {
      setAnalysisError("Please select an audio file");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setAnalysisError("File size must be under 50MB");
      return;
    }

    setAnalysisError(null);
    await loadFile(file);
    setIsLoaded(true);
    setFileForBackend(file);
    clearSession();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileLoad(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleStartAnalysis = async () => {
    if (!isLoaded || !fileForBackend) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }
    setAnalysisError(null);
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
        
        // Try proxy first, fallback to direct API URL
        const apiUrl = import.meta.env.VITE_API_URL || "";
        let res: Response;
        try {
          res = await fetch("/analyze", {
            method: "POST",
            body: form,
          });
          // If proxy returns 404, try direct URL
          if (res.status === 404 && apiUrl) {
            console.log("Proxy failed, trying direct API URL:", apiUrl);
            res = await fetch(`${apiUrl}/analyze`, {
              method: "POST",
              body: form,
            });
          }
        } catch {
          // Network error with proxy, try direct URL
          if (apiUrl) {
            console.log("Proxy error, trying direct API URL:", apiUrl);
            res = await fetch(`${apiUrl}/analyze`, {
              method: "POST",
              body: form,
            });
          } else {
            throw new Error("Failed to connect to analysis server");
          }
        }
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string; details?: string };
          // Use details for more helpful error messages
          throw new Error(data.details || data.error || `Analysis failed (${res.status})`);
        }
        const data = (await res.json()) as { rawScores?: Record<string, number> };
        if (data.rawScores && Object.keys(data.rawScores).length > 0) {
          setExternalScores(data.rawScores);
          console.log("Received emotion scores:", Object.keys(data.rawScores).length, "emotions");
        } else {
          // No emotions found even though request succeeded
          throw new Error("No emotions detected in audio. Try a recording with clearer speech.");
        }
      } catch (err) {
        console.error(err);
        setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const statusConfig = {
    disconnected: { color: "text-slate-400", bgColor: "bg-slate-700", label: "Ready" },
    connecting: { color: "text-amber-400", bgColor: "bg-amber-500/20", label: "Connecting..." },
    connected: { color: "text-emerald-400", bgColor: "bg-emerald-500/20", label: "Connected" },
    error: { color: "text-rose-400", bgColor: "bg-rose-500/20", label: "Error" },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30">
            <AudioWaveform className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-50">Control Panel</h2>
            <p className="text-xs text-slate-400">Upload audio and analyze</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${currentStatus.bgColor}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${currentStatus.color.replace("text-", "bg-")} ${
              status === "connected" ? "status-connected" : ""
            }`}
          />
          <span className={currentStatus.color}>{currentStatus.label}</span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 transition-all duration-300 ${
          isDragOver
            ? "border-emerald-400 bg-emerald-500/10"
            : isLoaded
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50"
        }`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          {isLoaded ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <Music2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">
                  {currentFileName}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Duration: {formatTime(duration)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                <Upload className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Drop audio file here
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  or click to browse • MP3, WAV, M4A
                </p>
              </div>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {/* Progress bar */}
      {isLoaded && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Progress</span>
            <span className="font-mono text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-sky-400 to-emerald-400 transition-all duration-150 progress-shine"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleStartAnalysis}
          disabled={!isLoaded || isExternalLoading}
          className="btn-primary relative flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isExternalLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Analysis
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleTogglePlay}
          disabled={!isLoaded}
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={handleStopAnalysis}
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-slate-700"
        >
          <Square className="h-4 w-4" />
        </button>
      </div>

      {/* Analysis status */}
      {isExternalLoading && (
        <div className="flex items-center gap-3 rounded-lg bg-sky-500/10 border border-sky-500/20 px-4 py-3">
          <div className="flex gap-1">
            <span className="loading-dot h-2 w-2 rounded-full bg-sky-400" />
            <span className="loading-dot h-2 w-2 rounded-full bg-sky-400" />
            <span className="loading-dot h-2 w-2 rounded-full bg-sky-400" />
          </div>
          <p className="text-sm text-sky-300">
            Analyzing emotions with Hume AI...
          </p>
        </div>
      )}

      {/* Success indicator */}
      {!isExternalLoading && status === "connected" && !lastError && !analysisError && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <p className="text-sm text-emerald-300">Analysis complete</p>
        </div>
      )}

      {/* Error display */}
      {(lastError || analysisError) && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
          <p className="text-sm text-rose-300">{lastError || analysisError}</p>
        </div>
      )}
    </div>
  );
}
