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
import watchlistService from "../services/watchlist";
import { Watchlist, WatchlistSecurity } from "../types/types";

interface WatchlistContextProps {
  watchlists: Watchlist[];
  setWatchlists: Dispatch<SetStateAction<Watchlist[]>>;
  appendWatchlist: (newWatchlist: Watchlist) => void;
  removeWatchlist: (removedWatchlist: Watchlist) => Promise<void>;
  addSecurityToWatchlist: (
    watchlistId: string,
    security: WatchlistSecurity
  ) => Promise<void>;
  removeSecurityFromWatchlist: (
    watchlistId: string,
    security: WatchlistSecurity
  ) => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextProps | undefined>(
  undefined
);

export const WatchlistsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);

  useEffect(() => {
    const fetchWatchlists = async () => {
      try {
        const watchlistsData = await watchlistService.getAll();
        setWatchlists(watchlistsData);
      } catch (error) {
        console.error("Error fetching watchlists:", error);
      }
    };

    fetchWatchlists();
  }, []); // Fetch watchlists on component mount

  const updateWatchlistsState: Dispatch<SetStateAction<Watchlist[]>> = (
    updatedWatchlists
  ) => {
    setWatchlists(updatedWatchlists);
  };

  const appendWatchlist = (newWatchlist: Watchlist) => {
    updateWatchlistsState([...watchlists, newWatchlist]);
  };

  const removeWatchlist = async (removedWatchlist: Watchlist) => {
    try {
      await watchlistService.remove(removedWatchlist.id);
      updateWatchlistsState(
        watchlists.filter((w) => w.id !== removedWatchlist.id)
      );
    } catch (error) {
      console.error("Error removing watchlist:", error);
      // Handle error as needed
    }
  };

  const addSecurityToWatchlist = async (
    watchlistId: string,
    security: WatchlistSecurity
  ) => {
    try {
      const updatedWatchlists = watchlists.map((watchlist) =>
        watchlist.id === watchlistId
          ? {
              ...watchlist,
              securities: [...(watchlist.securities ?? []), security],
            }
          : watchlist
      );
      updateWatchlistsState(updatedWatchlists);

      // Ensure the API call is awaited and handle any potential errors
      await watchlistService.addToWatchlist(watchlistId, security);
    } catch (error) {
      console.error("Error adding security to watchlist:", error);
      // Rollback the state update on error (optional, depends on your use case)
      updateWatchlistsState(watchlists);
    }
  };

  const removeSecurityFromWatchlist = async (
    watchlistId: string,
    security: WatchlistSecurity
  ) => {
    try {
      const updatedWatchlists = watchlists.map((watchlist) =>
        watchlist.id === watchlistId
          ? {
              ...watchlist,
              securities: watchlist.securities?.filter(
                (s) => s.symbol !== security.symbol
              ),
            }
          : watchlist
      );
      updateWatchlistsState(updatedWatchlists);

      // Ensure the API call is awaited and handle any potential errors
      await watchlistService.removeSecurityFromWatchlist(watchlistId, security);
    } catch (error) {
      console.error("Error removing security from watchlist:", error);
      // Rollback the state update on error (optional, depends on your use case)
      updateWatchlistsState(watchlists);
    }
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
