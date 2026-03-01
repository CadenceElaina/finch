/**
 * Gemini API client configuration.
 * Uses Gemini 1.5 Flash for speed and free-tier compatibility.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

const genAI = new GoogleGenerativeAI(API_KEY);

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

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: SYSTEM_INSTRUCTION,
  generationConfig: {
    temperature: 0.4,
    topP: 0.8,
    maxOutputTokens: 1024,
  },
});

/**
 * Generate content from Gemini. Returns the text response.
 * Throws on failure — callers should handle errors.
 */
export async function askGemini(prompt: string): Promise<string> {
  const result = await geminiModel.generateContent(prompt);
  const response = result.response;
  return response.text();
}

/**
 * Generate content with chat history context.
 * Used for the research chat feature where follow-up context matters.
 */
export async function askGeminiChat(
  history: { role: "user" | "model"; text: string }[],
  newMessage: string
): Promise<string> {
  const chat = geminiModel.startChat({
    history: history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
  });
  const result = await chat.sendMessage(newMessage);
  return result.response.text();
}

/** Check if Gemini is configured (API key present) */
export function isGeminiConfigured(): boolean {
  return Boolean(API_KEY);
}
