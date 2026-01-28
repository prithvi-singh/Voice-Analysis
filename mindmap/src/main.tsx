import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AudioProvider } from "./context/AudioContext";
import { HumeProvider } from "./context/HumeContext";
import { MetricsProvider } from "./context/MetricsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AudioProvider>
      <HumeProvider>
        <MetricsProvider>
          <App />
        </MetricsProvider>
      </HumeProvider>
    </AudioProvider>
  </StrictMode>,
);
