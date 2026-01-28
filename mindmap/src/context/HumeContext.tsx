import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { HumeProsodyScores } from "../types/hume";
import type { AudioChunk } from "../types/audio";

type HumeStatus = "disconnected" | "connecting" | "connected" | "error";

interface HumeContextValue {
  status: HumeStatus;
  lastError: string | null;
  lastScores: HumeProsodyScores | null;
  isExternalLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendChunk: (chunk: AudioChunk) => void;
  setExternalScores: (scores: HumeProsodyScores | null) => void;
  setExternalLoading: (loading: boolean) => void;
}

const HumeContextReact = createContext<HumeContextValue | null>(null);

export function useHume() {
  const ctx = useContext(HumeContextReact);
  if (!ctx) throw new Error("useHume must be used within HumeProvider");
  return ctx;
}

interface HumeProviderProps {
  children: ReactNode;
}

export function HumeProvider({ children }: HumeProviderProps) {
  const [status, setStatus] = useState<HumeStatus>("disconnected");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastScores, setLastScores] = useState<HumeProsodyScores | null>(null);
  const [isExternalLoading, setIsExternalLoading] = useState(false);

  const connect = useCallback(async () => {
    if (status === "connected") return;
    // For this architecture, the real Hume connection happens on the backend.
    // The frontend "status" is just a UI flag indicating that analysis has started.
    setStatus("connected");
    setLastError(null);
  }, [status]);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
  }, []);

  const sendChunk = useCallback((chunk: AudioChunk) => {
    // Currently a no-op placeholder; in a future iteration this is where
    // audio chunks will be forwarded to Hume's streaming API.
    void chunk;
  }, [status]);

  const setExternalScores = useCallback((scores: HumeProsodyScores | null) => {
    setLastScores(scores);
  }, []);

  const setExternalLoading = useCallback((loading: boolean) => {
    setIsExternalLoading(loading);
  }, []);

  const value: HumeContextValue = useMemo(
    () => ({
      status,
      lastError,
      lastScores,
      isExternalLoading,
      connect,
      disconnect,
      sendChunk,
      setExternalScores,
      setExternalLoading,
    }),
    [status, lastError, lastScores, isExternalLoading, connect, disconnect, sendChunk, setExternalScores, setExternalLoading],
  );

  return <HumeContextReact.Provider value={value}>{children}</HumeContextReact.Provider>;
}

