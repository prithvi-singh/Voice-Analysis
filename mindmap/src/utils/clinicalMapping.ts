import type { HumeProsodyScores } from "../types/hume";
import type { ClinicalProxies } from "../types/session";

/**
 * Clinical Proxy Formulas based on established psychological research:
 * 
 * 1. Depression Risk - Based on Beck Depression Inventory (BDI) emotion correlates
 *    Reference: Beck et al. (1961), Watson & Clark PANAS (1988)
 *    Key emotions: Sadness, hopelessness, guilt, fatigue, anhedonia
 * 
 * 2. Anxiety Score - Based on State-Trait Anxiety Inventory (STAI) correlates
 *    Reference: Spielberger et al. (1983), Hamilton Anxiety Scale
 *    Key emotions: Fear, worry, tension, nervousness, panic
 * 
 * 3. Mania/Activation - Based on Young Mania Rating Scale (YMRS) correlates
 *    Reference: Young et al. (1978), Altman Self-Rating Mania Scale
 *    Key emotions: Elevated mood, irritability, increased energy, grandiosity
 * 
 * 4. Energy/Arousal - Based on Russell's Circumplex Model of Affect (1980)
 *    Reference: Russell (1980), Thayer's Activation-Deactivation model
 *    Measures activation level on the arousal dimension
 */

/**
 * Helper to get a score from Hume scores with case-insensitive matching
 */
function getScore(scores: HumeProsodyScores, ...keys: string[]): number {
  for (const key of keys) {
    // Try exact match first
    if (typeof scores[key] === "number") return scores[key] as number;
    
    // Try case-insensitive match
    const lowerKey = key.toLowerCase();
    for (const [k, v] of Object.entries(scores)) {
      if (k.toLowerCase() === lowerKey && typeof v === "number") {
        return v;
      }
    }
  }
  return 0; // Default to 0 if not found
}

/**
 * Weighted average helper
 */
function weightedAvg(values: Array<{ score: number; weight: number }>): number {
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = values.reduce((sum, v) => sum + v.score * v.weight, 0);
  return weightedSum / totalWeight;
}

/**
 * Clamp value to 0-100 range
 */
function clamp100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Map Hume emotion scores to clinical proxy metrics (0-100 scale)
 * 
 * Based on psychological research correlating specific emotions with clinical outcomes
 */
export function mapHumeToClinicalProxies(
  scores: HumeProsodyScores | null | undefined,
  localEnergy: number | null,
): ClinicalProxies {
  // If no Hume scores, derive from local audio only
  if (!scores || Object.keys(scores).length === 0) {
    const scaledEnergy = localEnergy != null ? clamp100(localEnergy * 300) : null;
    return {
      depressionRisk: null,
      anxietyScore: null,
      maniaScore: null,
      energyLevel: scaledEnergy,
    };
  }

  // =========================================================================
  // DEPRESSION RISK (Beck Depression Inventory correlates)
  // Weighted formula emphasizing core depressive emotions
  // =========================================================================
  const depressionFactors = weightedAvg([
    { score: getScore(scores, "Sadness"), weight: 3.0 },           // Primary indicator
    { score: getScore(scores, "Tiredness"), weight: 2.0 },         // Fatigue/anergia
    { score: getScore(scores, "Boredom"), weight: 1.5 },           // Anhedonia proxy
    { score: getScore(scores, "Disappointment"), weight: 1.5 },    // Hopelessness proxy
    { score: getScore(scores, "Guilt"), weight: 1.0 },             // Self-blame
    { score: getScore(scores, "Shame"), weight: 1.0 },             // Self-criticism
    { score: getScore(scores, "Contemplation"), weight: 0.5 },     // Rumination proxy
  ]);
  
  // Protective factors (reduce depression score)
  const depressionProtective = weightedAvg([
    { score: getScore(scores, "Joy"), weight: 2.0 },
    { score: getScore(scores, "Interest"), weight: 1.5 },
    { score: getScore(scores, "Excitement"), weight: 1.0 },
    { score: getScore(scores, "Amusement"), weight: 1.0 },
  ]);
  
  // Depression = Risk factors - 40% of protective factors (research shows partial buffering)
  const depressionRisk = clamp100((depressionFactors - depressionProtective * 0.4) * 100);

  // =========================================================================
  // ANXIETY SCORE (State-Trait Anxiety Inventory correlates)
  // Based on Spielberger's anxiety model and Hamilton Anxiety Scale
  // =========================================================================
  const anxietyScore = clamp100(weightedAvg([
    { score: getScore(scores, "Anxiety"), weight: 4.0 },           // Direct measure
    { score: getScore(scores, "Fear"), weight: 3.0 },              // Core anxiety component
    { score: getScore(scores, "Distress"), weight: 2.5 },          // General distress
    { score: getScore(scores, "Horror"), weight: 2.0 },            // Intense fear
    { score: getScore(scores, "Confusion"), weight: 1.5 },         // Cognitive anxiety
    { score: getScore(scores, "Awkwardness"), weight: 1.0 },       // Social anxiety proxy
    { score: getScore(scores, "Surprise"), weight: 0.5 },          // Startle/hypervigilance
  ]) * 100);

  // =========================================================================
  // MANIA/ACTIVATION SCORE (Young Mania Rating Scale correlates)
  // Elevated mood, irritability, increased activity, decreased need for sleep
  // =========================================================================
  const maniaFactors = weightedAvg([
    { score: getScore(scores, "Excitement"), weight: 3.0 },        // Elevated mood
    { score: getScore(scores, "Triumph"), weight: 2.5 },           // Grandiosity proxy
    { score: getScore(scores, "Anger"), weight: 2.0 },             // Irritability
    { score: getScore(scores, "Amusement"), weight: 1.5 },         // Elevated mood
    { score: getScore(scores, "Determination"), weight: 1.5 },     // Goal-directed activity
    { score: getScore(scores, "Pride"), weight: 1.0 },             // Inflated self-esteem
    { score: getScore(scores, "Desire"), weight: 1.0 },            // Increased goal pursuit
  ]);
  
  // Dampening factors (reduce mania score)
  const maniaDampening = weightedAvg([
    { score: getScore(scores, "Calmness"), weight: 2.0 },
    { score: getScore(scores, "Sadness"), weight: 1.5 },
    { score: getScore(scores, "Tiredness"), weight: 1.5 },
  ]);
  
  const maniaScore = clamp100((maniaFactors - maniaDampening * 0.3) * 100);

  // =========================================================================
  // ENERGY/AROUSAL LEVEL (Russell's Circumplex Model)
  // High arousal vs low arousal dimension
  // =========================================================================
  const highArousal = weightedAvg([
    { score: getScore(scores, "Excitement"), weight: 3.0 },
    { score: getScore(scores, "Interest"), weight: 2.5 },
    { score: getScore(scores, "Anger"), weight: 2.0 },
    { score: getScore(scores, "Fear"), weight: 2.0 },
    { score: getScore(scores, "Determination"), weight: 1.5 },
    { score: getScore(scores, "Surprise"), weight: 1.0 },
  ]);
  
  const lowArousal = weightedAvg([
    { score: getScore(scores, "Tiredness"), weight: 3.0 },
    { score: getScore(scores, "Boredom"), weight: 2.5 },
    { score: getScore(scores, "Calmness"), weight: 2.0 },
    { score: getScore(scores, "Sadness"), weight: 1.5 },
    { score: getScore(scores, "Contemplation"), weight: 1.0 },
  ]);
  
  // Combine Hume arousal with local audio energy
  const humeEnergy = (highArousal - lowArousal * 0.5 + 0.5); // Shift to 0-1 range
  const scaledLocalEnergy = localEnergy != null ? Math.min(1, localEnergy * 5) : null;
  
  let energyLevel: number;
  if (scaledLocalEnergy != null) {
    // Combine: 60% Hume emotional arousal, 40% local audio energy
    energyLevel = clamp100((humeEnergy * 0.6 + scaledLocalEnergy * 0.4) * 100);
  } else {
    energyLevel = clamp100(humeEnergy * 100);
  }

  return {
    depressionRisk,
    anxietyScore,
    maniaScore,
    energyLevel,
  };
}

