// Hume API key helper for MVP only.
// In development, set VITE_HUME_API_KEY in a local `.env` file.

const RAW_HUME_KEY = import.meta.env.VITE_HUME_API_KEY ?? "HUME_API_KEY_PLACEHOLDER";

export const HUME_API_KEY = RAW_HUME_KEY;

export function assertHumeKeyPresent() {
  if (!HUME_API_KEY || HUME_API_KEY === "HUME_API_KEY_PLACEHOLDER") {
    throw new Error("Hume API key missing. Set VITE_HUME_API_KEY in your .env file.");
  }
}

