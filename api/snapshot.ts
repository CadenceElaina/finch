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
 *   errors: string[],
 *   age: number   // seconds since snapshot was created
 * }
 */

import type { IncomingMessage, ServerResponse } from "http";
import { getKv, disconnectKv, KV_SNAPSHOT_KEY } from "./_kv";

// Node.js runtime (not Edge) — required for TCP Redis connection
export const config = { runtime: "nodejs" };

/** Maximum snapshot age (in seconds) before client should treat it as stale */
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

  let kv;
  try {
    kv = await getKv();
  } catch {
    // Redis connection failed — fall through to 503
  }

  if (!kv) {
    return json(res, 503, { error: "KV not configured" }, { "Cache-Control": "no-store" });
  }

  try {
    const raw = await kv.get(KV_SNAPSHOT_KEY);

    if (!raw) {
      return json(res, 404, { error: "No snapshot available" }, { "Cache-Control": "no-store" });
    }

    // Parse the snapshot (stored as JSON string)
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
    await disconnectKv();
  }
}
