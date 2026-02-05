# MindMap - Voice Analysis

A stunning, real-time voice emotion and mental health analysis application powered by Hume AI.

![MindMap Preview](https://via.placeholder.com/800x400/0f172a/34d399?text=MindMap+Voice+Analysis)

## Features

### 🎯 Core Functionality
- **Voice Upload & Analysis** - Drag-and-drop audio files for instant analysis
- **Real-time Emotion Detection** - Powered by Hume AI's prosody model
- **Clinical Proxy Metrics** - Depression, anxiety, mania, and energy indicators
- **Voice Quality Analysis** - Pitch, volume, jitter, and stability tracking

### 📊 Visualizations
- **Audio Visualizer** - Beautiful animated waveform that responds to audio
- **Emotion Spectrum** - Top 16 emotions with animated progress bars
- **MindMap Trajectory** - Energy vs Valence scatter plot over time
- **Voice Feed** - Waveform display with real-time voice metrics

### 🎨 Design
- Modern glassmorphism UI with subtle gradients
- Dark theme optimized for extended use
- Smooth animations and micro-interactions
- Fully responsive layout
- Accessibility-friendly focus states

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, custom glassmorphism
- **Visualization**: Recharts, WaveSurfer.js, Canvas API
- **Audio Processing**: Web Audio API, Pitchfinder (YIN algorithm)
- **AI**: Hume AI Expression Measurement API
- **Backend**: Express.js, TypeScript

## Quick Start

### Prerequisites
- Node.js 18+
- A Hume AI API key ([Get one here](https://hume.ai))

### Installation

1. **Clone and install frontend dependencies**
   ```bash
   cd mindmap
   npm install
   ```

2. **Install server dependencies**
   ```bash
   cd ../server
   npm install
   ```

3. **Configure environment**
   ```bash
   # In server/.env
   HUME_API_KEY=your_hume_api_key_here
   PORT=4003
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd mindmap
   npm run dev
   ```

5. **Open** `http://localhost:5173` in your browser

## Project Structure

```
├── mindmap/                # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── AudioVisualizer.tsx    # Animated audio bars
│   │   │   ├── ControlPanel.tsx       # File upload & controls
│   │   │   ├── EmotionCloud.tsx       # Emotion spectrum display
│   │   │   ├── LiveMetrics.tsx        # Clinical proxy gauges
│   │   │   ├── MindMapPlot.tsx        # Trajectory scatter plot
│   │   │   └── VoiceFeed.tsx          # Waveform & voice stats
│   │   ├── context/        # React context providers
│   │   │   ├── AudioContext.tsx       # Audio playback & processing
│   │   │   ├── HumeContext.tsx        # Hume API state
│   │   │   └── MetricsContext.tsx     # Aggregated metrics
│   │   ├── types/          # TypeScript definitions
│   │   ├── utils/          # Helper functions
│   │   └── config/         # Configuration
│   └── ...
│
├── server/                 # Express backend
│   └── src/
│       └── server.ts       # API server with Hume integration
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check with API status |
| `POST` | `/analyze` | Upload audio for emotion analysis |

### POST /analyze

**Request:**
- `Content-Type: multipart/form-data`
- `audio`: Audio file (MP3, WAV, M4A, OGG, WebM, FLAC)

**Response:**
```json
{
  "rawScores": {
    "Joy": 0.234,
    "Sadness": 0.123,
    ...
  },
  "clinical": {
    "depressionRisk": 0.15,
    "anxietyScore": 0.22,
    "maniaScore": 0.18,
    "energyLevel": 0.45
  },
  "processingTimeMs": 2340
}
```

## Clinical Proxy Definitions

| Metric | Source Emotions | Description |
|--------|-----------------|-------------|
| **Energy Level** | Arousal, Excitement, Determination | Overall vocal energy |
| **Depression Risk** | Sadness, Tiredness, Boredom, Disappointment | Low mood indicators |
| **Anxiety Score** | Anxiety, Fear, Distress, Confusion | Stress and worry signals |
| **Mania Indicator** | Excitement, Anger, Amusement, Triumph | Elevated mood markers |

> ⚠️ **Disclaimer**: These metrics are experimental proxies derived from emotional expression analysis. They are NOT clinical diagnoses and should not be used for medical purposes.

## Development

```bash
# Run frontend dev server
cd mindmap && npm run dev

# Run backend dev server
cd server && npm run dev

# Build for production
cd mindmap && npm run build

# Type check
npm run lint
```

## License

MIT

---

Built with ❤️ using [Hume AI](https://hume.ai) • [React](https://react.dev) • [Tailwind CSS](https://tailwindcss.com)
