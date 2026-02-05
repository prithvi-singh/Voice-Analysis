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
import { useAudio } from "./AudioContext";
import { useHume } from "./HumeContext";
import type { SessionDatum } from "../types/session";
import { computeValence, extractDominantEmotion, mapHumeToClinicalProxies } from "../utils/clinicalMapping";

// Constants
const SAMPLE_INTERVAL_MS = 500; // 2 Hz sampling
const MAX_SESSION_DATA_POINTS = 1000; // Prevent memory leaks

interface MetricsContextValue {
  sessionData: SessionDatum[];
  currentPoint: SessionDatum | null;
  trajectoryPoints: Array<{ timeBucket: number; energy: number | null; valence: number | null }>;
  clearSession: () => void;
  isCollecting: boolean;
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
  const { metrics: localMetrics, currentTime, isPlaying } = useAudio();
  const { lastScores, status } = useHume();

  const [sessionData, setSessionData] = useState<SessionDatum[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);

  // Use refs to avoid recreating interval on every state change
  const localMetricsRef = useRef(localMetrics);
  const lastScoresRef = useRef(lastScores);
  const currentTimeRef = useRef(currentTime);

  // Keep refs in sync
  useEffect(() => {
    localMetricsRef.current = localMetrics;
  }, [localMetrics]);

  useEffect(() => {
    lastScoresRef.current = lastScores;
  }, [lastScores]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const clearSession = useCallback(() => {
    setSessionData([]);
  }, []);

  // Collect data while playing (regardless of Hume connection status)
  // This way we get local audio metrics immediately, and Hume data when available
  const shouldCollect = isPlaying;

  useEffect(() => {
    if (!shouldCollect) {
      setIsCollecting(false);
      return;
    }

    setIsCollecting(true);

    const intervalId = window.setInterval(() => {
      const scores = lastScoresRef.current;
      const metrics = localMetricsRef.current;
      const time = currentTimeRef.current;

      const clinical = mapHumeToClinicalProxies(scores, metrics.energy);
      const valence = computeValence(scores);
      const dominantEmotion = extractDominantEmotion(scores);

      const datum: SessionDatum = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        playbackTime: time,
        local: { ...metrics },
        hume: scores,
        clinical,
        valence,
        dominantEmotion,
      };

      setSessionData((prev) => {
        // Enforce max data points to prevent memory leaks
        const newData = [...prev, datum];
        if (newData.length > MAX_SESSION_DATA_POINTS) {
          // Keep most recent data points
          return newData.slice(-MAX_SESSION_DATA_POINTS);
        }
        return newData;
      });
    }, SAMPLE_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      setIsCollecting(false);
    };
  }, [shouldCollect]);

  // Also update when Hume scores arrive (even if not playing)
  // This ensures the UI updates when backend analysis completes
  useEffect(() => {
    if (!lastScores || Object.keys(lastScores).length === 0) return;
    
    // If we have session data, update the most recent points with Hume scores
    setSessionData((prev) => {
      if (prev.length === 0) {
        // Create a new data point with Hume scores
        const clinical = mapHumeToClinicalProxies(lastScores, localMetricsRef.current.energy);
        const valence = computeValence(lastScores);
        const dominantEmotion = extractDominantEmotion(lastScores);
        
        return [{
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
          playbackTime: currentTimeRef.current,
          local: { ...localMetricsRef.current },
          hume: lastScores,
          clinical,
          valence,
          dominantEmotion,
        }];
      }
      
      // Update existing data points that don't have Hume scores
      return prev.map((datum) => {
        if (datum.hume && Object.keys(datum.hume).length > 0) {
          return datum; // Already has Hume scores
        }
        
        const clinical = mapHumeToClinicalProxies(lastScores, datum.local.energy);
        const valence = computeValence(lastScores);
        const dominantEmotion = extractDominantEmotion(lastScores);
        
        return {
          ...datum,
          hume: lastScores,
          clinical,
          valence,
          dominantEmotion,
        };
      });
    });
  }, [lastScores]);

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
      isCollecting,
    }),
    [sessionData, currentPoint, trajectoryPoints, clearSession, isCollecting],
  );

  return <MetricsContextReact.Provider value={value}>{children}</MetricsContextReact.Provider>;
}
