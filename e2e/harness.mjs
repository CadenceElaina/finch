/**
 * Minimal end-to-end harness.
 *
 * Uses `playwright-core` against a Chrome that is already on the machine, so
 * `npm install` never downloads a browser — important because this package is
 * installed during the Vercel build, where a browser download would be dead
 * weight (and the suite itself never runs there).
 *
 * Suites run with demo mode enabled. That keeps them hermetic and
 * deterministic, and — since the upstream plan allows only 500 calls a month —
 * stops a test run from spending real quota.
 */

import { chromium } from "playwright-core";

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

/**
 * Launch Chrome. `channel: "chrome"` lets Playwright locate the system install
 * on macOS/Linux/Windows; CHROME_PATH overrides it for unusual setups.
 */
export async function launchBrowser() {
  const explicitPath = process.env.CHROME_PATH;
  try {
    return await chromium.launch({
      ...(explicitPath ? { executablePath: explicitPath } : { channel: "chrome" }),
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  } catch (err) {
    throw new Error(
      "Could not launch Chrome for the e2e run.\n" +
        "Install Google Chrome, or point CHROME_PATH at an existing binary.\n" +
        `Underlying error: ${err.message}`
    );
  }
}

/**
 * A page with demo mode primed before any app code runs, so the very first
 * quote lookup is served from fixtures rather than the network.
 */
export async function newPage(browser, { demo = true } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1100 },
  });
  const page = await context.newPage();

  if (demo) {
    await page.addInitScript(() => {
      localStorage.setItem(
        "finch_demo_mode",
        JSON.stringify({ active: true, date: new Date().toISOString().slice(0, 10) })
      );
    });
  }

  // Fail loudly on anything that reaches the network during a demo-mode run.
  const networkCalls = [];
  page.on("request", (r) => {
    const url = r.url();
    if (/rapidapi\.com|\/api\//.test(url)) networkCalls.push(url);
  });
  page.networkCalls = networkCalls;

  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(`PAGEERROR: ${e.message}`));
  page.on("console", (m) => {
    const text = m.text();
    if (
      m.type() === "error" &&
      !text.includes("Failed to load resource") &&
      !text.includes("404")
    ) {
      pageErrors.push(`CONSOLE: ${text.slice(0, 200)}`);
    }
  });
  page.pageErrors = pageErrors;

  return page;
}

/** Collects results so a suite can report once and exit with a useful code. */
export function createReporter(suiteName) {
  const results = [];
  return {
    check(name, pass, detail = "") {
      results.push({ name, pass: !!pass, detail });
      const label = pass ? "  ok  " : " FAIL ";
      console.log(`${label} ${name}${detail ? `  — ${detail}` : ""}`);
      return !!pass;
    },
    summary() {
      const failed = results.filter((r) => !r.pass);
      console.log(
        `\n${suiteName}: ${results.length - failed.length}/${results.length} checks passed`
      );
      for (const f of failed) console.log(`  FAIL ${f.name}: ${f.detail}`);
      return { total: results.length, failed: failed.length };
    },
  };
}

/** Common selectors, kept in one place so markup changes touch one file. */
export const sel = {
  tab: ".lists-tab",
  tabName: ".lists-tab .lists-tab-name",
  tabCount: ".lists-tab-count",
  title: ".lists-title",
  table: ".perf-table",
  rowBadge: ".perf-table tbody .perf-symbol-badge",
  removeBtn: ".perf-remove-btn",
  kebab: ".lists-kebab",
  addBtn: ".lists-add-btn",
  nameModalInput: ".new-portfolio-modal input[type='text']",
  nameModalSave: ".new-portfolio-modal .modal-footer button:last-child",
  confirmOk: ".confirm-modal-ok-btn",
  tickerInput: ".addToPortfolio-input input",
  tickerSave: ".addToPortfolio-buttons button:last-child",
  detailInputs: ".addToPortfolio-row input",
  unpriced: ".perf-unpriced",
};

export const tabNames = (page) =>
  page.$$eval(sel.tabName, (n) => n.map((e) => e.textContent.trim()));

export const rowSymbols = (page) =>
  page.$$eval(sel.rowBadge, (n) => n.map((e) => e.textContent.trim()));

/** Open the Lists page and wait for the first table to paint. */
export async function gotoLists(page) {
  await page.goto(`${BASE_URL}/watchlist`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(sel.table, { timeout: 30_000 });
  // Demo-portfolio calibration resolves right after the first quote read.
  await page.waitForTimeout(1500);
}

export async function openTab(page, name) {
  await page.click(`${sel.tab}:has-text("${name}")`);
  await page.waitForSelector(sel.table, { timeout: 20_000 });
  await page.waitForTimeout(800);
}
