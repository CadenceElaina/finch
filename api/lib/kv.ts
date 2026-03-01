/**
 * Shared Redis (KV) client for Vercel Serverless Functions
 * ─────────────────────────────────────────────────────────
 * Uses Redis Cloud via the Vercel Marketplace integration.
 *
 * Required env vars (auto-injected by Vercel when Redis is linked):
 *   - REDIS_URL  (or STORAGE_URL depending on the integration prefix)
 *
 * If not configured, `getKv()` returns null — callers should
 * fall back gracefully (e.g. serve from Edge Cache only).
 *
 * NOTE: Uses Node.js runtime (not Edge) because Redis
 * requires TCP sockets which Edge Runtime doesn't support.
 */

import Redis from "ioredis";

let _client: Redis | null = null;

/**
 * Returns a connected Redis client, or null if env vars aren't set.
 * Reuses the same client within a single serverless invocation.
 */
export async function getKv(): Promise<Redis | null> {
  if (_client && _client.status === "ready") return _client;

  const url =
    process.env.REDIS_URL ||
    process.env.STORAGE_URL ||
    process.env.KV_URL;

  if (!url) return null;

  try {
    _client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
    });
    await _client.connect();
    return _client;
  } catch {
    _client = null;
    return null;
  }
}

/**
 * Disconnect the Redis client. Call at the end of each handler
 * to avoid connection leaks in serverless functions.
 */
export async function disconnectKv(): Promise<void> {
  if (_client && _client.status === "ready") {
    await _client.quit();
    _client = null;
  }
}

// ── KV key constants ─────────────────────────────────────

/** Morning snapshot (indices + movers + trending). Written by cron. */
export const KV_SNAPSHOT_KEY = "market:snapshot";

/** TTL for the snapshot in seconds (15 minutes). */
export const KV_SNAPSHOT_TTL = 15 * 60;
