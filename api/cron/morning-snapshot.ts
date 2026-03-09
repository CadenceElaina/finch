/**
 * Vercel Cron — Morning Market Snapshot
 * ──────────────────────────────────────
 * Runs at 5:00 AM ET (09:00 UTC) on weekdays via Vercel Cron.
 * Pre-fetches market indices, movers, and trending tickers,
 * then generates an AI market overview via Gemini so the first
 * user of the day gets instant data + AI summary with zero wait.
 *
 * Data flow:
 *   1. Fetches indices, movers, trending from YH Finance (3 API calls)
 *   2. Generates AI market overview via Gemini with Google Search grounding
 *   3. Stores the combined snapshot in Redis Cloud (KV) with 24-hour TTL
 *   4. Client reads from /api/snapshot → KV → instant response
 *
 * Schedule: "0 9 * * 1-5" (Mon-Fri 5 AM ET = 9 AM UTC during EDT)
 * Note: On Vercel free tier, cron execution may vary up to ~1 hour.
 *       During EST (Nov-Mar) this runs at 4 AM ET — still before anyone wakes up.
 */

import type { IncomingMessage, ServerResponse } from "http";
import Redis from "ioredis";
import { GoogleGenAI } from "@google/genai";

// Node.js runtime (not Edge) — required for TCP Redis connection
export const config = { runtime: "nodejs" };

const KV_SNAPSHOT_KEY = "market:snapshot";
const KV_SNAPSHOT_TTL = 24 * 60 * 60; // 24 hours — one snapshot per trading day

const YH_HOST = "yahoo-finance166.p.rapidapi.com";
const INDEX_SYMBOLS = "^DJI,^GSPC,^IXIC,^RUT,^VIX";

export interface MarketSnapshot {
  timestamp: string;
  indices: unknown;
  movers: unknown;
  trending: unknown;
  aiOverview: string | null;
  aiOverviewGeneratedAt: string | null;
  errors: string[];
}

function json(res: ServerResponse, status: number, body: unknown, extra?: Record<string, string>) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  if (extra) Object.entries(extra).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Verify this is called by Vercel Cron (Authorization header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return json(res, 401, { error: "Unauthorized" });
  }

  const apiKey = process.env.YH_FINANCE_KEY;
  if (!apiKey) {
    return json(res, 500, { error: "API key not configured" });
  }

  const headers = {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": YH_HOST,
  };

  const snapshot: MarketSnapshot = {
    timestamp: new Date().toISOString(),
    indices: null,
    movers: null,
    trending: null,
    aiOverview: null,
    aiOverviewGeneratedAt: null,
    errors: [],
  };

  // Fetch indices, movers, and trending in parallel (3 API calls)
  const [indicesRes, moversRes, trendingRes] = await Promise.allSettled([
    fetch(
      `https://${YH_HOST}/api/market/get-quote?region=US&symbols=${INDEX_SYMBOLS}`,
      { headers }
    ),
    fetch(
      `https://${YH_HOST}/api/market/get-day-gainers?region=US&count=25&start=0`,
      { headers }
    ),
    fetch(
      `https://${YH_HOST}/api/market/get-trending?region=US`,
      { headers }
    ),
  ]);

  if (indicesRes.status === "fulfilled" && indicesRes.value.ok) {
    snapshot.indices = await indicesRes.value.json();
  } else {
    snapshot.errors.push("indices fetch failed");
  }

  if (moversRes.status === "fulfilled" && moversRes.value.ok) {
    snapshot.movers = await moversRes.value.json();
  } else {
    snapshot.errors.push("movers fetch failed");
  }

  if (trendingRes.status === "fulfilled" && trendingRes.value.ok) {
    snapshot.trending = await trendingRes.value.json();
  } else {
    snapshot.errors.push("trending fetch failed");
  }

  // ── Generate AI Market Overview via Gemini ────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && snapshot.indices) {
    try {
      const genai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `Search the web for today's stock market data and provide a concise pre-market overview.

Include:
1. **Market Summary** — What happened at last close and any overnight/pre-market moves. List exact values and % changes for the Dow Jones, S&P 500, and Nasdaq.
2. **Key Drivers** — 2-3 major themes moving the market (earnings, economic data, geopolitics, sector rotation, etc.)
3. **What to Watch** — 1-2 upcoming catalysts for today's session

Format: Use **bold** for section headers and key numbers. Use bullet points. Keep it under 200 words. Be specific with real numbers and percentages.`;

      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a concise financial market analyst providing objective, data-driven pre-market briefings. Never give financial advice. Use phrases like 'The data suggests...' or 'Historically...'. Format numbers consistently: $XXX.XX for prices, X.XX% for percentages.",
          temperature: 0.4,
          topP: 0.8,
          maxOutputTokens: 4096,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = (response.text ?? "").trim();
      if (text && text.length > 50) {
        snapshot.aiOverview = text;
        snapshot.aiOverviewGeneratedAt = new Date().toISOString();
      } else {
        snapshot.errors.push("AI overview: empty or too short");
      }
    } catch (err) {
      snapshot.errors.push(`AI overview failed: ${String(err)}`);
    }
  }

  // Write to Redis if configured
  let kvWritten = false;
  let client: Redis | null = null;
  try {
    const url = process.env.REDIS_URL || process.env.STORAGE_URL || process.env.KV_URL;
    if (url) {
      client = new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 5000, lazyConnect: true });
      await client.connect();
      await client.set(KV_SNAPSHOT_KEY, JSON.stringify(snapshot), "EX", KV_SNAPSHOT_TTL);
      kvWritten = true;
    }
  } catch (err) {
    snapshot.errors.push(`KV write failed: ${String(err)}`);
  } finally {
    if (client) await client.quit().catch(() => {});
  }

  return json(res, 200, { ...snapshot, kvWritten }, {
    "Cache-Control": "s-maxage=900, stale-while-revalidate=600",
  });
}
