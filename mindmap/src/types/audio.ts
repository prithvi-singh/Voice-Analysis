export interface LocalAudioMetrics {
  volumeDb: number | null;
  pitchHz: number | null;
  jitter: number | null;
  energy: number | null;
}

export interface AudioChunk {
  samples: Float32Array;
  sampleRate: number;
  timestamp: number;
}

