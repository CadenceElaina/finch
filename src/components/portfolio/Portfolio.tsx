import React, { useEffect, useState } from "react";
import { FaList, FaChartLine, FaPlus, FaAngleRight } from "react-icons/fa";
import Layout from "../layout/Layout";
import "./Portfolio.css";
import { usePortfolios } from "../../context/PortfoliosContext";
import AddToPortfolioModal from "../../components/modals/AddToPortfolioModal";
import { Link, useNavigate, useParams } from "react-router-dom";
import AddWatchlistModal from "../modals/AddWatchlistModal";
import { useWatchlists } from "../../context/WatchlistContext";
import { useAuth } from "../../context/AuthContext";
import { watchlistStorage } from "../../services/storage";
import PortfolioContent from "./PortfolioContent";
import WatchlistContent from "./WatchlistContent";
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
  const { portfolios, removePortfolio, addSecurityToPortfolio } =
    usePortfolios();
  const { watchlists, addSecurityToWatchlist, appendWatchlist } =
    useWatchlists();

  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const usersPortfolios = portfolios.filter((p) => p.author === user?.name);
  const usersWatchlists = watchlists.filter((w) => w.author === user?.name);
  const addToWatchlistDisabled = usersWatchlists.length > 3;
  const firstWatchlist = usersWatchlists[0];
  const firstPortfolio = usersPortfolios[0];

  useEffect(() => {
    // Find the portfolio with the matching id and set activePortfolio
    if (activeListType === "portfolios") {
      const matchingPortfolio = portfolios.find((p) => p.id === id);
      if (matchingPortfolio) {
        setActivePortfolio(matchingPortfolio);
        setActiveTab(matchingPortfolio.title);
      }
    }
    if (activeListType === "watchlists") {
      const matchingWatchlist = watchlists.find((w) => w.id === id);
      if (matchingWatchlist) {
        setActiveWatchlist(matchingWatchlist);
        setActiveTab(matchingWatchlist.title);
      }
    }
  }, [activeListType, id, portfolios, watchlists]);

  const handleTabClick = (tab: React.SetStateAction<string>) => {
    navigate(`/portfolio/${tab}`);
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDropdownOptionClick = async (option: string) => {
    if (option === "remove" && activeTab !== "watchlist") {
      const removedPortfolio = portfolios.find((p) => p.title === activeTab);

      if (removedPortfolio) {
        removePortfolio(removedPortfolio);
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
      author: user?.name,
    });
    appendWatchlist(response);
    addNotification(`${response.title} added!`, "success");
    onCloseWatchlist();
  };

  const onCloseWatchlist = () => {
    setAddWatchlistModalIsOpen(false);
  };

  const handleListClick = (type: string) => {
    setActiveListType(`${type}`);
    if (type === "watchlists") {
      navigate(`/portfolio/${firstWatchlist.id}`);
    }
    if (type === "portfolios") {
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
              user &&
              usersWatchlists.map((watchlist) => (
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
              {addToWatchlistDisabled && activeListType === "watchlists" && (
                <>
                  <button
                    disabled={addToWatchlistDisabled}
                    className={`add-list ${
                      addToWatchlistDisabled ? "disabled" : ""
                    }`}
                    onClick={() => setAddWatchlistModalIsOpen(true)}
                  >
                    <FaPlus size={18} />
                    <span className="label">New list</span>
                  </button>{" "}
                  <Tooltip />
                </>
              )}
              {!addToWatchlistDisabled && activeListType && (
                <>
                  <button
                    disabled={addToWatchlistDisabled}
                    className={`add-list ${
                      addToWatchlistDisabled ? "disabled" : ""
                    }`}
                    onClick={() => setAddWatchlistModalIsOpen(true)}
                  >
                    <FaPlus size={18} />
                    <span className="label">New list</span>
                  </button>{" "}
                </>
              )}
            </div>

            {activeListType === "portfolios" &&
              user &&
              usersPortfolios.map((portfolio) => (
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
            <div>
              {activePortfolio?.securities?.map((s) => (
                <div key={s.symbol}>
                  {s.symbol}
                  {s.quantity}
                  {s.purchaseDate}
                  {s.purchasePrice}
                </div>
              ))}
            </div>
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
            <div>
              {activeWatchlist?.securities?.map((s) => (
                <div key={s.symbol}>
                  {s.symbol}
                  {s.quantity}
                  {s.purchaseDate}
                  {s.purchasePrice}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Portfolio;
