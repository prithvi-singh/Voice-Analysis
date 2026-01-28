import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["POST", "GET", "OPTIONS"],
  }),
);

const upload = multer({ storage: multer.memoryStorage() });

type ProsodyScores = Record<string, number>;

function deriveClinicalFromScores(scores: ProsodyScores) {
  const avg = (keys: string[]) => {
    const vals = keys.map((k) => scores[k]).filter((v) => typeof v === "number");
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const depressionRisk = avg(["Sadness", "Tiredness", "Boredom"]);
  const anxietyScore = avg(["Anxiety", "Fear", "Distress"]);
  const maniaScore = avg(["Excitement", "Anger", "Amusement"]);

  const energyLevel = avg(["Arousal", "Excitement"]);

  return {
    depressionRisk,
    anxietyScore,
    maniaScore,
    energyLevel,
  };
}

function collectEmotionScoresFromPredictions(predictions: any): ProsodyScores {
  const scores: ProsodyScores = {};

  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }

    if (Array.isArray(node.emotions)) {
      for (const emo of node.emotions) {
        if (emo && typeof emo.name === "string" && typeof emo.score === "number") {
          const current = scores[emo.name] ?? 0;
          if (emo.score > current) {
            scores[emo.name] = emo.score;
          }
        }
      }
    }

    for (const value of Object.values(node)) {
      visit(value);
    }
  };

  visit(predictions);
  return scores;
}

app.post("/analyze", upload.single("audio"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No audio file provided." });
    }

    const apiKey = process.env.HUME_API_KEY;
    if (!apiKey || apiKey === "HUME_API_KEY_PLACEHOLDER") {
      return res.status(500).json({ error: "Hume API key is not configured on the server." });
    }

    // 1. Start an Expression Measurement job with the uploaded audio file.
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

    const jobResp = await fetch("https://api.hume.ai/v0/batch/jobs", {
      method: "POST",
      headers: {
        "X-Hume-Api-Key": apiKey,
        // form-data will set proper Content-Type with boundary
        ...form.getHeaders(),
      } as any,
      body: form as any,
    });

    if (!jobResp.ok) {
      const text = await jobResp.text();
      console.error("Hume job start failed:", jobResp.status, text);
      return res.status(502).json({ error: "Failed to start Hume job." });
    }

    const jobJson: any = await jobResp.json();
    const jobId: string | undefined = jobJson.job_id;
    if (!jobId) {
      console.error("Hume job start response missing job_id:", jobJson);
      return res.status(502).json({ error: "Invalid response from Hume job start." });
    }

    // 2. Poll for predictions (simple short-polling for MVP).
    let predictions: any = null;
    const maxAttempts = 20;
    const delayMs = 1500;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const predResp = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`, {
        method: "GET",
        headers: {
          "X-Hume-Api-Key": apiKey,
          accept: "application/json; charset=utf-8",
        },
      });

      if (predResp.status === 400) {
        // Job is still in progress – wait and poll again.
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      if (!predResp.ok) {
        const text = await predResp.text();
        console.error("Hume predictions fetch failed:", predResp.status, text);
        return res.status(502).json({ error: "Failed to fetch Hume predictions." });
      }

      const body: any = await predResp.json();
      // When job is done, predictions is a non-empty array.
      if (Array.isArray(body) && body.length > 0) {
        predictions = body;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (!predictions) {
      return res.status(504).json({ error: "Timed out waiting for Hume predictions." });
    }

    // 3. Collapse Hume's rich emotion structure into a flat score map.
    const rawScores = collectEmotionScoresFromPredictions(predictions);
    const clinical = deriveClinicalFromScores(rawScores);

    return res.json({
      rawScores,
      clinical,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to analyze audio." });
  }
});

app.listen(port, () => {
  console.log(`MindMap backend listening on http://localhost:${port}`);
});