/**
 * Compute valence (positive/negative sentiment) from Hume scores
 * Based on Russell's Circumplex Model valence dimension
 * Returns 0-100 where 50 is neutral, <50 is negative, >50 is positive
 */
export function computeValence(scores: HumeProsodyScores | null | undefined): number | null {
  if (!scores || Object.keys(scores).length === 0) return null;

  // Check if Hume provides valence directly
  const directValence = getScore(scores, "Valence", "valence");
  if (directValence > 0) {
    return clamp100(directValence * 100);
  }

  // Calculate from positive vs negative emotions (Russell's model)
  const positive = weightedAvg([
    { score: getScore(scores, "Joy"), weight: 3.0 },
    { score: getScore(scores, "Amusement"), weight: 2.0 },
    { score: getScore(scores, "Love"), weight: 2.0 },
    { score: getScore(scores, "Interest"), weight: 1.5 },
    { score: getScore(scores, "Satisfaction"), weight: 1.5 },
    { score: getScore(scores, "Admiration"), weight: 1.0 },
    { score: getScore(scores, "Calmness"), weight: 1.0 },
    { score: getScore(scores, "Pride"), weight: 1.0 },
  ]);

  const negative = weightedAvg([
    { score: getScore(scores, "Sadness"), weight: 3.0 },
    { score: getScore(scores, "Anger"), weight: 2.5 },
    { score: getScore(scores, "Fear"), weight: 2.0 },
    { score: getScore(scores, "Disgust"), weight: 2.0 },
    { score: getScore(scores, "Distress"), weight: 1.5 },
    { score: getScore(scores, "Anxiety"), weight: 1.5 },
    { score: getScore(scores, "Shame"), weight: 1.0 },
  ]);

  // Map to 0-100 scale where 50 is neutral
  const valence = 50 + (positive - negative) * 50;
  return clamp100(valence);
}

/**
 * Extract the dominant (highest scoring) emotion
 */
export function extractDominantEmotion(scores: HumeProsodyScores | null | undefined): string | null {
  if (!scores || Object.keys(scores).length === 0) return null;

  let bestLabel: string | null = null;
  let bestScore = -Infinity;

  for (const [key, value] of Object.entries(scores)) {
    // Skip meta-properties
    if (key.toLowerCase() === "arousal" || key.toLowerCase() === "valence") continue;
    if (typeof value !== "number" || isNaN(value)) continue;
    
    if (value > bestScore) {
      bestScore = value;
      bestLabel = key;
    }
  }

  return bestLabel;
}
