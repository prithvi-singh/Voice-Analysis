import type { HumeProsodyScores } from "../types/hume";

/**
 * Normalize a raw Hume prosody streaming message into a flat scores map.
 * The exact shape depends on the Hume SDK; this function is intentionally
 * defensive and should be adjusted once you inspect real payloads.
 */
export function parseHumeProsodyMessage(raw: unknown): HumeProsodyScores | null {
  if (!raw || typeof raw !== "object") return null;

  const anyRaw = raw as any;

  // Common pattern: { predictions: [ { prosody: { predictions: [ { scores: { ... } } ] } } ] }
  const scores =
    anyRaw?.predictions?.[0]?.prosody?.predictions?.[0]?.scores ??
    anyRaw?.scores ??
    null;

  if (!scores || typeof scores !== "object") {
    return null;
  }

  const flat: HumeProsodyScores = {};

  for (const [key, value] of Object.entries(scores as Record<string, unknown>)) {
    if (typeof value === "number") {
      (flat as any)[key] = value;
    }
  }

  return flat;
}

