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

interface WatchlistContextProps {
  watchlists: Watchlist[];
  setWatchlists: Dispatch<SetStateAction<Watchlist[]>>;
  appendWatchlist: (newWatchlist: Watchlist) => void;
  removeWatchlist: (removedWatchlist: Watchlist) => void;
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
    setWatchlists(watchlistStorage.getAll());
  }, []);

  const updateWatchlistsState: Dispatch<SetStateAction<Watchlist[]>> = (
    updatedWatchlists
  ) => {
    setWatchlists(updatedWatchlists);
  };

  const appendWatchlist = (newWatchlist: Watchlist) => {
    updateWatchlistsState([...watchlists, newWatchlist]);
  };

  const removeWatchlist = (removedWatchlist: Watchlist) => {
    watchlistStorage.remove(removedWatchlist.id);
    updateWatchlistsState(
      watchlists.filter((w) => w.id !== removedWatchlist.id)
    );
  };

  const addSecurityToWatchlist = (
    watchlistId: string,
    security: WatchlistSecurity
  ) => {
    watchlistStorage.addSecurity(watchlistId, security);
    updateWatchlistsState(
      watchlists.map((watchlist) =>
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
    updateWatchlistsState(
      watchlists.map((watchlist) =>
        watchlist.id === watchlistId
          ? {
              ...watchlist,
              securities: watchlist.securities?.filter(
                (s) => s.symbol !== security.symbol
              ),
            }
          : watchlist
      )
    );
  };

  const contextValue = useMemo(
    () => ({
      watchlists,
      setWatchlists: updateWatchlistsState,
      appendWatchlist,
      removeWatchlist,
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
