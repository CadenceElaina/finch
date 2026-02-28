import { Portfolio, Security, Watchlist, WatchlistSecurity } from "../types/types";

// Keys
const PORTFOLIOS_KEY = "finch_portfolios";
const WATCHLISTS_KEY = "finch_watchlists";
const PREFERENCES_KEY = "finch_preferences";

const generateId = (): string => crypto.randomUUID();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Portfolio
export const portfolioStorage = {
  getAll(): Portfolio[] {
    return read<Portfolio[]>(PORTFOLIOS_KEY, []);
  },

  create(data: { title: string; author?: string }): Portfolio {
    const portfolios = portfolioStorage.getAll();
    const portfolio: Portfolio = {
      id: generateId(),
      title: data.title,
      author: data.author,
      securities: [],
      portfolioValue: [],
    };
    portfolios.push(portfolio);
    write(PORTFOLIOS_KEY, portfolios);
    return portfolio;
  },

  remove(id: string): void {
    const portfolios = portfolioStorage.getAll().filter((p) => p.id !== id);
    write(PORTFOLIOS_KEY, portfolios);
  },

  rename(id: string, newTitle: string): Portfolio {
    const portfolios = portfolioStorage.getAll();
    const portfolio = portfolios.find((p) => p.id === id);
    if (!portfolio) throw new Error(`Portfolio ${id} not found`);
    portfolio.title = newTitle;
    write(PORTFOLIOS_KEY, portfolios);
    return portfolio;
  },

  addSecurity(id: string, security: Security): Portfolio {
    const portfolios = portfolioStorage.getAll();
    const portfolio = portfolios.find((p) => p.id === id);
    if (!portfolio) throw new Error(`Portfolio ${id} not found`);
    portfolio.securities = [...(portfolio.securities ?? []), security];
    write(PORTFOLIOS_KEY, portfolios);
    return portfolio;
  },

  updateValue(id: string, entry: { date: string; value: number }): Portfolio {
    const portfolios = portfolioStorage.getAll();
    const portfolio = portfolios.find((p) => p.id === id);
    if (!portfolio) throw new Error(`Portfolio ${id} not found`);
    portfolio.portfolioValue = [...(portfolio.portfolioValue ?? []), entry];
    write(PORTFOLIOS_KEY, portfolios);
    return portfolio;
  },

  removeSecurity(id: string, symbol: string): Portfolio {
    const portfolios = portfolioStorage.getAll();
    const portfolio = portfolios.find((p) => p.id === id);
    if (!portfolio) throw new Error(`Portfolio ${id} not found`);
    portfolio.securities = (portfolio.securities ?? []).filter(
      (s) => s.symbol !== symbol
    );
    write(PORTFOLIOS_KEY, portfolios);
    return portfolio;
  },
};

// Watchlists
export const watchlistStorage = {
  getAll(): Watchlist[] {
    return read<Watchlist[]>(WATCHLISTS_KEY, []);
  },

  create(data: { title: string; author?: string }): Watchlist {
    const watchlists = watchlistStorage.getAll();
    const watchlist: Watchlist = {
      id: generateId(),
      title: data.title,
      author: data.author,
      securities: [],
    };
    watchlists.push(watchlist);
    write(WATCHLISTS_KEY, watchlists);
    return watchlist;
  },

  remove(id: string): void {
    const watchlists = watchlistStorage.getAll().filter((w) => w.id !== id);
    write(WATCHLISTS_KEY, watchlists);
  },

  rename(id: string, newTitle: string): Watchlist {
    const watchlists = watchlistStorage.getAll();
    const watchlist = watchlists.find((w) => w.id === id);
    if (!watchlist) throw new Error(`Watchlist ${id} not found`);
    watchlist.title = newTitle;
    write(WATCHLISTS_KEY, watchlists);
    return watchlist;
  },

  addSecurity(id: string, security: WatchlistSecurity): Watchlist {
    const watchlists = watchlistStorage.getAll();
    const watchlist = watchlists.find((w) => w.id === id);
    if (!watchlist) throw new Error(`Watchlist ${id} not found`);
    watchlist.securities = [...(watchlist.securities ?? []), security];
    write(WATCHLISTS_KEY, watchlists);
    return watchlist;
  },

  removeSecurity(id: string, symbol: string): Watchlist {
    const watchlists = watchlistStorage.getAll();
    const watchlist = watchlists.find((w) => w.id === id);
    if (!watchlist) throw new Error(`Watchlist ${id} not found`);
    watchlist.securities = (watchlist.securities ?? []).filter(
      (s) => s.symbol !== symbol
    );
    write(WATCHLISTS_KEY, watchlists);
    return watchlist;
  },
};

// Preferences
export interface Preferences {
  theme: "light" | "dark";
  defaultTab: "portfolios" | "watchlists";
}

const DEFAULT_PREFERENCES: Preferences = {
  theme: "light",
  defaultTab: "portfolios",
};

export const preferencesStorage = {
  get(): Preferences {
    return read<Preferences>(PREFERENCES_KEY, DEFAULT_PREFERENCES);
  },

  set(partial: Partial<Preferences>): Preferences {
    const current = preferencesStorage.get();
    const updated = { ...current, ...partial };
    write(PREFERENCES_KEY, updated);
    return updated;
  },
};

// ── Generic TTL Cache ────────────────────────────────────
// Persists any JSON-serializable data in localStorage with
// a time-to-live. Used for API responses so they survive
// page refreshes without burning API calls.

const CACHE_PREFIX = "finch_cache_";

export const cacheStorage = {
  /**
   * Read a cached value. Returns null if missing or expired.
   */
  get<T>(key: string, ttlMs: number): T | null {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
      if (Date.now() - ts > ttlMs) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Write a value to cache with the current timestamp.
   */
  set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify({ data, ts: Date.now() })
      );
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  },

  /**
   * Remove a specific cache entry.
   */
  remove(key: string): void {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  },

  /**
   * Clear all finch cache entries (not portfolios/watchlists/preferences).
   */
  clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  },
};
