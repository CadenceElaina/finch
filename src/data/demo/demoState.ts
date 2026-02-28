/**
 * Global demo mode state — readable outside React components.
 *
 * The DemoModeContext syncs its state here so that plain utility
 * functions (getBatchQuotes, getTrending, etc.) can check `isDemoActive()`
 * without needing React hooks.
 */

let _demoActive = false;

export function setDemoActive(active: boolean): void {
  _demoActive = active;
}

export function isDemoActive(): boolean {
  return _demoActive;
}
