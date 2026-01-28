import type { LocalAudioMetrics } from "./audio";
import type { HumeProsodyScores } from "./hume";

export interface ClinicalProxies {
  depressionRisk: number | null;
  anxietyScore: number | null;
  maniaScore: number | null;
  energyLevel: number | null;
}

export interface SessionDatum {
  id: string;
  timestamp: number;
  playbackTime: number;
  local: LocalAudioMetrics;
  hume: HumeProsodyScores | null;
  clinical: ClinicalProxies;
  valence: number | null;
  dominantEmotion: string | null;
}

