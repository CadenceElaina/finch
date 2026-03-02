import React from "react";
import { FaEllipsisV, FaPlus } from "react-icons/fa";
import "./Portfolio.css";

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
  return (
    <div className="lists-section-header">
      <div className="lists-title-row">
        <h2 className="lists-title">{watchlistName ?? "Watchlist"}</h2>
        <div className="lists-actions">
          <button className="lists-add-btn" onClick={openAddToWatchlistModal}>
            <FaPlus size={12} />
            <span>Add</span>
          </button>
          <div className="settings-dropdown">
            <button className="lists-kebab" onClick={handleDropdownToggle}>
              <FaEllipsisV size={14} />
            </button>
            {showDropdown && (
              <div className="dropdown-content">
                <div className="dropdown-option" onClick={() => handleDropdownOptionClick("rename")}>Rename</div>
                <div className="dropdown-option" onClick={() => handleDropdownOptionClick("remove")}>Delete</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchlistContent;
