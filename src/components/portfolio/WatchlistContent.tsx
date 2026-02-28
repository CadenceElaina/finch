import React from "react";
import { FaEllipsisV, FaPlus } from "react-icons/fa";
import "./Portfolio.css";
import { useWatchlists } from "../../context/WatchlistContext";

interface WatchlistContentProps {
  watchlistName?: string;
  handleDropdownToggle: () => void;
  handleDropdownOptionClick: (option: string) => void;
  showDropdown: boolean;
  openAddToWatchlistModal: () => void;
}

const WatchlistContent: React.FC<WatchlistContentProps> = ({
  watchlistName,
  handleDropdownToggle,
  handleDropdownOptionClick,
  showDropdown,
  openAddToWatchlistModal,
}) => {
  const { watchlists } = useWatchlists();
  return (
    <>
      {watchlists.length > 0 && (
        <>
          <div className="chart">
            <div className="chart-header">
              <span className="portfolio-title">{watchlistName ?? "Watchlist"}</span>

              <div className="settings-dropdown">
                <button className="settings" onClick={handleDropdownToggle}>
                  <FaEllipsisV size={18} />
                </button>
                {showDropdown && (
                  <div className="dropdown-content">
                    <div
                      className="dropdown-option"
                      onClick={() => handleDropdownOptionClick("rename")}
                    >
                      Rename
                    </div>
                    <div
                      className="dropdown-option"
                      onClick={() => handleDropdownOptionClick("remove")}
                    >
                      Remove
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button className="add-investment" onClick={openAddToWatchlistModal}>
            <FaPlus size={18} />
            <span className="label">Add investments</span>
          </button>{" "}
        </>
      )}
    </>
  );
};

export default WatchlistContent;
