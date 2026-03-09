import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import { watchlistStorage } from "../services/storage";
import { Watchlist, WatchlistSecurity } from "../types/types";
import { DEFAULT_WATCHLISTS } from "../data/demo/defaultLists";

interface WatchlistContextProps {
  watchlists: Watchlist[];
  setWatchlists: Dispatch<SetStateAction<Watchlist[]>>;
  appendWatchlist: (newWatchlist: Watchlist) => void;
  removeWatchlist: (removedWatchlist: Watchlist) => void;
  renameWatchlist: (watchlistId: string, newTitle: string) => void;
  addSecurityToWatchlist: (
    watchlistId: string,
    security: WatchlistSecurity
  ) => void;
  removeSecurityFromWatchlist: (
    watchlistId: string,
    security: WatchlistSecurity
  ) => void;
}

const WatchlistContext = createContext<WatchlistContextProps | undefined>(
  undefined
);

export const WatchlistsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);

  useEffect(() => {
    const stored = watchlistStorage.getAll();
    const seeded = localStorage.getItem("finch_demo_watchlists_seeded");
    let list: Watchlist[];
    if (seeded) {
      list = stored;
    } else {
      // First visit or never seeded — merge defaults with any existing data
      const existingTitles = new Set(stored.map((w) => w.title));
      const toAdd = DEFAULT_WATCHLISTS.filter((w) => !existingTitles.has(w.title));
      list = [...stored, ...toAdd];
      localStorage.setItem("finch_demo_watchlists_seeded", "1");
    }

    // Ensure isDemo flag is set on any demo watchlist (covers pre-flag seeded data)
    const demoTitles = new Set(DEFAULT_WATCHLISTS.map((w) => w.title));
    let patched = false;
    for (const w of list) {
      if (demoTitles.has(w.title) && !w.isDemo) {
        w.isDemo = true;
        patched = true;
      }
    }
    if (patched || !seeded) {
      localStorage.setItem("finch_watchlists", JSON.stringify(list));
    }
    setWatchlists(list);
  }, []);

  const appendWatchlist = (newWatchlist: Watchlist) => {
    setWatchlists((prev) => [...prev, newWatchlist]);
  };

  const removeWatchlist = (removedWatchlist: Watchlist) => {
    watchlistStorage.remove(removedWatchlist.id);
    setWatchlists((prev) =>
      prev.filter((w) => w.id !== removedWatchlist.id)
    );
  };

  const renameWatchlist = (watchlistId: string, newTitle: string) => {
    watchlistStorage.rename(watchlistId, newTitle);
    setWatchlists((prev) =>
      prev.map((w) =>
        w.id === watchlistId ? { ...w, title: newTitle } : w
      )
    );
  };

  const addSecurityToWatchlist = (
    watchlistId: string,
    security: WatchlistSecurity
  ) => {
    watchlistStorage.addSecurity(watchlistId, security);
    setWatchlists((prev) =>
      prev.map((watchlist) =>
        watchlist.id === watchlistId
          ? {
              ...watchlist,
              securities: [...(watchlist.securities ?? []), security],
            }
          : watchlist
      )
    );
  };

  const removeSecurityFromWatchlist = (
    watchlistId: string,
    security: WatchlistSecurity
  ) => {
    watchlistStorage.removeSecurity(watchlistId, security.symbol);
    const sym = security.symbol.toUpperCase();
    setWatchlists((prev) =>
      prev.map((watchlist) =>
        watchlist.id === watchlistId
          ? {
              ...watchlist,
              securities: watchlist.securities?.filter(
                (s) => s.symbol.toUpperCase() !== sym
              ),
            }
          : watchlist
      )
    );
  };

  const contextValue = useMemo(
    () => ({
      watchlists,
      setWatchlists,
      appendWatchlist,
      removeWatchlist,
      renameWatchlist,
      addSecurityToWatchlist,
      removeSecurityFromWatchlist,
    }),
    [watchlists]
  );

  return (
    <WatchlistContext.Provider value={contextValue}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlists = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlists must be used within a WatchlistsProvider");
  }
  return context;
};
