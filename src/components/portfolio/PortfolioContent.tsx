import React from "react";
import { FaEllipsisV, FaPlus } from "react-icons/fa";
import "./Portfolio.css";
import PortfolioPerformance from "./PortfolioPerformance";
import { usePortfolios } from "../../context/PortfoliosContext";
import { Portfolio } from "../../types/types";


interface PortfolioContentProps {
  portfolio: Portfolio | undefined;
  portfolioName: string;
  handleDropdownToggle: () => void;
  handleDropdownOptionClick: (option: string) => void;
  showDropdown: boolean;
  openAddToPortfolioModal: () => void;
}

const PortfolioContent: React.FC<PortfolioContentProps> = ({
  portfolio,
  portfolioName,
  handleDropdownToggle,
  handleDropdownOptionClick,
  showDropdown,
  openAddToPortfolioModal,
}) => {
  const { portfolios } = usePortfolios();
  return (
    <>
      {portfolios.length > 0 && (
        <>
          <div className="chart">
            <div className="chart-header">
              <span className="portfolio-title">{portfolioName}</span>

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
            {portfolio && <PortfolioPerformance portfolio={portfolio} />}
          </div>
          <button className="add-investment" onClick={openAddToPortfolioModal}>
            <FaPlus size={18} />
            <span className="label">Add investments</span>
          </button>
        </>
      )}
    </>
  );
};

export default PortfolioContent;
