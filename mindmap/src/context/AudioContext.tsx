import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LocalAudioMetrics, AudioChunk } from "../types/audio";
import { YIN } from "pitchfinder";

interface AudioContextValue {
  loadFile: (file: File) => Promise<void>;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  currentFileName: string | null;
  metrics: LocalAudioMetrics;
  subscribeToChunks: (cb: (chunk: AudioChunk) => void) => () => void;
}

const AudioContextReact = createContext<AudioContextValue | null>(null);

export function useAudio() {
  const ctx = useContext(AudioContextReact);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<LocalAudioMetrics>({
    volumeDb: null,
    pitchHz: null,
    jitter: null,
    energy: null,
  });

  const chunkSubscribers = useRef(new Set<(chunk: AudioChunk) => void>());
  const lastPitchRef = useRef<number | null>(null);

  const ensureContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  };

  const cleanupNodes = () => {
    scriptNodeRef.current?.disconnect();
    scriptNodeRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    sourceRef.current?.stop();
    sourceRef.current?.disconnect();
    sourceRef.current = null;
  };

  const loadFile = useCallback(async (file: File) => {
    const ctx = ensureContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    bufferRef.current = decoded;
    setDuration(decoded.duration);
    setCurrentFileName(file.name);
    setCurrentTime(0);
    pauseTimeRef.current = 0;
  }, []);

  const startPlayback = useCallback(() => {
    const ctx = ensureContext();
    const buffer = bufferRef.current;
    if (!buffer) return;

    cleanupNodes();

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;

    const scriptNode = ctx.createScriptProcessor(2048, 1, 1);
    const yin = YIN({ sampleRate: buffer.sampleRate });

    const frameSamplesForRms = new Float32Array(analyser.fftSize);

    let pcmAccum: number[] = [];
    const chunkDurationMs = 250;
    const chunkSamplesTarget = Math.round((chunkDurationMs / 1000) * buffer.sampleRate);
    const startAt = pauseTimeRef.current;

    scriptNode.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);

      // Local metrics: RMS volume and pitch
      frameSamplesForRms.set(input);
      let sumSquares = 0;
      for (let i = 0; i < frameSamplesForRms.length; i++) {
        const v = frameSamplesForRms[i];
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / frameSamplesForRms.length);
      const volumeDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

      const pitch = yin(input) ?? null;
      const lastPitch = lastPitchRef.current;
      const jitter =
        pitch != null && lastPitch != null && lastPitch !== 0
          ? Math.abs(pitch - lastPitch) / lastPitch
          : null;
      lastPitchRef.current = pitch ?? lastPitch ?? null;

      const energy = rms;

      setMetrics({
        volumeDb: Number.isFinite(volumeDb) ? volumeDb : null,
        pitchHz: pitch,
        jitter,
        energy,
      });

      // Chunking for Hume
      for (let i = 0; i < input.length; i++) {
        pcmAccum.push(input[i]);
        if (pcmAccum.length >= chunkSamplesTarget) {
          const samples = new Float32Array(pcmAccum.splice(0, chunkSamplesTarget));
          const chunk: AudioChunk = {
            samples,
            sampleRate: buffer.sampleRate,
            timestamp: ctx.currentTime,
          };
          chunkSubscribers.current.forEach((cb) => cb(chunk));
        }
      }
    };

    source.connect(analyser);
    analyser.connect(scriptNode);
    scriptNode.connect(ctx.destination);

    sourceRef.current = source;
    analyserRef.current = analyser;
    scriptNodeRef.current = scriptNode;

    startTimeRef.current = ctx.currentTime - startAt;
    setIsPlaying(true);

    source.start(0, startAt);

    source.onended = () => {
      setIsPlaying(false);
      pauseTimeRef.current = 0;
      setCurrentTime(duration);
      cleanupNodes();
    };
  }, [duration]);

  const start = useCallback(() => {
    if (!bufferRef.current) return;
    pauseTimeRef.current = 0;
    startPlayback();
  }, [startPlayback]);

  const pause = useCallback(() => {
    if (!audioContextRef.current || !isPlaying) return;
    pauseTimeRef.current = currentTime;
    cleanupNodes();
    setIsPlaying(false);
  }, [currentTime, isPlaying]);

  const resume = useCallback(() => {
    if (!bufferRef.current) return;
    startPlayback();
  }, [startPlayback]);

  const stop = useCallback(() => {
    pauseTimeRef.current = 0;
    cleanupNodes();
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const ctx = audioContextRef.current;
      if (ctx && startTimeRef.current != null && bufferRef.current) {
        const t = ctx.currentTime - startTimeRef.current;
        setCurrentTime(Math.min(bufferRef.current.duration, Math.max(0, t)));
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    return () => {
      cleanupNodes();
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const subscribeToChunks = useCallback((cb: (chunk: AudioChunk) => void) => {
    chunkSubscribers.current.add(cb);
    return () => {
      chunkSubscribers.current.delete(cb);
    };
  }, []);

  const value: AudioContextValue = useMemo(
    () => ({
      loadFile,
      start,
      pause,
      resume,
      stop,
      isPlaying,
      duration,
      currentTime,
      currentFileName,
      metrics,
      subscribeToChunks,
    }),
    [loadFile, start, pause, resume, stop, isPlaying, duration, currentTime, currentFileName, metrics, subscribeToChunks],
  );

  return <AudioContextReact.Provider value={value}>{children}</AudioContextReact.Provider>;
}

