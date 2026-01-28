import type { HumeProsodyScores } from "../types/hume";
import type { ClinicalProxies } from "../types/session";

function safeAvg(values: Array<number | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (!nums.length) return null;
  const sum = nums.reduce((acc, v) => acc + v, 0);
  return sum / nums.length;
}

export function mapHumeToClinicalProxies(
  scores: HumeProsodyScores | null | undefined,
  localEnergy: number | null,
): ClinicalProxies {
  if (!scores) {
    return {
      depressionRisk: null,
      anxietyScore: null,
      maniaScore: null,
      energyLevel: localEnergy,
    };
  }

  const depressionRisk = safeAvg([
    scores.Sadness as number | undefined,
    scores.Tiredness as number | undefined,
    scores.Boredom as number | undefined,
  ]);

  const anxietyScore = safeAvg([
    scores.Anxiety as number | undefined,
    scores.Fear as number | undefined,
    scores.Distress as number | undefined,
  ]);

  const maniaScore = safeAvg([
    scores.Excitement as number | undefined,
    scores.Anger as number | undefined,
    scores.Amusement as number | undefined,
  ]);

  // Combine local energy and Hume arousal if available
  const arousal = typeof scores.arousal === "number" ? scores.arousal : null;
  let energyLevel: number | null = null;
  if (localEnergy != null && arousal != null) {
    energyLevel = (localEnergy + arousal) / 2;
  } else if (localEnergy != null) {
    energyLevel = localEnergy;
  } else if (arousal != null) {
    energyLevel = arousal;
  }

  return {
    depressionRisk,
    anxietyScore,
    maniaScore,
    energyLevel,
  };
}

export function computeValence(scores: HumeProsodyScores | null | undefined): number | null {
  if (!scores) return null;

  if (typeof scores.valence === "number") {
    return scores.valence;
  }

  const positive = safeAvg([
    scores.Joy as number | undefined,
    scores.Amusement as number | undefined,
    scores.Excitement as number | undefined,
  ]);

  const negative = safeAvg([
    scores.Sadness as number | undefined,
    scores.Distress as number | undefined,
    scores.Fear as number | undefined,
  ]);

  if (positive == null && negative == null) return null;

  const pos = positive ?? 0;
  const neg = negative ?? 0;
  const score = pos - neg; // roughly in [-1,1]
  return Math.max(-1, Math.min(1, score));
}

export function extractDominantEmotion(scores: HumeProsodyScores | null | undefined): string | null {
  if (!scores) return null;

  let bestLabel: string | null = null;
  let bestScore = -Infinity;

  for (const [key, value] of Object.entries(scores)) {
    if (key === "arousal" || key === "valence") continue;
    if (typeof value !== "number") continue;
    if (value > bestScore) {
      bestScore = value;
      bestLabel = key;
    }
  }

  return bestLabel;
}

