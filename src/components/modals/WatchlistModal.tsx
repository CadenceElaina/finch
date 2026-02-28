import React, { useState } from "react";
import { WatchlistSecurity, Watchlist } from "../../types/types";
import "./WatchlistModal.css";
import { watchlistStorage } from "../../services/storage";
import { useWatchlists } from "../../context/WatchlistContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../context/NotificationContext";

interface WatchlistModalProps {
  watchlists: Watchlist[];
  onClose: () => void;
  selectedSecurity: string;
  style?: React.CSSProperties;
}

const WatchlistModal: React.FC<WatchlistModalProps> = ({
  watchlists,
  onClose,
  selectedSecurity,
  style,
}) => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const usersWatchlists = watchlists.filter((w) => w.author === user?.name);
  const [selectedWatchlists, setSelectedWatchlists] = useState<string[]>(
    usersWatchlists
      .filter((watchlist) =>
        watchlist.securities?.some((s) => s.symbol === selectedSecurity)
      )
      .map((watchlist) => watchlist.id)
  );
  const { setWatchlists } = useWatchlists();
  const updateWatchlists = async () => {
    const securitiesToAdd: {
      watchlistId: string;
      security: WatchlistSecurity;
    }[] = [];
    const securitiesToRemove: {
      watchlistId: string;
      security: WatchlistSecurity;
    }[] = [];

    for (const watchlist of watchlists) {
      const isInSelected = selectedWatchlists.includes(watchlist.id);
      const isInWatchlist = watchlist.securities?.some(
        (s) => s.symbol === selectedSecurity
      );

      if (!isInSelected && isInWatchlist) {
        securitiesToRemove.push({
          watchlistId: watchlist.id,
          security: { symbol: selectedSecurity },
        });
      } else if (
        isInSelected &&
        !isInWatchlist &&
        !securitiesToAdd.some((s) => s.watchlistId === watchlist.id)
      ) {
        securitiesToAdd.push({
          watchlistId: watchlist.id,
          security: { symbol: selectedSecurity },
        });
      }
    }

    // Add securities to the selected watchlists only if not already present
    for (const { watchlistId, security } of securitiesToAdd) {
      watchlistStorage.addSecurity(watchlistId, security);
      addNotification(
        `${security.symbol} added to ${
          watchlists.find((w) => w.id === watchlistId)?.title
        }!`,
        "info"
      );
    }

    // Remove securities from the selected watchlists
    for (const { watchlistId, security } of securitiesToRemove) {
      watchlistStorage.removeSecurity(watchlistId, security.symbol);
      addNotification(
        `${security.symbol} removed from ${
          watchlists.find((w) => w.id === watchlistId)?.title
        }!`,
        "info"
      );
    }

    // Refresh watchlists from localStorage
    setWatchlists(watchlistStorage.getAll());
  };

  return (
    <div className="watchlist-modal" style={style}>
      {usersWatchlists.length >= 1 ? (
        <>
          <h2>Select Watchlists</h2>
          {usersWatchlists.map((watchlist) => (
            <div key={watchlist.id}>
              <input
                type="checkbox"
                id={watchlist.id}
                checked={selectedWatchlists.includes(watchlist.id)}
                onChange={() => {
                  setSelectedWatchlists((prev) => {
                    if (prev.includes(watchlist.id)) {
                      return prev.filter((id) => id !== watchlist.id);
                    } else {
                      return [...prev, watchlist.id];
                    }
                  });
                }}
              />
              <label htmlFor={watchlist.id}>{watchlist.title}</label>
            </div>
          ))}
          <button
            onClick={() => {
              updateWatchlists();
              onClose();
            }}
          >
            Submit
          </button>
        </>
      ) : (
        <>
          <button onClick={() => navigate("/portfolio")}>
            Add a watchlist
          </button>
        </>
      )}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default WatchlistModal;
