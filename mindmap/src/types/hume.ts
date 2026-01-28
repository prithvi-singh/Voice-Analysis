export interface HumeProsodyScores {
  // Emotion label -> score between 0 and 1
  [emotion: string]: number | undefined;
  arousal?: number;
  valence?: number;
}

