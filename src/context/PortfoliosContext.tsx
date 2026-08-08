import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { portfolioStorage } from "../services/storage";
import { Portfolio, Security } from "../types/types";
import {
  DEFAULT_PORTFOLIOS,
  DEMO_SEED_VERSION,
  isDemoPortfolioModified,
} from "../data/demo/defaultLists";
import {
  calibrateDemoPortfolio,
  demoSymbols,
  type DemoSecurity,
} from "../data/demo/calibrate";
import { getBatchQuotes } from "../components/search/quoteUtils";

interface PortfoliosContextProps {
  portfolios: Portfolio[];
  appendPortfolio: (newPortfolio: Portfolio) => void;
  removePortfolio: (removedPortfolio: Portfolio) => void;
  renamePortfolio: (portfolioId: string, newTitle: string) => void;
  addSecurityToPortfolio: (portfolioId: string, security: Security) => void;
  removeSecurityFromPortfolio: (portfolioId: string, symbol: string) => void;
  restoreDefaultPortfolios: () => void;
}

const PortfoliosContext = createContext<PortfoliosContextProps | undefined>(
  undefined
);

export const PortfoliosProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [needsCalibration, setNeedsCalibration] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = portfolioStorage.getAll();
    const seeded = localStorage.getItem("finch_demo_portfolios_seeded");
    let list: Portfolio[];
    if (seeded) {
      list = stored;
    } else {
      // First visit or never seeded — merge defaults with any existing data
      const existingIds = new Set(stored.map((p) => p.title));
      const toAdd = DEFAULT_PORTFOLIOS.filter((p) => !existingIds.has(p.title));
      list = [...stored, ...toAdd];
      localStorage.setItem("finch_demo_portfolios_seeded", "1");
    }

    // Ensure isDemo flag is set on any demo portfolio (covers pre-flag seeded data)
    const demoTitles = new Set(DEFAULT_PORTFOLIOS.map((p) => p.title));
    let patched = false;
    for (const p of list) {
      if (demoTitles.has(p.title) && !p.isDemo) {
        p.isDemo = true;
        patched = true;
      }
    }

    // v2: Refresh demo portfolio value histories (fixes incorrect synth values)
    const seedVersion = Number(seeded || "0");
    if (seedVersion < 2) {
      const demoByTitle = new Map(DEFAULT_PORTFOLIOS.map((dp) => [dp.title, dp]));
      for (const p of list) {
        const freshDemo = demoByTitle.get(p.title);
        if (p.isDemo && freshDemo) {
          p.portfolioValue = freshDemo.portfolioValue;
          patched = true;
        }
      }
      localStorage.setItem("finch_demo_portfolios_seeded", "2");
    }

    // v3: Cost bases were absolute numbers tuned to the static fixtures, so
    // live prices could render an implausible loss on an untouched demo
    // portfolio. Re-seed them from DEFAULT_PORTFOLIOS (which now carry
    // costRatio) and let the async pass below resolve them against quotes.
    if (seedVersion > 0 && seedVersion < 3) {
      const demoByTitle = new Map(DEFAULT_PORTFOLIOS.map((dp) => [dp.title, dp]));
      for (const p of list) {
        const freshDemo = demoByTitle.get(p.title);
        // Only reset holdings the user hasn't edited.
        if (p.isDemo && freshDemo && !isDemoPortfolioModified(p)) {
          p.securities = freshDemo.securities;
          p.portfolioValue = freshDemo.portfolioValue;
          patched = true;
        }
      }
    }
    localStorage.setItem(
      "finch_demo_portfolios_seeded",
      String(DEMO_SEED_VERSION)
    );

    if (patched || !seeded) {
      localStorage.setItem("finch_portfolios", JSON.stringify(list));
    }
    setPortfolios(list);
    setNeedsCalibration(true);
  }, []);

  // ── Resolve demo costRatio against live prices ──
  // Runs once after seeding. Uses the shared query cache, so it piggybacks on
  // the quote request the lists page makes anyway rather than spending extra
  // upstream budget.
  // The ref (rather than a cleanup flag) guards this because StrictMode
  // double-invokes effects in development: a cleanup-based cancel would abort
  // the only in-flight calibration and it would never apply.
  const calibrationStarted = useRef(false);

  useEffect(() => {
    if (!needsCalibration || calibrationStarted.current) return;

    const demo = portfolios.filter(
      (p) => p.isDemo && (p.securities ?? []).some((s) => (s as DemoSecurity).costRatio)
    );
    if (demo.length === 0) return;
    calibrationStarted.current = true;

    (async () => {
      try {
        const quotes = await getBatchQuotes(queryClient, demoSymbols(demo));
        const priceBySymbol: Record<string, number | null | undefined> = {};
        for (const [sym, q] of Object.entries(quotes)) priceBySymbol[sym] = q?.price;

        const demoIds = new Set(demo.map((p) => p.id));
        setPortfolios((prev) => {
          const next = prev.map((p) =>
            demoIds.has(p.id) ? calibrateDemoPortfolio(p, priceBySymbol) : p
          );
          const changed = next.some((p, i) => p !== prev[i]);
          if (!changed) return prev;
          localStorage.setItem("finch_portfolios", JSON.stringify(next));
          return next;
        });
      } catch {
        // Non-critical: holdings keep their fallback purchasePrice.
      }
    })();
  }, [needsCalibration, portfolios, queryClient]);

  const appendPortfolio = (newPortfolio: Portfolio) => {
    setPortfolios((prevPortfolios) => [...prevPortfolios, newPortfolio]);
  };

  const removePortfolio = (removedPortfolio: Portfolio) => {
    portfolioStorage.remove(removedPortfolio.id);
    setPortfolios((prevPortfolios) =>
      prevPortfolios.filter((p) => p.id !== removedPortfolio.id)
    );
  };

  const renamePortfolio = (portfolioId: string, newTitle: string) => {
    portfolioStorage.rename(portfolioId, newTitle);
    setPortfolios((prev) =>
      prev.map((p) =>
        p.id === portfolioId ? { ...p, title: newTitle } : p
      )
    );
  };

  const addSecurityToPortfolio = (
    portfolioId: string,
    security: Security
  ) => {
    portfolioStorage.addSecurity(portfolioId, security);
    setPortfolios((prev) =>
      prev.map((portfolio) =>
        portfolio.id === portfolioId
          ? {
              ...portfolio,
              securities: [...(portfolio.securities ?? []), security],
            }
          : portfolio
      )
    );
  };

  const removeSecurityFromPortfolio = (
    portfolioId: string,
    symbol: string
  ) => {
    const sym = symbol.toUpperCase();
    portfolioStorage.removeSecurity(portfolioId, sym);
    setPortfolios((prev) =>
      prev.map((portfolio) =>
        portfolio.id === portfolioId
          ? {
              ...portfolio,
              securities: (portfolio.securities ?? []).filter(
                (s) => s.symbol.toUpperCase() !== sym
              ),
            }
          : portfolio
      )
    );
  };

  const restoreDefaultPortfolios = () => {
    // Generate fresh copies of the demo defaults (new ids + fresh synthHistory)
    const fresh = DEFAULT_PORTFOLIOS.map((p) => ({ ...p, id: crypto.randomUUID() }));
    const merged = portfolioStorage.restoreDefaults(fresh);
    setPortfolios(merged);
  };

  const contextValue = useMemo(
    () => ({
      portfolios,
      appendPortfolio,
      removePortfolio,
      renamePortfolio,
      addSecurityToPortfolio,
      removeSecurityFromPortfolio,
      restoreDefaultPortfolios,
    }),
    [portfolios]
  );

  return (
    <PortfoliosContext.Provider
      value={contextValue}
      /*   value={{ portfolios, appendPortfolio, removePortfolio }} */
    >
      {children}
    </PortfoliosContext.Provider>
  );
};
export const usePortfolios = () => {
  const context = useContext(PortfoliosContext);
  if (!context) {
    throw new Error("usePortfolios must be used within a PortfoliosProvider");
  }
  return context;
};
