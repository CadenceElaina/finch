/**
 * Global demo mode state — readable outside React components.
 *
 * The DemoModeContext syncs its state here so that plain utility
 * functions (getBatchQuotes, getTrending, etc.) can check `isDemoActive()`
 * without needing React hooks.
 *
 * IMPORTANT: We initialize from localStorage at module load time so that
 * `isDemoActive()` returns the correct value immediately — before any
 * React useEffect has a chance to sync. This prevents a race condition
 * where API calls fire before the DemoModeContext useEffect sets the flag.
 */

function loadInitialDemoState(): boolean {
  try {
    const raw = localStorage.getItem("finch_demo_mode");
    if (!raw) return false;
    const { active, date } = JSON.parse(raw) as { active: boolean; date: string };
    const today = new Date().toISOString().slice(0, 10);
    return date === today && active;
  } catch {
    return false;
  }
}

let _demoActive = loadInitialDemoState();

export function setDemoActive(active: boolean): void {
  _demoActive = active;
}

export function isDemoActive(): boolean {
  return _demoActive;
}
