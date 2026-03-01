// Node.js runtime test — with Redis connection
export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import Redis from "ioredis";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");

  const url = process.env.REDIS_URL;
  if (!url) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "No REDIS_URL" }));
    return;
  }

  let client: Redis | null = null;
  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
    });
    await client.connect();
    await client.set("test:ping", "pong", "EX", 60);
    const val = await client.get("test:ping");
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, redis: "connected", testValue: val }));
  } catch (err: unknown) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Redis failed", detail: String(err) }));
  } finally {
    if (client) await client.quit().catch(() => {});
  }
}
