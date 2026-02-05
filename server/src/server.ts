import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";
import path from "path";

dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || "4000", 10);
const HUME_API_URL = "https://api.hume.ai/v0/batch/jobs";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
];

// Polling configuration
const POLLING_CONFIG = {
  maxAttempts: 40, // Increased for longer files
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 1.2,
};

// ============================================================================
// TYPES
// ============================================================================

interface ProsodyScores {
  [emotion: string]: number;
}

interface ClinicalScores {
  depressionRisk: number;
  anxietyScore: number;
  maniaScore: number;
  energyLevel: number;
}

interface HumeJobResponse {
  job_id?: string;
}

interface HumeEmotion {
  name: string;
  score: number;
}

interface AnalysisResponse {
  rawScores: ProsodyScores;
  clinical: ClinicalScores;
  processingTimeMs: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Derive clinical mental health proxy scores from emotion scores
 */
function deriveClinicalFromScores(scores: ProsodyScores): ClinicalScores {
  const avg = (keys: string[]): number => {
    const vals = keys.map((k) => scores[k]).filter((v): v is number => typeof v === "number");
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  return {
    depressionRisk: avg(["Sadness", "Tiredness", "Boredom", "Disappointment"]),
    anxietyScore: avg(["Anxiety", "Fear", "Distress", "Confusion"]),
    maniaScore: avg(["Excitement", "Anger", "Amusement", "Triumph"]),
    energyLevel: avg(["Arousal", "Excitement", "Determination"]),
  };
}

/**
 * Extract emotion scores from Hume API batch predictions
 * Handles the nested structure: predictions[].results.predictions[].models.prosody.grouped_predictions[].predictions[].emotions[]
 */
function collectEmotionScoresFromPredictions(predictions: unknown): ProsodyScores {
  const scores: ProsodyScores = {};

  // Debug: Log the raw predictions structure (truncated)
  console.log("[Debug] Raw predictions:", JSON.stringify(predictions, null, 2).slice(0, 3000));

  const extractEmotions = (emotions: HumeEmotion[]): void => {
    for (const emo of emotions) {
      if (emo && typeof emo.name === "string" && typeof emo.score === "number") {
        const current = scores[emo.name] ?? 0;
        if (emo.score > current) {
          scores[emo.name] = emo.score;
        }
      }
    }
  };

  // Type guard for checking arrays of emotions
  const isEmotionsArray = (arr: unknown): arr is HumeEmotion[] => {
    return Array.isArray(arr) && arr.length > 0 && 
           typeof (arr[0] as HumeEmotion)?.name === "string" &&
           typeof (arr[0] as HumeEmotion)?.score === "number";
  };

  try {
    // Handle array response (batch API format)
    if (Array.isArray(predictions)) {
      for (const item of predictions) {
        const fileResult = item as Record<string, unknown>;
        
        // Path 1: item.results.predictions[].models.prosody.grouped_predictions[].predictions[].emotions[]
        const results = fileResult.results as Record<string, unknown> | undefined;
        if (results?.predictions && Array.isArray(results.predictions)) {
          for (const pred of results.predictions as Array<Record<string, unknown>>) {
            const models = pred.models as Record<string, unknown> | undefined;
            const prosody = models?.prosody as Record<string, unknown> | undefined;
            
            // Handle grouped_predictions structure
            if (prosody?.grouped_predictions && Array.isArray(prosody.grouped_predictions)) {
              for (const group of prosody.grouped_predictions as Array<Record<string, unknown>>) {
                if (group.predictions && Array.isArray(group.predictions)) {
                  for (const p of group.predictions as Array<Record<string, unknown>>) {
                    if (isEmotionsArray(p.emotions)) {
                      console.log("[Debug] Found emotions in grouped_predictions");
                      extractEmotions(p.emotions);
                    }
                  }
                }
              }
            }
            
            // Handle flat predictions structure
            if (prosody?.predictions && Array.isArray(prosody.predictions)) {
              for (const p of prosody.predictions as Array<Record<string, unknown>>) {
                if (isEmotionsArray(p.emotions)) {
                  console.log("[Debug] Found emotions in prosody.predictions");
                  extractEmotions(p.emotions);
                }
              }
            }
          }
        }

        // Path 2: Direct emotions in the item (older API format)
        if (isEmotionsArray(fileResult.emotions)) {
          console.log("[Debug] Found emotions directly in item");
          extractEmotions(fileResult.emotions);
        }

        // Path 3: item.predictions[].emotions[] (alternative format)
        if (fileResult.predictions && Array.isArray(fileResult.predictions)) {
          for (const pred of fileResult.predictions as Array<Record<string, unknown>>) {
            if (isEmotionsArray(pred.emotions)) {
              console.log("[Debug] Found emotions in item.predictions");
              extractEmotions(pred.emotions);
            }
          }
        }
      }
    }

    // Fallback: recursive search if nothing found yet
    if (Object.keys(scores).length === 0) {
      console.log("[Debug] No emotions found, trying recursive search...");
      const recursiveFind = (node: unknown): void => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) {
          // Check if this is an emotions array
          if (isEmotionsArray(node)) {
            console.log("[Debug] Found emotions array via recursive search, length:", node.length);
            extractEmotions(node);
          } else {
            for (const item of node) recursiveFind(item);
          }
          return;
        }
        const obj = node as Record<string, unknown>;
        for (const value of Object.values(obj)) {
          recursiveFind(value);
        }
      };
      recursiveFind(predictions);
    }
  } catch (err) {
    console.error("[Debug] Error parsing predictions:", err);
  }

