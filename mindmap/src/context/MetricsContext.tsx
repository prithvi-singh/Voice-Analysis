import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAudio } from "./AudioContext";
import { useHume } from "./HumeContext";
import type { SessionDatum } from "../types/session";
import { computeValence, extractDominantEmotion, mapHumeToClinicalProxies } from "../utils/clinicalMapping";

interface MetricsContextValue {
  sessionData: SessionDatum[];
  currentPoint: SessionDatum | null;
  trajectoryPoints: Array<{ timeBucket: number; energy: number | null; valence: number | null }>;
  clearSession: () => void;
}

const MetricsContextReact = createContext<MetricsContextValue | null>(null);

export function useMetrics() {
  const ctx = useContext(MetricsContextReact);
  if (!ctx) throw new Error("useMetrics must be used within MetricsProvider");
  return ctx;
}

interface MetricsProviderProps {
  children: ReactNode;
}

export function MetricsProvider({ children }: MetricsProviderProps) {
  const { metrics: localMetrics, currentTime } = useAudio();
  const { lastScores } = useHume();

  const [sessionData, setSessionData] = useState<SessionDatum[]>([]);

  const clearSession = useCallback(() => {
    setSessionData([]);
  }, []);

  useEffect(() => {
    let intervalId: number | undefined;

    intervalId = window.setInterval(() => {
      const clinical = mapHumeToClinicalProxies(lastScores, localMetrics.energy);
      const valence = computeValence(lastScores);
      const dominantEmotion = extractDominantEmotion(lastScores);

      const datum: SessionDatum = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        playbackTime: currentTime,
        local: { ...localMetrics },
        hume: lastScores,
        clinical,
        valence,
        dominantEmotion,
      };

      setSessionData((prev) => [...prev, datum]);
    }, 500); // 2 Hz

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [currentTime, lastScores, localMetrics]);

  const currentPoint = sessionData.length ? sessionData[sessionData.length - 1] : null;

  const trajectoryPoints = useMemo(() => {
    const buckets = new Map<
      number,
      { count: number; energySum: number; valenceSum: number; energyCount: number; valenceCount: number }
    >();

    for (const d of sessionData) {
      const bucket = Math.floor(d.playbackTime / 2);
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { count: 0, energySum: 0, valenceSum: 0, energyCount: 0, valenceCount: 0 });
      }
      const agg = buckets.get(bucket)!;
      agg.count += 1;
      if (d.clinical.energyLevel != null) {
        agg.energySum += d.clinical.energyLevel;
        agg.energyCount += 1;
      }
      if (d.valence != null) {
        agg.valenceSum += d.valence;
        agg.valenceCount += 1;
      }
    }

    return Array.from(buckets.entries())
      .map(([bucket, agg]) => ({
        timeBucket: bucket,
        energy: agg.energyCount ? agg.energySum / agg.energyCount : null,
        valence: agg.valenceCount ? agg.valenceSum / agg.valenceCount : null,
      }))
      .sort((a, b) => a.timeBucket - b.timeBucket);
  }, [sessionData]);

  const value: MetricsContextValue = useMemo(
    () => ({
      sessionData,
      currentPoint,
      trajectoryPoints,
      clearSession,
    }),
    [sessionData, currentPoint, trajectoryPoints, clearSession],
  );

  return <MetricsContextReact.Provider value={value}>{children}</MetricsContextReact.Provider>;
}

