import React, { useEffect, useState } from "react";
import { FaList, FaChartLine, FaPlus, FaAngleRight } from "react-icons/fa";
import Layout from "../layout/Layout";
import "./Portfolio.css";
import { usePortfolios } from "../../context/PortfoliosContext";
import AddToPortfolioModal from "../../components/modals/AddToPortfolioModal";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import AddWatchlistModal from "../modals/AddWatchlistModal";
import NewPortfolioModal from "../modals/AddPortfolioModal";
import { useWatchlists } from "../../context/WatchlistContext";
import { watchlistStorage, portfolioStorage } from "../../services/storage";
import PortfolioContent from "./PortfolioContent";
import WatchlistContent from "./WatchlistContent";
import WatchlistPerformance from "./WatchlistPerformance";
import AddToWatchlistModal from "../modals/AddToWatchlist";
import {
  WatchlistSecurity,
  Watchlist,
  Security,
  Portfolio as PortfolioType,
} from "../../types/types";
import { useNotification } from "../../context/NotificationContext";
import Notification from "../Notification";

const Portfolio = () => {
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeListType, setActiveListType] = useState<string>("portfolios");
  const [activeWatchlist, setActiveWatchlist] = useState<Watchlist>();
  const [activePortfolio, setActivePortfolio] = useState<PortfolioType>();
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [addToPortfolioModalIsOpen, setAddToPortfolioModalIsOpen] =
    useState<boolean>(false);
  const [addToWatchlistModalIsOpen, setAddToWatchlistModalIsOpen] =
    useState<boolean>(false);
  const [addWatchlistModalIsOpen, setAddWatchlistModalIsOpen] =
    useState<boolean>(false);
  const [newPortfolioModalOpen, setNewPortfolioModalOpen] =
    useState<boolean>(false);
  const { portfolios, removePortfolio, addSecurityToPortfolio, appendPortfolio } =
    usePortfolios();
  const { watchlists, addSecurityToWatchlist, appendWatchlist, removeWatchlist, removeSecurityFromWatchlist } =
    useWatchlists();

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const addToWatchlistDisabled = watchlists.length >= 3;
  const addPortfolioDisabled = portfolios.length >= 3;
  const firstWatchlist = watchlists[0];
  const firstPortfolio = portfolios[0];

  // Detect list type from URL or ID match
  useEffect(() => {
    if (!id) return;
    // If URL starts with /watchlist, force watchlist mode
    if (location.pathname.startsWith("/watchlist")) {
      setActiveListType("watchlists");
      return;
    }
    // Auto-detect: check if ID matches a watchlist
    if (watchlists.some((w) => w.id === id)) {
      setActiveListType("watchlists");
    } else if (portfolios.some((p) => p.id === id)) {
      setActiveListType("portfolios");
    }
  }, [id, location.pathname, portfolios, watchlists]);

  useEffect(() => {
    // Find the portfolio with the matching id and set activePortfolio
    if (activeListType === "portfolios") {
      const matchingPortfolio = portfolios.find((p) => p.id === id);
      setActivePortfolio(matchingPortfolio);
      setActiveTab(matchingPortfolio?.title ?? "");
    }
    if (activeListType === "watchlists") {
      const matchingWatchlist = watchlists.find((w) => w.id === id);
      setActiveWatchlist(matchingWatchlist);
      setActiveTab(matchingWatchlist?.title ?? "");
    }
  }, [activeListType, id, portfolios, watchlists]);

  const handleTabClick = (tab: React.SetStateAction<string>) => {
    navigate(`/portfolio/${tab}`);
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDropdownOptionClick = async (option: string) => {
    if (option === "remove") {
      if (activeListType === "portfolios") {
        const removedPortfolio = portfolios.find((p) => p.title === activeTab);
        if (removedPortfolio) {
          removePortfolio(removedPortfolio);
          addNotification(`${removedPortfolio.title} removed`, "success");
          // Navigate to first remaining portfolio or home
          const remaining = portfolios.filter((p) => p.id !== removedPortfolio.id);
          if (remaining.length > 0) {
            navigate(`/portfolio/${remaining[0].id}`);
          } else {
            navigate("/");
          }
        }
      } else if (activeListType === "watchlists") {
        const removedWatchlist = watchlists.find((w) => w.title === activeTab);
        if (removedWatchlist) {
          removeWatchlist(removedWatchlist);
          addNotification(`${removedWatchlist.title} removed`, "success");
          const remaining = watchlists.filter((w) => w.id !== removedWatchlist.id);
          if (remaining.length > 0) {
            navigate(`/portfolio/${remaining[0].id}`);
          } else {
            navigate("/");
          }
        }
      }
    }

    if (option === "rename") {
      const newName = prompt("Enter new name:");
      if (newName && newName.trim()) {
        if (activeListType === "portfolios" && activePortfolio) {
          portfolioStorage.rename(activePortfolio.id, newName.trim());
          // Refresh portfolios state from storage
          portfolioStorage.getAll();
          // We need to call removePortfolio + appendPortfolio to refresh, or just reload
          // Simpler: directly set via navigate to trigger re-render
          window.location.reload();
        } else if (activeListType === "watchlists" && activeWatchlist) {
          watchlistStorage.rename(activeWatchlist.id, newName.trim());
          window.location.reload();
        }
      }
    }

    setShowDropdown(false);
  };

  const openAddToPortfolioModal = () => {
    setAddToPortfolioModalIsOpen(true);
  };
  const openAddToWatchlistModal = () => {
    setAddToWatchlistModalIsOpen(true);
  };
  //
  const addToList = async (newSecurity: Security) => {
    if (activePortfolio && activeListType === "portfolios") {
      addSecurityToPortfolio(activePortfolio.id, newSecurity);
      addNotification(
        `${newSecurity.symbol} added to ${activePortfolio.title}!`,
        "success"
      );
    }
  };
  const addToWatchlist = async (newSecurity: WatchlistSecurity) => {
    if (activeListType === "watchlists" && activeWatchlist) {
      addSecurityToWatchlist(activeWatchlist.id, newSecurity);
      addNotification(
        `${newSecurity.symbol} added to ${activeWatchlist.title}!`,
        "success"
      );
    }
  };

  const onClose = () => {
    setAddToPortfolioModalIsOpen(false);
    setAddToWatchlistModalIsOpen(false);
  };

  const handleSaveWatchlist = (watchlistName: string) => {
    const response = watchlistStorage.create({
      title: watchlistName,
    });
    appendWatchlist(response);
    addNotification(`${response.title} added!`, "success");
    onCloseWatchlist();
    setActiveListType("watchlists");
    navigate(`/watchlist/${response.id}`);
  };

  const handleSaveNewPortfolio = (portfolioName: string) => {
    const response = portfolioStorage.create({
      title: portfolioName,
    });
    appendPortfolio(response);
    addNotification(`${response.title} created!`, "success");
    setNewPortfolioModalOpen(false);
    navigate(`/portfolio/${response.id}`);
  };

  const onCloseWatchlist = () => {
    setAddWatchlistModalIsOpen(false);
  };

  const handleListClick = (type: string) => {
    setActiveListType(`${type}`);
    if (type === "watchlists" && firstWatchlist) {
      navigate(`/portfolio/${firstWatchlist.id}`);
    }
    if (type === "portfolios" && firstPortfolio) {
      navigate(`/portfolio/${firstPortfolio.id}`);
    }
  };

  const Tooltip = () => (
    <div className="tooltip-lists">You may not have more than 3 watchlists</div>
  );

  return (
    <Layout>
      <Notification />
      {addToPortfolioModalIsOpen && (
        <AddToPortfolioModal
          isOpen={addToPortfolioModalIsOpen}
          listName={activeTab}
          onClose={onClose} // Close modal function
          onSave={(symbol, quantity, purchaseDate, purchasePrice) => {
            const newSecurity = {
              symbol,
              quantity,
              purchaseDate,
              purchasePrice,
            };
            if (activeListType === "portfolios") {
              addToList(newSecurity);
            }
          }}
        />
      )}
      {addToWatchlistModalIsOpen && (
        <AddToWatchlistModal
          isOpen={addToWatchlistModalIsOpen}
          listName={activeTab}
          onClose={onClose} // Close modal function
          onSave={(symbol) => {
            const newSecurity = {
              symbol,
            };
            if (activeListType === "watchlists") {
              addToWatchlist(newSecurity);
            }
          }}
        />
      )}
      {addWatchlistModalIsOpen && (
        <AddWatchlistModal
          onCancel={onCloseWatchlist}
          onSave={(watchlistName) => {
            // Handle saving new watchlist
            handleSaveWatchlist(watchlistName);
            onClose();
          }}
        />
      )}
      {newPortfolioModalOpen && (
        <NewPortfolioModal
          onCancel={() => setNewPortfolioModalOpen(false)}
          onSave={handleSaveNewPortfolio}
        />
      )}
      <div className="portfolio-container">
        <div className="portfolio-header">
          <div className="portfolio-header-item">
            <Link to="/">
              <span className="label home-label">HOME</span>
            </Link>
            <FaAngleRight className="arrow1" />

            <span
              className={`toggle-type ${
                activeListType === "watchlists" ? "active-list" : ""
              }`}
              onClick={() => handleListClick("watchlists")}
            >
              {" "}
              Watchlist
            </span>

            <span
              className={`toggle-type ${
                activeListType === "portfolios" ? "active-list" : ""
              }`}
              onClick={() => handleListClick("portfolios")}
            >
              {" "}
              Portfolios
            </span>
          </div>
          <div className="portfolio-header-item">
            {activeListType === "watchlists" &&
              watchlists.map((watchlist) => (
                <div
                  key={watchlist.id}
                  className={`tab ${
                    activeTab === watchlist.title
                      ? "active-tab"
                      : "inactive-tab"
                  }`}
                  onClick={() => handleTabClick(watchlist.id)}
                >
                  <div className="tab-inner">
                    <FaList size={18} />
                    <span className="label">{watchlist.title}</span>
                    <span className="count">0</span>
                  </div>
                </div>
              ))}
            <div className="add-list-div">
              {activeListType === "watchlists" && (
                <>
                  <button
                    disabled={addToWatchlistDisabled}
                    className={`add-list ${addToWatchlistDisabled ? "disabled" : ""}`}
                    onClick={() => setAddWatchlistModalIsOpen(true)}
                  >
                    <FaPlus size={18} />
                    <span className="label">New list</span>
                  </button>
                  {addToWatchlistDisabled && <Tooltip />}
                </>
              )}
              {activeListType === "portfolios" && (
                <button
                  disabled={addPortfolioDisabled}
                  className={`add-list ${addPortfolioDisabled ? "disabled" : ""}`}
                  onClick={() => setNewPortfolioModalOpen(true)}
                >
                  <FaPlus size={18} />
                  <span className="label">New Portfolio</span>
                </button>
              )}
            </div>

            {activeListType === "portfolios" &&
              portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className={`tab ${
                    activeTab === portfolio.title
                      ? "active-tab"
                      : "inactive-tab"
                  }`}
                  onClick={() => handleTabClick(portfolio.id)}
                >
                  <div className="tab-inner">
                    <FaChartLine size={18} />
                    <span className="label">{portfolio.title}</span>
                    <span className="count">0</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        {/*  {activeListType === "watchlist" && (
          <div>
            <Watchlist name="123list" data={[]} />
          </div>
        )} */}
        {activeListType === "portfolios" && (
          <div className="main-container">
            <PortfolioContent
              portfolio={activePortfolio}
              portfolioName={activeTab}
              handleDropdownOptionClick={(option: string) =>
                handleDropdownOptionClick(option)
              }
              handleDropdownToggle={handleDropdownToggle}
              showDropdown={showDropdown}
              openAddToPortfolioModal={openAddToPortfolioModal}
            />
          </div>
        )}
        {activeListType === "watchlists" && (
          <div className="main-container">
            <WatchlistContent
              watchlistName={activeTab}
              handleDropdownOptionClick={(option: string) =>
                handleDropdownOptionClick(option)
              }
              handleDropdownToggle={handleDropdownToggle}
              showDropdown={showDropdown}
              openAddToWatchlistModal={openAddToWatchlistModal}
            />
            {activeWatchlist && (
              <WatchlistPerformance
                watchlist={activeWatchlist}
                onRemoveSecurity={(s) => {
                  removeSecurityFromWatchlist(activeWatchlist.id, s);
                  addNotification(`${s.symbol} removed`, "success");
                }}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Portfolio;
