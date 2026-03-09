/**
 * Vercel Edge Function — Market Snapshot Reader
 * ──────────────────────────────────────────────
 * Returns the cached morning snapshot from Redis Cloud (KV).
 * If KV is unavailable or the snapshot is missing, returns 404.
 *
 * Usage: Client calls GET /api/snapshot on app load.
 *        If data is fresh (<15 min), use it directly → 0 API calls.
 *        If stale or missing, client falls back to live API fetch.
 *
 * Response shape:
 * {
 *   timestamp: string,
 *   indices: { quoteResponse: { result: [...] } },
 *   movers: { finance: { result: [...] } },
 *   trending: { finance: { result: [...] } },
 *   aiOverview: string | null,
 *   aiOverviewGeneratedAt: string | null,
 *   errors: string[],
 *   age: number   // seconds since snapshot was created
 * }
 */

import type { IncomingMessage, ServerResponse } from "http";
import Redis from "ioredis";

// Node.js runtime (not Edge) — required for TCP Redis connection
export const config = { runtime: "nodejs" };

const KV_SNAPSHOT_KEY = "market:snapshot";
const MAX_AGE_SECONDS = 15 * 60; // 15 minutes

function json(res: ServerResponse, status: number, body: unknown, extra?: Record<string, string>) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  if (extra) Object.entries(extra).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const url = process.env.REDIS_URL || process.env.STORAGE_URL || process.env.KV_URL;
  if (!url) {
    return json(res, 503, { error: "KV not configured" }, { "Cache-Control": "no-store" });
  }

  let client: Redis | null = null;
  try {
    client = new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 5000, lazyConnect: true });
    await client.connect();

    const raw = await client.get(KV_SNAPSHOT_KEY);

    if (!raw) {
      return json(res, 404, { error: "No snapshot available" }, { "Cache-Control": "no-store" });
    }

    const snapshot = typeof raw === "string" ? JSON.parse(raw) : raw;
    const snapshotTime = new Date(snapshot.timestamp).getTime();
    const ageSeconds = Math.floor((Date.now() - snapshotTime) / 1000);

    return json(res, 200, { ...snapshot, age: ageSeconds, stale: ageSeconds > MAX_AGE_SECONDS }, {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
      "Access-Control-Allow-Origin": "*",
    });
  } catch (err) {
    return json(res, 500, { error: "KV read failed", detail: String(err) }, { "Cache-Control": "no-store" });
  } finally {
    if (client) await client.quit().catch(() => {});
  }
}
