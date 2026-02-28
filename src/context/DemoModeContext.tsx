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
const FAILURE_THRESHOLD = 3;

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
    setFailureCount(0);
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_FAILURES_KEY);
  }, []);

  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true);
  }, []);

  // ── Axios interceptors: auto-detect quota exhaustion ──
  const interceptorIds = useRef<{ req: number; res: number } | null>(null);

  useEffect(() => {
    // Response interceptor: track success/failure
    const resId = axios.interceptors.response.use(
      (response) => {
        // Successful API call — reset failure counter
        setFailureCount(0);
        return response;
      },
      (error) => {
        const status = error?.response?.status;
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
