# MindMap – Voice Analysis

<div align="center">

![MindMap Logo](https://via.placeholder.com/120x120/0f172a/34d399?text=🧠)

**AI-powered voice emotion and mental health analysis**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Hume AI](https://img.shields.io/badge/Hume_AI-Powered-10B981)](https://hume.ai)

</div>

---

MindMap is a voice analysis dashboard that combines **local acoustic features** with **Hume AI Expression Measurement** to surface emotion and mental-health–relevant biomarkers from recorded speech.

## ✨ Features

### Core Analysis
- 🎤 **Voice Upload & Analysis** – Drag-and-drop audio files (MP3, WAV, M4A)
- 🧠 **AI Emotion Detection** – 48+ emotions via Hume AI with normalized percentages
- 📊 **Clinical Proxy Metrics** – Depression, anxiety, mania, energy indicators
- 🎵 **Voice Quality Metrics** – Pitch, volume, jitter, stability analysis

### Intuitive Visualizations
- 🌊 **Real-time Audio Visualizer** – Animated frequency bars synced to playback
- 🎯 **Mood Meter** – Overall sentiment from negative to positive
- 🥧 **Emotion Pie Chart** – Normalized distribution (adds up to 100%)
- 📊 **Emotion Bars** – Top emotions with intensity labels (Strong/Moderate/Mild)
- 🔊 **Voice Feed** – Waveform display with real-time voice metrics

### Modern Design
- 🌙 Dark glassmorphism UI with gradient accents
- ✨ Smooth animations and micro-interactions
- 📱 Fully responsive layout
- 🎨 Color-coded emotions for quick interpretation

> ⚠️ **Disclaimer**: This is a technical prototype, **not** a medical device. The clinical proxies are experimental and should **not** be used for diagnosis or clinical decision-making.

---

## 🖼️ Preview

```
┌─────────────────────────────────────────────────────────────────┐
│  🧠 MindMap Voice Analysis                    [Powered by Hume] │
├─────────────────────────────────────────────────────────────────┤
│  ░░▓▓▓███████████████████████▓▓▓░░  (Audio Visualizer)         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │ Control     │  │ Emotional Analysis                      │  │
│  │ Panel       │  │                                         │  │
│  │             │  │ Overall Mood: [───────●────] Positive   │  │
│  │ 🎵 audio.mp3│  │                                         │  │
│  │ ▷ Analyze   │  │ 🥧 Pie Chart    Joy ████████ 28%       │  │
│  │             │  │    [  28%  ]    Surprise ████ 18%       │  │
│  │ ✓ Complete  │  │    [ Joy  ]    Interest ███ 15%        │  │
│  └─────────────┘  │                 ...more                 │  │
│  ┌─────────────┐  └─────────────────────────────────────────┘  │
│  │ Clinical    │  ┌─────────────────────────────────────────┐  │
│  │ Proxies     │  │ Voice Feed                              │  │
│  │             │  │                                         │  │
│  │ Energy  45% │  │  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿               │  │
│  │ Anxiety 22% │  │  Pitch: 180Hz │ Stability: 94%         │  │
│  └─────────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React + Vite                          │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────────┐  │   │
│  │  │ Audio     │ │ Hume      │ │ Metrics               │  │   │
│  │  │ Context   │ │ Context   │ │ Context               │  │   │
│  │  └─────┬─────┘ └─────┬─────┘ └───────────┬───────────┘  │   │
│  │        │             │                   │               │   │
│  │  ┌─────▼─────────────▼───────────────────▼───────────┐  │   │
│  │  │              UI Components                         │  │   │
│  │  │  AudioVisualizer │ ControlPanel │ LiveMetrics     │  │   │
│  │  │  EmotionalAnalysis │ VoiceFeed                    │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ POST /analyze
┌───────────────────────────▼─────────────────────────────────────┐
│                         BACKEND                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Express Server                           │   │
│  │                                                          │   │
│  │  /health  - Server status                               │   │
│  │  /analyze - Audio → Hume AI → Emotion scores            │   │
│  └───────────────────────────┬─────────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                        HUME AI                                  │
│  Expression Measurement API (Prosody Model)                     │
│  Returns: 48+ emotion scores per audio segment                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Hume AI API key ([Get one free](https://hume.ai))

### 1. Clone & Install

```bash
git clone https://github.com/prithvi-singh/Voice-Analysis.git
cd Voice-Analysis

# Install frontend
cd mindmap
npm install

# Install backend
cd ../server
npm install
```

### 2. Configure

Create `server/.env`:
```env
HUME_API_KEY=your_hume_api_key_here
PORT=4003
```

### 3. Run

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd mindmap
npm run dev
```

### 4. Open

Visit `http://localhost:5173` and upload an audio file with clear speech!

---

## 📁 Project Structure

```
.
├── mindmap/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioVisualizer.tsx    # Animated frequency bars
│   │   │   ├── ControlPanel.tsx       # Upload & playback controls
│   │   │   ├── EmotionalAnalysis.tsx  # Unified emotion display
│   │   │   ├── LiveMetrics.tsx        # Clinical proxy gauges
│   │   │   └── VoiceFeed.tsx          # Waveform & voice stats
│   │   ├── context/
│   │   │   ├── AudioContext.tsx       # Web Audio processing
│   │   │   ├── HumeContext.tsx        # Hume API state
│   │   │   └── MetricsContext.tsx     # Aggregated metrics
│   │   ├── utils/
│   │   │   ├── clinicalMapping.ts     # Clinical proxy calculations
│   │   │   └── humeParsing.ts         # Hume response parsing
│   │   └── types/                     # TypeScript definitions
│   └── ...
│
└── server/                     # Express backend
    └── src/
        └── server.ts           # API with Hume integration
```

---

## 📊 How Emotion Percentages Work

All emotion scores are **normalized to add up to 100%**, making them easy to interpret:

| Raw Hume Scores | → | Normalized Display |
|-----------------|---|-------------------|
| Joy: 0.56       |   | Joy: 28%          |
| Surprise: 0.36  |   | Surprise: 18%     |
| Interest: 0.30  |   | Interest: 15%     |
| ...             |   | ...               |
| **Total: 2.0+** |   | **Total: 100%**   |

Each percentage represents that emotion's **share of the total emotional expression** detected in the voice.

---

## 📊 Clinical Proxy Definitions

| Metric | Source Emotions | Description |
|--------|-----------------|-------------|
| **Energy** | Arousal, Excitement, Determination | Vocal energy level (0-100%) |
| **Depression Risk** | Sadness, Tiredness, Boredom, Disappointment | Low mood indicators |
| **Anxiety Score** | Anxiety, Fear, Distress, Confusion | Stress signals |
| **Mania Indicator** | Excitement, Anger, Amusement, Triumph | Elevated mood |

---

## 🛠️ Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS 4 (glassmorphism design)
- Recharts (charts)
- WaveSurfer.js (waveforms)
- Pitchfinder (YIN pitch detection)
- Lucide React (icons)

**Backend**
- Node.js + Express + TypeScript
- Multer (file uploads)
- Hume AI Expression Measurement API

---

## 🔗 API Reference

### `GET /health`

Health check endpoint.

```json
{
  "status": "ok",
  "humeConfigured": true,
  "version": "1.0.0"
}
```

### `POST /analyze`

Analyze audio file for emotions.

**Request:** `multipart/form-data` with `audio` field

**Success Response:**
```json
{
  "rawScores": {
    "Joy": 0.72,
    "Sadness": 0.12,
    "Anxiety": 0.34
  },
  "clinical": {
    "depressionRisk": 15,
    "anxietyScore": 22,
    "maniaScore": 31,
    "energyLevel": 48
  },
  "processingTimeMs": 2340
}
```

**Error Response (no speech detected):**
```json
{
  "error": "No speech detected",
  "details": "Could not detect clear speech in this audio. Try a recording with clearer voice."
}
```

---

## 🗺️ Roadmap

- [ ] Real-time streaming via WebSocket
- [ ] Session history & comparisons
- [ ] Export analysis reports (PDF/JSON)
- [ ] Multi-file batch analysis
- [ ] Transcript integration
- [ ] Mobile app version

---

## ⚠️ Important Disclaimer

This is an **experimental prototype** for exploration purposes only.

- **NOT** a medical device
- **NOT** for clinical diagnosis
- **NOT** for treatment decisions

The clinical proxies are heuristic calculations based on emotional expression scores and have **not** been validated against clinical instruments.

---

## 📄 License

MIT

---

<div align="center">

Built with ❤️ using [Hume AI](https://hume.ai) • [React](https://react.dev) • [Tailwind CSS](https://tailwindcss.com)

</div>
