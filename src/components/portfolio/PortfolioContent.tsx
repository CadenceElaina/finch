import React from "react";
import { FaEllipsisV, FaPlus } from "react-icons/fa";
import "./Portfolio.css";
import PortfolioPerformance from "./PortfolioPerformance";
import { Portfolio } from "../../types/types";

interface PortfolioContentProps {
  portfolio: Portfolio | undefined;
  portfolioName: string;
  handleDropdownToggle: () => void;
  handleDropdownOptionClick: (option: string) => void;
  showDropdown: boolean;
  openAddToPortfolioModal: () => void;
  onRemoveSecurity?: (symbol: string) => void;
}

const PortfolioContent: React.FC<PortfolioContentProps> = ({
  portfolio,
  portfolioName,
  handleDropdownToggle,
  handleDropdownOptionClick,
  showDropdown,
  openAddToPortfolioModal,
  onRemoveSecurity,
}) => {
  return (
    <>
      <div className="lists-section-header">
        <div className="lists-title-row">
          <h2 className="lists-title">{portfolioName}</h2>
          <div className="lists-actions">
            <button className="lists-add-btn" onClick={openAddToPortfolioModal}>
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

      {portfolio && portfolio.securities && portfolio.securities.length > 0 ? (
        <PortfolioPerformance portfolio={portfolio} onRemoveSecurity={onRemoveSecurity} />
      ) : (
        <div className="lists-empty-holdings">
          <p className="lists-empty-title">No holdings yet</p>
          <p className="lists-empty-sub">Add your first investment to start tracking performance</p>
          <button className="lists-cta-btn" onClick={openAddToPortfolioModal}>
            <FaPlus size={12} /> Add Investment
          </button>
        </div>
      )}
    </>
  );
};

export default PortfolioContent;
