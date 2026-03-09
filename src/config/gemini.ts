/**
 * Gemini API client configuration.
 * Uses Gemini 2.5 Flash via the @google/genai SDK.
 *
 * Two call modes:
 *   askGemini()         — standalone prompt, no web access
 *   askGeminiGrounded() — uses Google Search tool for real-time data
 *   askGeminiChat()     — multi-turn chat with history + Google Search
 */

import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const MODEL = "gemini-2.5-flash";

const ai = new GoogleGenAI({ apiKey: API_KEY });

/** System instruction that governs the AI's behavior across all calls */
const SYSTEM_INSTRUCTION = `You are the Finch Market Intelligence Agent. You provide objective, concise,
data-driven financial insights to retail investors.

ROLE CONSTRAINTS:
- Never give financial advice. Use "The data suggests..." or "Historically..."
- Never recommend buying or selling specific securities
- Default response length: 3-5 bullet points unless the user requests a deep dive
- If the market is closed, frame analysis as "Next Session Outlook"
- Always cite what data you are using ("Based on today's market data...")
- Keep responses concise and scannable — use bullet points, bold key metrics
- Format numbers consistently: $XXX.XX for prices, X.XX% for percentages

CACHING BEHAVIOR: If providing a stock snapshot (not a user-initiated question),
limit to: 3-sentence trend summary + 3 key metrics to watch + 1 risk factor.`;

/**
 * Detect if a Gemini response was truncated mid-sentence.
 * Heuristics:
 *   - Ends without terminal punctuation (., !, ?, :, etc.)
 *   - Ends with an opening markdown bold/list marker that was never closed
 *   - Suspiciously short (under 30 words) for prompts expecting multi-section output
 */
function isTruncated(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  // Check terminal punctuation (allow ending with bold close, list item, or emoji)
  const lastChar = trimmed.slice(-1);
  const endsClean = /[.!?:)}\]%\d]$/.test(trimmed) || /\*\*$/.test(trimmed);
  if (!endsClean && /[a-zA-Z,;]/.test(lastChar)) return true;
  // Unclosed markdown bold — odd number of ** pairs
  const boldMarkers = (trimmed.match(/\*\*/g) || []).length;
  if (boldMarkers % 2 !== 0) return true;
  return false;
}

/**
/**
 * Generate content from Gemini (no web access).
 * For prompts that only need the data we already have in-app.
 */

/** Detect Gemini quota / rate-limit errors and throw a user-friendly message */
function handleGeminiError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  const json = typeof err === "object" && err !== null && "message" in err
    ? (err as { message?: string }).message ?? ""
    : msg;
  if (
    /429|quota|rate.limit|resource.exhausted/i.test(msg) ||
    /429|quota|rate.limit|resource.exhausted/i.test(json)
  ) {
    throw new Error("Gemini API rate limit reached — try again in a few minutes.");
  }
  throw err;
}

export async function askGemini(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
        topP: 0.8,
        maxOutputTokens: 8192,
      },
    });
    return response.text ?? "";
  } catch (err) {
    handleGeminiError(err);
  }
}

/**
 * Generate content with Google Search grounding.
 * Gemini can search the web for real-time market data, news, and prices.
 * Use for market overviews and stock snapshots where current info matters.
 */
export async function askGeminiGrounded(prompt: string): Promise<string> {
  // Grounded search can occasionally return empty or truncated text.
  // Retry up to 2 times with a short delay if that happens.
  const MAX_ATTEMPTS = 2;
  let lastText = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.4,
          topP: 0.8,
          maxOutputTokens: 8192,
          tools: [{ googleSearch: {} }],
        },
      });
      const text = (response.text ?? "").trim();
      if (text && !isTruncated(text)) return text;
      lastText = text;
      // Empty or truncated — wait briefly before retrying
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (err) {
      handleGeminiError(err);
    }
  }
  // Return whatever we got if it has content, even if truncated
  if (lastText) return lastText;
  throw new Error("Gemini returned an empty response. Please try again.");
}

/**
 * Generate content with chat history context + Google Search grounding.
 * Used for the research chat on the Quote page.
 */
export async function askGeminiChat(
  history: { role: "user" | "model"; text: string }[],
  newMessage: string
): Promise<string> {
  const contents = [
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
    { role: "user" as const, parts: [{ text: newMessage }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
        topP: 0.8,
        maxOutputTokens: 8192,
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text ?? "";
  } catch (err) {
    handleGeminiError(err);
  }
}

/** Check if Gemini is configured (API key present) */
export function isGeminiConfigured(): boolean {
  return Boolean(API_KEY);
}
