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
 * Generate content from Gemini (no web access).
 * For prompts that only need the data we already have in-app.
 */
export async function askGemini(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.4,
      topP: 0.8,
      maxOutputTokens: 1024,
    },
  });
  return response.text ?? "";
}

/**
 * Generate content with Google Search grounding.
 * Gemini can search the web for real-time market data, news, and prices.
 * Use for market overviews and stock snapshots where current info matters.
 */
export async function askGeminiGrounded(prompt: string): Promise<string> {
  // Grounded search can occasionally return empty text on the first try.
  // Retry up to 2 times with a short delay if that happens.
  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
        topP: 0.8,
        maxOutputTokens: 1024,
        tools: [{ googleSearch: {} }],
      },
    });
    const text = (response.text ?? "").trim();
    if (text) return text;
    // Empty response — wait briefly before retrying
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
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

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.4,
      topP: 0.8,
      maxOutputTokens: 1024,
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text ?? "";
}

/** Check if Gemini is configured (API key present) */
export function isGeminiConfigured(): boolean {
  return Boolean(API_KEY);
}
