// Minimal Node.js runtime test — no external dependencies
export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    ok: true,
    runtime: "nodejs",
    env: {
      hasRedisUrl: !!process.env.REDIS_URL,
      hasStorageUrl: !!process.env.STORAGE_URL,
      hasYhKey: !!process.env.YH_FINANCE_KEY,
      hasCronSecret: !!process.env.CRON_SECRET,
    },
  }));
}
