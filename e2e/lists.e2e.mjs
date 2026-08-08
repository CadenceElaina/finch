/**
 * Lists: seeding, sorting, and list-level CRUD.
 *
 * Every check here corresponds to a bug that shipped at some point, so a
 * failure means a real regression rather than a flaky expectation.
 */

import {
  launchBrowser,
  newPage,
  createReporter,
  gotoLists,
  openTab,
  tabNames,
  rowSymbols,
  sel,
} from "./harness.mjs";

const r = createReporter("lists");
const browser = await launchBrowser();
const page = await newPage(browser);

try {
  await gotoLists(page);

  // ── Seeding ──
  const tabs = await tabNames(page);
  r.check("seeds the four demo lists", tabs.length === 4, tabs.join(", "));

  // ── Default sort ──
  let syms = await rowSymbols(page);
  const ascending = [...syms].sort();
  r.check(
    "watchlist opens sorted by symbol",
    JSON.stringify(syms) === JSON.stringify(ascending),
    syms.slice(0, 4).join(",")
  );

  // ── Sort toggles ──
  await page.click(`.sortable-th:has-text("Symbol")`);
  await page.waitForTimeout(400);
  syms = await rowSymbols(page);
  r.check(
    "clicking a sorted column reverses it",
    JSON.stringify(syms) === JSON.stringify([...ascending].reverse()),
    syms.slice(0, 3).join(",")
  );

  await page.click(`.sortable-th:has-text("Price")`);
  await page.waitForTimeout(400);
  const prices = await page.$$eval(".perf-table tbody tr", (trs) =>
    trs
      .map((t) => t.querySelectorAll("td")[2]?.innerText ?? "")
      .filter((s) => s.includes("$"))
      .map((s) => parseFloat(s.replace(/[$,]/g, "")))
  );
  r.check(
    "price sorts ascending",
    prices.every((v, i) => i === 0 || prices[i - 1] <= v),
    prices.slice(0, 4).join(" ")
  );

  // Regression: a symbol the feed can't price used to render as a real $0.00.
  r.check("no row renders a placeholder $0.00 price", !prices.includes(0));

  // ── Remove a security ──
  await page.click(`.sortable-th:has-text("Symbol")`);
  await page.waitForTimeout(300);
  const before = await rowSymbols(page);
  const victim = before[0];
  await page.click(`.perf-table tbody tr:first-child ${sel.removeBtn}`);
  await page.waitForTimeout(900);
  const after = await rowSymbols(page);
  r.check("remove drops exactly one row", after.length === before.length - 1,
    `${before.length} -> ${after.length}`);
  r.check("remove drops the intended symbol", !after.includes(victim), `removed ${victim}`);

  const badge = await page.$eval(
    `${sel.tab}.active ${sel.tabCount}`,
    (e) => e.textContent.trim()
  );
  r.check("tab count follows the table", badge === String(after.length),
    `badge=${badge} rows=${after.length}`);

  // ── Persistence ──
  await gotoLists(page);
  const reloaded = await rowSymbols(page);
  r.check(
    "removal survives a reload",
    !reloaded.includes(victim) && reloaded.length === after.length,
    `${reloaded.length} rows`
  );

  // ── Create ──
  await page.click(`.lists-new-btn:has-text("New list")`);
  await page.waitForSelector(sel.nameModalInput, { timeout: 10_000 });
  await page.fill(sel.nameModalInput, "E2E Temp");
  // Regression: Save validated against the previous state value, so it stayed
  // disabled until the second keystroke.
  r.check(
    "Save enables on the first keystroke",
    await page.$eval(sel.nameModalSave, (b) => !b.disabled)
  );
  await page.keyboard.press("Enter"); // Regression: Enter did not submit.
  await page.waitForTimeout(1000);

  r.check("new list appears as a tab", (await tabNames(page)).includes("E2E Temp"));
  r.check(
    "new list becomes active",
    (await page.$eval(sel.title, (e) => e.textContent.trim())) === "E2E Temp"
  );
  r.check("empty list shows an empty state", !!(await page.$(".lists-empty-holdings")));

  // ── Rename ──
  await page.click(sel.kebab);
  await page.waitForTimeout(250);
  await page.click(`.dropdown-option:has-text("Rename")`);
  await page.waitForSelector(sel.nameModalInput, { timeout: 10_000 });
  r.check(
    "rename prefills the current name",
    (await page.$eval(sel.nameModalInput, (e) => e.value)) === "E2E Temp"
  );
  await page.fill(sel.nameModalInput, "E2E Renamed");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  r.check(
    "rename updates the heading",
    (await page.$eval(sel.title, (e) => e.textContent.trim())) === "E2E Renamed"
  );
  r.check("rename updates the tab", (await tabNames(page)).includes("E2E Renamed"));

  // ── Kebab dismissal ──
  // Regression: the menu could only be closed by picking an option, and it
  // survived tab switches — then acted on whichever list was selected next.
  await page.click(sel.kebab);
  await page.waitForTimeout(250);
  const opened = (await page.$$(".dropdown-content")).length === 1;
  await page.mouse.click(900, 700);
  await page.waitForTimeout(400);
  const closed = (await page.$$(".dropdown-content")).length === 0;
  r.check("kebab menu opens and dismisses on an outside click", opened && closed,
    `opened=${opened} closed=${closed}`);

  // ── Delete ──
  await page.click(sel.kebab);
  await page.waitForTimeout(250);
  await page.click(`.dropdown-option:has-text("Delete")`);
  await page.waitForSelector(sel.confirmOk, { timeout: 10_000 });
  await page.click(sel.confirmOk);
  await page.waitForTimeout(1000);
  const remaining = await tabNames(page);
  r.check("delete removes the tab", !remaining.includes("E2E Renamed"), remaining.join(", "));
  r.check("delete lands on a surviving list", remaining.length === 4, `${remaining.length} tabs`);

  // ── Hermetic + clean ──
  await openTab(page, "Core ETFs");
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
