/**
 * AiContext — global state for AI features.
 * Tracks credits remaining, chat history, and cached summaries.
 * Chat history persists across route navigations within the same session.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { askGemini, askGeminiGrounded, askGeminiChat, isGeminiConfigured } from "../config/gemini";
import {
  getCreditsRemaining,
  getMaxCredits,
  hasCredits,
  useCredit,
} from "../services/aiCredits";

// ── Types ──────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface AiContextValue {
  /** Whether the Gemini API key is configured */
  configured: boolean;
  /** Number of credits remaining today */
  creditsRemaining: number;
  /** Max daily credits */
  maxCredits: number;
  /** Send a standalone prompt (no web access). Costs 1 credit. */
  generate: (prompt: string) => Promise<string>;
  /** Send a grounded prompt with Google Search for real-time data. Costs 1 credit. */
  generateGrounded: (prompt: string) => Promise<string>;
  /** Send a chat message with history context + Google Search. Costs 1 credit. */
  chat: (symbol: string, message: string) => Promise<string>;
  /** Get chat history for a symbol */
  getChatHistory: (symbol: string) => ChatMessage[];
  /** Clear chat history for a symbol */
  clearChat: (symbol: string) => void;
}

const AiContext = createContext<AiContextValue | undefined>(undefined);

// ── Provider ───────────────────────────────────────

export const AiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [credits, setCredits] = useState(getCreditsRemaining);
  // Chat histories keyed by symbol
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});

  const refreshCredits = useCallback(() => {
    setCredits(getCreditsRemaining());
  }, []);

  const generate = useCallback(async (prompt: string): Promise<string> => {
    if (!isGeminiConfigured()) throw new Error("Gemini API key not configured");
    if (!hasCredits()) throw new Error("Daily AI credit limit reached. Resets at midnight.");
    useCredit();
    refreshCredits();
    try {
      return await askGemini(prompt);
    } catch (err) {
      throw err;
    }
  }, [refreshCredits]);

  const generateGrounded = useCallback(async (prompt: string): Promise<string> => {
    if (!isGeminiConfigured()) throw new Error("Gemini API key not configured");
    if (!hasCredits()) throw new Error("Daily AI credit limit reached. Resets at midnight.");
    useCredit();
    refreshCredits();
    try {
      return await askGeminiGrounded(prompt);
    } catch (err) {
      throw err;
    }
  }, [refreshCredits]);

  const chat = useCallback(async (symbol: string, message: string): Promise<string> => {
    if (!isGeminiConfigured()) throw new Error("Gemini API key not configured");
    if (!hasCredits()) throw new Error("Daily AI credit limit reached. Resets at midnight.");
    useCredit();
    refreshCredits();

    const history = chatHistories[symbol] ?? [];
    const response = await askGeminiChat(history, message);

    setChatHistories((prev) => ({
      ...prev,
      [symbol]: [
        ...(prev[symbol] ?? []),
        { role: "user" as const, text: message },
        { role: "model" as const, text: response },
      ],
    }));

    return response;
  }, [chatHistories, refreshCredits]);

  const getChatHistory = useCallback((symbol: string): ChatMessage[] => {
    return chatHistories[symbol] ?? [];
  }, [chatHistories]);

  const clearChat = useCallback((symbol: string) => {
    setChatHistories((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
  }, []);

  const value = useMemo<AiContextValue>(() => ({
    configured: isGeminiConfigured(),
    creditsRemaining: credits,
    maxCredits: getMaxCredits(),
    generate,
    generateGrounded,
    chat,
    getChatHistory,
    clearChat,
  }), [credits, generate, generateGrounded, chat, getChatHistory, clearChat]);

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
};

// ── Hook ───────────────────────────────────────────

export function useAi(): AiContextValue {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error("useAi must be used within <AiProvider>");
  return ctx;
}
