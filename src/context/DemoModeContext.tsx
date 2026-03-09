/**
 * Demo Mode Context
 * ─────────────────
 * Tracks API quota exhaustion and provides a global "demo mode" flag.
 *
 * Demo mode activates automatically when:
 *   1. API calls return 429 (rate limited) or 403 (quota exceeded)
 *   2. Multiple consecutive API failures occur (3+ in a row)
 *   3. The user manually enables it (future: settings toggle)
 *
 * When active, all data-fetching functions should fall back to
 * static demo data from src/data/demo/.
 *
 * The state persists in localStorage so demo mode survives page
 * refreshes (until the user dismisses it or the next day).
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import axios from "axios";
import { setDemoActive } from "../data/demo/demoState";
import { cacheStorage } from "../services/storage";

interface DemoModeContextType {
  /** Whether the app is currently showing demo data */
  isDemoMode: boolean;
  /** Record an API failure — triggers demo mode after threshold */
  recordApiFailure: (status?: number) => void;
  /** Record a successful API call — resets failure counter */
  recordApiSuccess: () => void;
  /** Manually exit demo mode (e.g. "Try live data" button) */
  exitDemoMode: () => void;
  /** Manually enter demo mode */
  enterDemoMode: () => void;
  /** Number of consecutive API failures */
  failureCount: number;
}

const DemoModeContext = createContext<DemoModeContextType | null>(null);

const LS_KEY = "finch_demo_mode";
const LS_FAILURES_KEY = "finch_api_failures";
const LS_EXIT_TS_KEY = "finch_demo_exit_ts";
const LS_USER_DISABLED_KEY = "finch_demo_user_disabled";
const FAILURE_THRESHOLD = 3;
const GRACE_PERIOD_MS = 5 * 60_000; // 5 min grace after user exits before auto-re-entry

/** Check if demo mode was previously activated today */
function loadDemoState(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const { active, date } = JSON.parse(raw) as { active: boolean; date: string };
    // Auto-reset demo mode at midnight
    const today = new Date().toISOString().slice(0, 10);
    if (date !== today) {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_FAILURES_KEY);
      return false;
    }
    return active;
  } catch {
    return false;
  }
}

function saveDemoState(active: boolean): void {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(LS_KEY, JSON.stringify({ active, date: today }));
}

export const DemoModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(loadDemoState);
  const [failureCount, setFailureCount] = useState(() => {
    try {
      return Number(localStorage.getItem(LS_FAILURES_KEY)) || 0;
    } catch {
      return 0;
    }
  });

  // Persist failure count
  useEffect(() => {
    localStorage.setItem(LS_FAILURES_KEY, String(failureCount));
  }, [failureCount]);

  // Persist demo mode state
  useEffect(() => {
    saveDemoState(isDemoMode);
    setDemoActive(isDemoMode);
  }, [isDemoMode]);

  const recordApiFailure = useCallback((status?: number) => {
    // Immediate demo mode on quota-specific errors
    if (status === 429 || status === 403) {
      setIsDemoMode(true);
      setFailureCount((c) => c + 1);
      return;
    }
    // Gradual: after N consecutive failures
    setFailureCount((prev) => {
      const next = prev + 1;
      if (next >= FAILURE_THRESHOLD) {
        setIsDemoMode(true);
      }
      return next;
    });
  }, []);

  const recordApiSuccess = useCallback(() => {
    setFailureCount(0);
    // Don't auto-exit demo mode on success — let the user decide
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setDemoActive(false); // Sync module-level flag immediately so isDemoActive() is correct
    setFailureCount(0);
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_FAILURES_KEY);
    // Flush stale API response caches so fresh data is fetched after reload
    cacheStorage.clearAll();
    // Record exit timestamp so the interceptor respects a grace period
    localStorage.setItem(LS_EXIT_TS_KEY, String(Date.now()));
    // Mark that user explicitly disabled — prevents auto-re-entry until next session
    localStorage.setItem(LS_USER_DISABLED_KEY, "1");
  }, []);

  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setDemoActive(true); // Sync module-level flag immediately
    // User chose to enable, so clear the disabled flag
    localStorage.removeItem(LS_USER_DISABLED_KEY);
  }, []);

  // ── Axios interceptors: auto-detect quota exhaustion ──
  const interceptorIds = useRef<{ req: number; res: number } | null>(null);

  useEffect(() => {
    /** Check if user explicitly disabled demo mode — skip auto-re-entry */
    const isUserDisabled = (): boolean => {
      try {
        return localStorage.getItem(LS_USER_DISABLED_KEY) === "1";
      } catch {
        return false;
      }
    };

    /** Check if user recently exited demo mode — skip auto-re-entry during grace period */
    const isInGracePeriod = (): boolean => {
      try {
        const ts = localStorage.getItem(LS_EXIT_TS_KEY);
        if (!ts) return false;
        return Date.now() - Number(ts) < GRACE_PERIOD_MS;
      } catch {
        return false;
      }
    };

    // Response interceptor: track success/failure
    const resId = axios.interceptors.response.use(
      (response) => {
        // Successful API call — reset failure counter
        setFailureCount(0);
        // Clear exit timestamp on first success (live data works)
        localStorage.removeItem(LS_EXIT_TS_KEY);
        return response;
      },
      (error) => {
        const status = error?.response?.status;
        // Don't auto-re-enter if user explicitly disabled or in grace period
        if (isUserDisabled() || isInGracePeriod()) {
          return Promise.reject(error);
        }
        if (status === 429 || status === 403) {
          setIsDemoMode(true);
          setFailureCount((c) => c + 1);
        } else if (status >= 500 || !status) {
          // Server error or network failure
          setFailureCount((prev) => {
            const next = prev + 1;
            if (next >= FAILURE_THRESHOLD) setIsDemoMode(true);
            return next;
          });
        }
        return Promise.reject(error);
      }
    );

    interceptorIds.current = { req: 0, res: resId };

    return () => {
      axios.interceptors.response.eject(resId);
    };
  }, []);

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        recordApiFailure,
        recordApiSuccess,
        exitDemoMode,
        enterDemoMode,
        failureCount,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

export function useDemoMode(): DemoModeContextType {
  const ctx = useContext(DemoModeContext);
  if (!ctx) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return ctx;
}
