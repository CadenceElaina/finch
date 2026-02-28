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
