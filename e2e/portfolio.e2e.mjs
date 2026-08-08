/**
 * Portfolios: adding holdings, the money math, and demo restore.
 */

import {
  launchBrowser,
  newPage,
  createReporter,
  gotoLists,
  openTab,
  rowSymbols,
  sel,
  BASE_URL,
} from "./harness.mjs";

const r = createReporter("portfolio");
const browser = await launchBrowser();
const page = await newPage(browser);

/** Read the holdings table into structured numbers. */
const readHoldings = (page) =>
  page.$$eval(".perf-table tbody tr", (trs) =>
    trs.map((tr) => {
      const td = [...tr.querySelectorAll("td")].map((c) => c.innerText.trim());
      const money = (s) => parseFloat((s || "").split("\n")[0].replace(/[$,+\s]/g, ""));
      return {
        sym: td[0],
        qty: parseFloat(td[2]),
        avgCost: money(td[3]),
        price: money(td[4]),
        total: money(td[6]),
        returnPct: parseFloat((td[7] || "").split("\n")[0].replace(/[+%\s]/g, "")),
        unpriced: /unavailable/i.test(tr.innerText),
      };
    })
  );

try {
  await gotoLists(page);
  await openTab(page, "Core ETFs");

  // ── Money math ──
  const holdings = (await readHoldings(page)).filter((h) => !h.unpriced);
  let mismatch = "";
  for (const h of holdings) {
    const expectedTotal = (h.price - h.avgCost) * h.qty;
    const expectedPct = ((h.price - h.avgCost) / h.avgCost) * 100;
    if (Math.abs(expectedTotal - h.total) > 1.5 || Math.abs(expectedPct - h.returnPct) > 0.6) {
      mismatch += `${h.sym}: total ${h.total} vs ${expectedTotal.toFixed(2)}, `;
    }
  }
  r.check("total and return equal qty x (price - cost)", !mismatch,
    mismatch || `${holdings.length} holdings`);

  // Regression: losses rendered without a minus sign, leaving red as the only cue.
  const losers = holdings.filter((h) => h.returnPct < 0);
  r.check(
    "losing holdings show a negative dollar total",
    losers.every((h) => h.total < 0),
    losers.map((h) => `${h.sym}:${h.total}`).join(" ") || "none in this list"
  );

  // Regression: fixture cost bases against live prices produced -61% on VO.
  r.check(
    "demo cost bases produce plausible returns",
    holdings.every((h) => Math.abs(h.returnPct) < 500),
    holdings.map((h) => `${h.sym}:${h.returnPct}%`).join(" ")
  );

  // ── Add a holding ──
  const before = await rowSymbols(page);
  await page.click(sel.addBtn);
  await page.waitForSelector(sel.tickerInput, { timeout: 10_000 });
  await page.fill(sel.tickerInput, "NFLX");
  // Regression: blur-on-click disabled Save mid-click, so the first press was
  // swallowed and the user had to click twice.
  await page.click(sel.tickerSave);
  await page.waitForSelector(sel.detailInputs, { timeout: 15_000 });
  r.check("one click validates and reveals the detail fields", true);

  // Regression: a holding of 0 shares at $0.00 used to be saveable.
  r.check(
    "Save is blocked until quantity and cost are entered",
    await page.$eval(sel.tickerSave, (b) => b.disabled)
  );
  const inputs = await page.$$(sel.detailInputs);
  await inputs[0].fill("10");
  await inputs[2].fill("500");
  await page.waitForTimeout(300);
  r.check(
    "Save enables once details are complete",
    await page.$eval(sel.tickerSave, (b) => !b.disabled)
  );
  await page.click(sel.tickerSave);
  await page.waitForTimeout(1500);

  const after = await rowSymbols(page);
  r.check("holding is added", after.includes("NFLX"), `${before.length} -> ${after.length}`);

  const added = (await readHoldings(page)).find((h) => h.sym === "NFLX");
  r.check("added holding keeps the entered quantity", added?.qty === 10, `qty=${added?.qty}`);
  r.check("added holding keeps the entered cost", added?.avgCost === 500, `cost=${added?.avgCost}`);

  // ── Duplicate guard ──
  await page.click(sel.addBtn);
  await page.waitForSelector(sel.tickerInput, { timeout: 10_000 });
  await page.fill(sel.tickerInput, "NFLX");
  await page.click(sel.tickerSave);
  await page.waitForTimeout(1200);
  const dupCount = (await rowSymbols(page)).filter((s) => s === "NFLX").length;
  r.check("duplicate symbol is rejected", dupCount === 1, `NFLX x${dupCount}`);
  const dupError = await page.$eval(".addToPortfolio-content", (e) => e.innerText);
  r.check("duplicate shows an explanation", /already in/i.test(dupError),
    dupError.replace(/\n/g, " ").slice(0, 80));
  await page.click(".addToPortfolio-buttons button:first-child"); // Cancel

  // ── Persistence + removal ──
  await gotoLists(page);
  await openTab(page, "Core ETFs");
  r.check("added holding survives a reload", (await rowSymbols(page)).includes("NFLX"));

  const idx = (await rowSymbols(page)).indexOf("NFLX");
  await page.click(`.perf-table tbody tr:nth-child(${idx + 1}) ${sel.removeBtn}`);
  await page.waitForTimeout(900);
  r.check("holding can be removed", !(await rowSymbols(page)).includes("NFLX"));

  // ── Restore demo data ──
  // Regression: restore stamped a stale seed version and skipped recalibration,
  // reintroducing the implausible cost bases it was meant to clear.
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const restore = await page.$('button:has-text("Restore")');
  r.check("Settings offers a restore control", !!restore);
  if (restore) {
    await restore.click();
    await page.waitForSelector(sel.confirmOk, { timeout: 10_000 });
    await page.click(sel.confirmOk);
    await page.waitForTimeout(1500);

    const seedVersion = await page.evaluate(() =>
      localStorage.getItem("finch_demo_portfolios_seeded")
    );
    r.check("restore stamps the current seed version", seedVersion === "3", `got ${seedVersion}`);

    await gotoLists(page);
    await openTab(page, "Core ETFs");
    const restored = (await readHoldings(page)).filter((h) => !h.unpriced);
    r.check(
      "restored demo recalibrates its cost bases",
      restored.length > 0 && restored.every((h) => h.returnPct > -50),
      restored.map((h) => `${h.sym}:${h.returnPct}%`).join(" ")
    );
  }

  // ── Hermetic + clean ──
  r.check(
    "demo mode makes no upstream calls",
    page.networkCalls.length === 0,
    page.networkCalls.slice(0, 2).join(" ")
  );
  r.check("no page errors", page.pageErrors.length === 0,
    [...new Set(page.pageErrors)].slice(0, 3).join(" | "));
} finally {
  await browser.close();
}

const { failed } = r.summary();
process.exit(failed ? 1 : 0);
