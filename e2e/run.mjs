/**
 * E2E entry point: `npm run test:e2e`.
 *
 * Boots the Vite dev server (unless E2E_BASE_URL points somewhere already
 * running), runs each suite in its own process so one crash can't hide the
 * rest, then tears the server down and exits non-zero if anything failed.
 *
 * Deliberately not part of `npm run build` — the build runs on Vercel, which
 * has no browser and no dev server.
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SUITES = ["lists.e2e.mjs", "portfolio.e2e.mjs"];

const externalTarget = process.env.E2E_BASE_URL;
const baseUrl = externalTarget ?? "http://localhost:5173";

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  return false;
}

const run = (cmd, args, opts = {}) =>
  new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) => resolve(code ?? 1));
  });

let server = null;
let exitCode = 0;

try {
  if (!externalTarget) {
    console.log("starting dev server…");
    // detached so the whole process group can be killed later — npm does not
    // forward SIGTERM to the vite process it spawns.
    server = spawn("npm", ["run", "dev"], { stdio: "ignore", detached: true });
    if (!(await waitForServer(baseUrl))) {
      console.error(`dev server did not come up at ${baseUrl}`);
      process.exit(1);
    }
  }
  console.log(`running e2e against ${baseUrl}\n`);

  for (const suite of SUITES) {
    console.log(`── ${suite} ${"─".repeat(Math.max(0, 50 - suite.length))}`);
    const code = await run(process.execPath, [join(here, suite)], {
      env: { ...process.env, E2E_BASE_URL: baseUrl },
    });
    if (code !== 0) exitCode = code;
    console.log("");
  }
} finally {
  if (server?.pid) {
    // npm doesn't forward signals to vite, so kill the whole process group.
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
}

console.log(exitCode === 0 ? "e2e: all suites passed" : "e2e: failures above");
process.exit(exitCode);
