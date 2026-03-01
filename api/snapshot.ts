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

import { getKv, disconnectKv, KV_SNAPSHOT_KEY } from "./_kv";

// Node.js runtime (not Edge) — required for TCP Redis connection
export const config = { runtime: "nodejs" };

/** Maximum snapshot age (in seconds) before client should treat it as stale */
const MAX_AGE_SECONDS = 15 * 60; // 15 minutes

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let kv;
  try {
    kv = await getKv();
  } catch {
    // Redis connection failed — fall through to 503
  }

  if (!kv) {
    return new Response(
      JSON.stringify({ error: "KV not configured" }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  try {
    const raw = await kv.get(KV_SNAPSHOT_KEY);

    if (!raw) {
      return new Response(
        JSON.stringify({ error: "No snapshot available" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Parse the snapshot (stored as JSON string)
    const snapshot = typeof raw === "string" ? JSON.parse(raw) : raw;
    const snapshotTime = new Date(snapshot.timestamp).getTime();
    const ageSeconds = Math.floor((Date.now() - snapshotTime) / 1000);

    return new Response(
      JSON.stringify({
        ...snapshot,
        age: ageSeconds,
        stale: ageSeconds > MAX_AGE_SECONDS,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Cache at Edge for 60s — reduces KV reads
          "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "KV read failed", detail: String(err) }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } finally {
    await disconnectKv();
  }
}
