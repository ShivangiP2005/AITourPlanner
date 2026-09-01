export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash"

// Verified active Gemini models with separate free quota pools
export const FALLBACK_MODELS: string[] = [
  GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-3.6-flash",
].filter((model, index, self) => Boolean(model) && self.indexOf(model) === index)
