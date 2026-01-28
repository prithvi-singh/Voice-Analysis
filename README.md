# MindMap – Voice Analysis MVP

MindMap is an experimental voice analysis dashboard that combines **local acoustic features** with **Hume Expression Measurement** to surface mental‑health–relevant biomarkers from recorded speech.

- **Input**: Uploaded audio file (no live mic in this MVP).
- **Local analysis**: Volume, pitch, jitter, energy.
- **Cloud analysis (Hume)**: High‑dimensional emotion scores (e.g. Anxiety, Joy, Tiredness, Awe).
- **Outputs**:
  - Emotion spectrum (top Hume emotions + raw scores).
  - Clinical proxy metrics (Depression risk, Anxiety, Mania, Energy).

> ⚠️ This is a **technical prototype**, **not** a medical device and **not** for clinical decision‑making.

---

## Architecture Overview

The project is split into two apps:

- `mindmap/` – React + Vite frontend (TypeScript, Tailwind, Recharts).
- `server/` – Node + Express backend (TypeScript) that talks to Hume’s Expression Measurement API.

Data flow:

1. User uploads an audio file in the React app.
2. Frontend:
   - Plays audio locally via Web Audio.
   - Computes volume, pitch, jitter, and energy in real time.
   - Sends the file to the backend via `POST /analyze`.
3. Backend:
   - Uses the Hume API key to start an **Expression Measurement batch job** for the audio.
   - Polls until predictions are ready.
   - Collapses Hume’s rich emotion output into a flat `rawScores` map (`{ [emotionName]: score }`).
   - Returns `rawScores` plus derived clinical proxies back to the frontend.
4. Frontend:
   - Stores everything in React context (`AudioProvider`, `HumeProvider`, `MetricsProvider`).
   - Renders:
     - **Emotion spectrum**: top emotions + scores as bars.
     - **Live metrics**: depression risk, anxiety, mania, energy, dominant emotion.

All session data lives in memory only. No database or persistent storage.

---

## Tech Stack

**Frontend (`mindmap/`):**

- React 18 + Vite + TypeScript
- Tailwind CSS (v4) + `lucide-react` (icons)
- `recharts` (for future visualizations)
- `wavesurfer.js` (waveform container, currently de‑emphasized)
- `pitchfinder` (local pitch estimation)

**Backend (`server/`):**

- Node.js + Express
- TypeScript + `ts-node-dev`
- `multer` (file upload)
- `node-fetch` + `form-data` (calling Hume REST API)
- Hume Expression Measurement API (batch jobs)

---

## Getting Started

### 1. Clone the repo

```bash
git clone <YOUR_REPO_URL> mindmap-voice-analysis
cd mindmap-voice-analysis
```

### 2. Backend setup (`server/`)

```bash
cd server
npm install
```

Create `.env` (or copy from `.env.example` if present):

```env
HUME_API_KEY=HUME_API_KEY_PLACEHOLDER
PORT=4003
```

- Replace `HUME_API_KEY_PLACEHOLDER` with your real Hume API key from the Hume dashboard.
- You can change `PORT` if needed; be sure to keep frontend in sync.

Run the backend in dev mode:

```bash
npm run dev
```

You should see:

```text
MindMap backend listening on http://localhost:4003
```

### 3. Frontend setup (`mindmap/`)

In a second terminal:

```bash
cd mindmap
npm install
```

Create `.env` (or copy from `.env.example`):

```env
VITE_HUME_API_KEY=HUME_API_KEY_PLACEHOLDER
```

> The frontend key is only used for future pure‑client integrations. The current MVP routes all Hume calls through the backend and will work as long as the backend key is set.

Run the dev server:

```bash
npm run dev
```

Visit `http://localhost:5173`.

---

## Using the App

1. Start both servers:
   - `server/`: `npm run dev`
   - `mindmap/`: `npm run dev`
2. Go to `http://localhost:5173`.
3. In the **Control Panel**:
   - Click **Choose file** and select a voice recording (WAV/MP3; 15–60 seconds works well).
   - Verify the file name and duration appear.
   - Click **Start analysis**.
4. What you should see:
   - **Hume status** → `connected`.
   - After a short delay (Hume batch job time):
     - **Emotion spectrum** fills with labels like *Anxiety*, *Joy*, *Tiredness*, each with a 0–1 score and a colored bar.
     - **Live Metrics** shows non‑zero values for:
       - Energy
       - Depression risk
       - Anxiety
       - Mania
       - Dominant emotion

If nothing appears:

- Check the browser dev console (network tab) for `POST /analyze` errors.
- Check the backend terminal for any `Hume ... failed` messages.

---

## Environment Variables

### Frontend (`mindmap/.env`)

- `VITE_HUME_API_KEY` – optional, placeholder for future direct Hume usage in the browser.

### Backend (`server/.env`)

- `HUME_API_KEY` – **required**. Your Hume API key.
- `PORT` – port for the Express server (default `4003`).

> **Security note**: `.env` files are ignored by git. Never commit your real keys.

---

## Key Concepts & Clinical Proxies

The frontend maps Hume scores to simple mental‑health–adjacent proxies.

Given Hume emotion scores such as `Sadness`, `Tiredness`, `Boredom`, `Anxiety`, etc.:

- **Depression risk**  
  \[
  \text{Depression Risk} = \frac{\text{Sadness} + \text{Tiredness} + \text{Boredom}}{3}
  \]

- **Anxiety score**  
  \[
  \text{Anxiety} = \frac{\text{Anxiety} + \text{Fear} + \text{Distress}}{3}
  \]

- **Mania score**  
  \[
  \text{Mania} = \frac{\text{Excitement} + \text{Anger} + \text{Amusement}}{3}
  \]

- **Energy level** – blend of local audio energy (volume) and Hume arousal.

These are **heuristic proxies**, not validated clinical instruments.

---

## Project Structure

```text
.
├── mindmap/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── LiveMetrics.tsx
│   │   │   └── EmotionCloud.tsx
│   │   ├── context/
│   │   │   ├── AudioContext.tsx
│   │   │   ├── HumeContext.tsx
│   │   │   └── MetricsContext.tsx
│   │   ├── utils/
│   │   │   ├── clinicalMapping.ts
│   │   │   └── humeParsing.ts
│   │   └── types/
│   │       ├── audio.ts
│   │       ├── hume.ts
│   │       └── session.ts
│   └── ...
└── server/                  # Node + Express backend
    ├── src/
    │   └── server.ts       # /analyze endpoint, Hume integration
    └── ...
```

---

## Roadmap / Ideas

- Replace batch polling with **Expression Measurement streaming** for lower latency.
- Add:
  - Timeline of emotion trajectories.
  - Session summaries (e.g., average depression/anxiety over the clip).
  - Export of raw Hume scores for research.
- Integrate transcript + language‑based metrics (when available).

---

## Disclaimer

This repository is for **exploration and prototyping only**.  
It is **not** intended for diagnosis, treatment, or any clinical decision‑making.