  console.log(`[Debug] Extracted ${Object.keys(scores).length} emotions:`, Object.keys(scores).slice(0, 10));
  return scores;
}

/**
 * Sleep utility with exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate next polling delay with exponential backoff
 */
function getNextDelay(attempt: number): number {
  const delay = POLLING_CONFIG.initialDelayMs * Math.pow(POLLING_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, POLLING_CONFIG.maxDelayMs);
}

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();

// Trust proxy for production deployments behind reverse proxy
app.set("trust proxy", 1);

// CORS configuration
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["POST", "GET", "OPTIONS"],
      credentials: true,
    }),
  );
}

// File upload configuration with validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: MP3, WAV, M4A, OGG, WebM, FLAC`));
    }
  },
});

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * Health check endpoint
 */
app.get("/health", (_req: Request, res: Response) => {
  const hasApiKey = !!process.env.HUME_API_KEY && process.env.HUME_API_KEY !== "HUME_API_KEY_PLACEHOLDER";
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    humeConfigured: hasApiKey,
    version: "1.0.0",
  });
});

/**
 * Main analysis endpoint
 */
app.post("/analyze", upload.single("audio"), async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    // Validate file upload
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No audio file provided." } as ErrorResponse);
      return;
    }

    console.log(`[Analysis] Processing file: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`);

    // Validate API key
    const apiKey = process.env.HUME_API_KEY;
    if (!apiKey || apiKey === "HUME_API_KEY_PLACEHOLDER") {
      res.status(500).json({
        error: "Hume API key is not configured on the server.",
        details: "Please set the HUME_API_KEY environment variable.",
      } as ErrorResponse);
      return;
    }

    // 1. Start an Expression Measurement job with the uploaded audio file
    const form = new FormData();
    form.append(
      "json",
      JSON.stringify({
        models: {
          prosody: {},
        },
      }),
    );
    form.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    console.log("[Analysis] Submitting job to Hume AI...");

    const jobResp = await fetch(HUME_API_URL, {
      method: "POST",
      headers: {
        "X-Hume-Api-Key": apiKey,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!jobResp.ok) {
      const text = await jobResp.text();
      console.error("[Analysis] Hume job start failed:", jobResp.status, text);
      res.status(502).json({
        error: "Failed to start Hume analysis job.",
        details: `Hume API returned status ${jobResp.status}`,
      } as ErrorResponse);
      return;
    }

    const jobJson = (await jobResp.json()) as HumeJobResponse;
    const jobId = jobJson.job_id;

    if (!jobId) {
      console.error("[Analysis] Invalid Hume response:", jobJson);
      res.status(502).json({
        error: "Invalid response from Hume API.",
        details: "Missing job_id in response",
      } as ErrorResponse);
      return;
    }

    console.log(`[Analysis] Job started: ${jobId}`);

    // 2. Poll for job completion, then fetch predictions
    let predictions: unknown = null;

    for (let attempt = 0; attempt < POLLING_CONFIG.maxAttempts; attempt++) {
      // First check job status
      const statusResp = await fetch(`${HUME_API_URL}/${jobId}`, {
        method: "GET",
        headers: {
          "X-Hume-Api-Key": apiKey,
          accept: "application/json; charset=utf-8",
        },
      });

      if (statusResp.ok) {
        const statusBody = await statusResp.json() as Record<string, unknown>;
        const state = statusBody.state as Record<string, unknown> | undefined;
        const status = state?.status || statusBody.status;
        console.log(`[Analysis] Job status: ${status}`);

        if (status === "FAILED") {
          const message = state?.message || "Unknown error";
          console.error("[Analysis] Job failed:", message);
          res.status(502).json({
            error: "Hume analysis job failed.",
            details: String(message),
          } as ErrorResponse);
          return;
        }

        if (status !== "COMPLETED") {
          const delay = getNextDelay(attempt);
          console.log(`[Analysis] Job ${status}, waiting ${delay}ms (attempt ${attempt + 1}/${POLLING_CONFIG.maxAttempts})`);
          await sleep(delay);
          continue;
        }
      }

      // Job completed, fetch predictions
      const predResp = await fetch(`${HUME_API_URL}/${jobId}/predictions`, {
        method: "GET",
        headers: {
          "X-Hume-Api-Key": apiKey,
          accept: "application/json; charset=utf-8",
        },
      });

      if (predResp.status === 400) {
        // Job is still in progress – wait and poll again
        const delay = getNextDelay(attempt);
        console.log(`[Analysis] Predictions not ready, waiting ${delay}ms (attempt ${attempt + 1}/${POLLING_CONFIG.maxAttempts})`);
        await sleep(delay);
        continue;
      }

      if (!predResp.ok) {
        const text = await predResp.text();
        console.error("[Analysis] Predictions fetch failed:", predResp.status, text);
        res.status(502).json({
          error: "Failed to fetch analysis results.",
          details: `Hume API returned status ${predResp.status}`,
        } as ErrorResponse);
        return;
      }

      const body = await predResp.json();
      console.log("[Debug] Predictions response type:", typeof body, Array.isArray(body) ? `array(${body.length})` : "object");
      
      // Log first item structure for debugging
      if (Array.isArray(body) && body.length > 0) {
        console.log("[Debug] First prediction item keys:", Object.keys(body[0]));
        const firstItem = body[0] as Record<string, unknown>;
        if (firstItem.results && typeof firstItem.results === "object") {
          console.log("[Debug] results keys:", Object.keys(firstItem.results as object));
          const results = firstItem.results as Record<string, unknown>;
          if (results.predictions && Array.isArray(results.predictions)) {
            console.log("[Debug] results.predictions length:", results.predictions.length);
            if (results.predictions.length > 0) {
              console.log("[Debug] First result prediction keys:", Object.keys(results.predictions[0] as object));
            }
          }
        }
      }

      // When job is done, predictions is a non-empty array
      if (Array.isArray(body) && body.length > 0) {
        predictions = body;
        console.log("[Debug] Got predictions array with", body.length, "items");
        break;
      }
      
      // Some Hume API versions return an object with predictions inside
      if (body && typeof body === "object" && !Array.isArray(body)) {
        const bodyObj = body as Record<string, unknown>;
        if (bodyObj.predictions || bodyObj.results || bodyObj.source) {
          predictions = body;
          console.log("[Debug] Got predictions object with keys:", Object.keys(bodyObj));
          break;
        }
      }

      const delay = getNextDelay(attempt);
      await sleep(delay);
    }

    if (!predictions) {
      console.error("[Analysis] Timed out waiting for predictions");
      res.status(504).json({
        error: "Analysis timed out.",
        details: "The Hume API took too long to process the audio file. Try a shorter file.",
      } as ErrorResponse);
      return;
    }

    // 3. Check for errors and analyze structure
    let humeError: string | null = null;
    
    if (Array.isArray(predictions)) {
      for (const item of predictions as Array<Record<string, unknown>>) {
        const results = item.results as Record<string, unknown> | undefined;
        if (results?.errors && Array.isArray(results.errors) && results.errors.length > 0) {
          console.error("[Analysis] Hume returned errors:", JSON.stringify(results.errors));
          // Extract the error message for the user
          const firstError = results.errors[0] as Record<string, unknown> | undefined;
          if (firstError?.message) {
            humeError = String(firstError.message);
          }
        }
        if (results?.predictions && Array.isArray(results.predictions)) {
          console.log("[Analysis] Found", results.predictions.length, "file predictions");
          for (const pred of results.predictions as Array<Record<string, unknown>>) {
            console.log("[Analysis] File:", pred.file);
            const models = pred.models as Record<string, unknown> | undefined;
            if (models) {
              console.log("[Analysis] Available models:", Object.keys(models));
              if (models.prosody) {
                const prosody = models.prosody as Record<string, unknown>;
                console.log("[Analysis] Prosody keys:", Object.keys(prosody));
                if (prosody.grouped_predictions && Array.isArray(prosody.grouped_predictions)) {
                  console.log("[Analysis] Grouped predictions count:", prosody.grouped_predictions.length);
                  for (const gp of prosody.grouped_predictions as Array<Record<string, unknown>>) {
                    if (gp.predictions && Array.isArray(gp.predictions)) {
                      console.log("[Analysis] Predictions in group:", gp.predictions.length);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // 4. Extract and return results
    const rawScores = collectEmotionScoresFromPredictions(predictions);
    const clinical = deriveClinicalFromScores(rawScores);
    const processingTimeMs = Date.now() - startTime;

    console.log(`[Analysis] Complete in ${processingTimeMs}ms, found ${Object.keys(rawScores).length} emotions`);
    
    // If no emotions found and there was a Hume error, return it as an error
    if (Object.keys(rawScores).length === 0) {
      if (humeError) {
        // Translate common Hume errors to user-friendly messages
        let userMessage = humeError;
        if (humeError.includes("transcript confidence")) {
          userMessage = "Could not detect clear speech in this audio. Try a recording with clearer voice or less background noise.";
        } else if (humeError.includes("unable to transcribe")) {
          userMessage = "Unable to transcribe audio. Please ensure the file contains clear speech.";
        }
        
        console.log("[Analysis] Returning error due to Hume issue:", userMessage);
        res.status(422).json({
          error: "No speech detected",
          details: userMessage,
        } as ErrorResponse);
        return;
      }
      
      console.log("[Analysis] WARNING: No emotions found. The audio may not contain detectable speech.");
    }

    const response: AnalysisResponse = {
      rawScores,
      clinical,
      processingTimeMs,
    };

    res.json(response);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    console.error("[Analysis] Error:", errorMessage);
    res.status(500).json({
      error: "Failed to analyze audio.",
      details: errorMessage,
    } as ErrorResponse);
  }
});

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

// Serve built React app
const publicDir = path.resolve(__dirname, "../../mindmap/dist");
app.use(express.static(publicDir));

// SPA fallback
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.message);

  if (err.message.includes("Invalid file type")) {
    res.status(400).json({ error: err.message } as ErrorResponse);
    return;
  }

  if (err.message.includes("File too large")) {
    res.status(400).json({
      error: "File too large.",
      details: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    } as ErrorResponse);
    return;
  }

  res.status(500).json({ error: "Internal server error." } as ErrorResponse);
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🧠 MindMap Voice Analysis Server                          ║
║                                                              ║
║   Local:   http://localhost:${PORT}                           ║
║   Health:  http://localhost:${PORT}/health                    ║
║                                                              ║
║   Hume AI: ${process.env.HUME_API_KEY ? "✓ Configured" : "✗ Not configured"}                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n[Server] SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("[Server] Closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n[Server] SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("[Server] Closed.");
    process.exit(0);
  });
});
