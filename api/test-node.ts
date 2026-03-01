// Node.js runtime test — import from _kv module
export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import { getKv, disconnectKv, KV_SNAPSHOT_KEY } from "./lib/kv";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");

  try {
    const kv = await getKv();
    if (!kv) {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: "KV not configured" }));
      return;
    }

    await kv.set("test:ping", "pong", "EX", 60);
    const val = await kv.get("test:ping");
    const snapshot = await kv.get(KV_SNAPSHOT_KEY);
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, testValue: val, hasSnapshot: !!snapshot }));
  } catch (err: unknown) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Failed", detail: String(err) }));
  } finally {
    await disconnectKv();
  }
}
