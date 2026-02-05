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

MindMap is a stunning voice analysis dashboard that combines **local acoustic features** with **Hume AI Expression Measurement** to surface emotion and mental-health–relevant biomarkers from recorded speech.

## ✨ Features

### Core Analysis
- 🎤 **Voice Upload & Analysis** – Drag-and-drop audio files
- 🧠 **AI Emotion Detection** – 48+ emotions via Hume AI
- 📊 **Clinical Proxy Metrics** – Depression, anxiety, mania, energy indicators
- 🎵 **Voice Quality Metrics** – Pitch, volume, jitter, stability

### Beautiful Visualizations
- 🌊 **Real-time Audio Visualizer** – Animated frequency bars
- 🎭 **Emotion Spectrum** – Top 16 emotions with color-coded progress
- 📈 **MindMap Trajectory** – Energy vs Valence scatter plot
- 🔊 **Voice Feed** – Waveform display with live metrics

### Modern Design
- 🌙 Dark glassmorphism UI with gradient accents
- ✨ Smooth animations and micro-interactions
- 📱 Fully responsive layout
- ♿ Accessibility-friendly focus states

> ⚠️ **Disclaimer**: This is a technical prototype, **not** a medical device. The clinical proxies are experimental and should **not** be used for diagnosis or clinical decision-making.

---

## 🖼️ Preview

```
┌─────────────────────────────────────────────────────────────────┐
│  🧠 MindMap Voice Analysis                                      │
├─────────────────────────────────────────────────────────────────┤
│  ░░░░░▓▓▓▓▓███████▓▓▓▓░░░░░  (Audio Visualizer)                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │ Control     │  │ Emotion Spectrum                        │  │
│  │ Panel       │  │                                         │  │
│  │             │  │ Joy ████████░░ 0.72                     │  │
│  │ ▣ Upload    │  │ Interest █████░░░░ 0.48                 │  │
│  │ ▷ Start     │  │ Excitement ████░░░░░ 0.41               │  │
│  └─────────────┘  │ ...                                     │  │
│  ┌─────────────┐  └─────────────────────────────────────────┘  │
│  │ Clinical    │  ┌────────────────┐  ┌────────────────────┐  │
│  │ Proxies     │  │ MindMap Plot   │  │ Voice Feed         │  │
│  │             │  │                │  │                    │  │
│  │ Energy 0.45 │  │    • •         │  │  ∿∿∿∿∿∿∿∿∿∿∿      │  │
│  │ Anxiety 0.22│  │   •   •        │  │  Pitch: 180Hz     │  │
│  └─────────────┘  └────────────────┘  └────────────────────┘  │
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
│  │  │  AudioVisualizer │ ControlPanel │ EmotionCloud    │  │   │
│  │  │  LiveMetrics │ MindMapPlot │ VoiceFeed            │  │   │
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
# Install frontend
cd mindmap
npm install

# Install backend
cd ../server
npm install
```

### 2. Configure

```bash
# server/.env
HUME_API_KEY=your_hume_api_key_here
PORT=4003
```

### 3. Run

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd mindmap && npm run dev
```

### 4. Open

Visit `http://localhost:5173` and upload an audio file!

---

## 📁 Project Structure

```
.
├── mindmap/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioVisualizer.tsx   # Animated frequency bars
│   │   │   ├── ControlPanel.tsx      # Upload & playback controls
│   │   │   ├── EmotionCloud.tsx      # Emotion spectrum display
│   │   │   ├── LiveMetrics.tsx       # Clinical proxy gauges
│   │   │   ├── MindMapPlot.tsx       # Energy/valence trajectory
│   │   │   └── VoiceFeed.tsx         # Waveform & voice stats
│   │   ├── context/
│   │   │   ├── AudioContext.tsx      # Web Audio processing
│   │   │   ├── HumeContext.tsx       # Hume API state
│   │   │   └── MetricsContext.tsx    # Aggregated metrics
│   │   ├── utils/
│   │   │   ├── clinicalMapping.ts    # Clinical proxy calculations
│   │   │   └── humeParsing.ts        # Hume response parsing
│   │   └── types/                    # TypeScript definitions
│   └── ...
│
└── server/                     # Express backend
    └── src/
        └── server.ts           # API with Hume integration
```

---

## 📊 Clinical Proxy Definitions

| Metric | Source Emotions | Description |
|--------|-----------------|-------------|
| **Energy** | Arousal, Excitement, Determination | Vocal energy level |
| **Depression Risk** | Sadness, Tiredness, Boredom, Disappointment | Low mood indicators |
| **Anxiety Score** | Anxiety, Fear, Distress, Confusion | Stress signals |
| **Mania Indicator** | Excitement, Anger, Amusement, Triumph | Elevated mood |

---

## 🛠️ Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS 4 (glassmorphism design)
- Recharts (scatter plots)
- WaveSurfer.js (waveforms)
- Pitchfinder (YIN algorithm)
- Lucide React (icons)

**Backend**
- Node.js + Express + TypeScript
- Multer (file uploads)
- Hume AI API integration

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

**Response:**
```json
{
  "rawScores": {
    "Joy": 0.72,
    "Sadness": 0.12,
    "Anxiety": 0.34
  },
  "clinical": {
    "depressionRisk": 0.15,
    "anxietyScore": 0.22,
    "maniaScore": 0.31,
    "energyLevel": 0.48
  },
  "processingTimeMs": 2340
}
```

---

## 🗺️ Roadmap

- [ ] Real-time streaming (WebSocket)
- [ ] Session history & comparisons
- [ ] Export analysis reports
- [ ] Multi-file batch analysis
- [ ] Transcript integration

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
