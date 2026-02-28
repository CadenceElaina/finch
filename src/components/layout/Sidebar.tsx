import React, { useState } from "react";

import { BsHouseFill, BsListUl } from "react-icons/bs";
import { IoMdAddCircleOutline, IoMdSettings } from "react-icons/io";
import { MdManageSearch, MdOutlineInsertChart } from "react-icons/md";
import SidebarItem from "./SidebarItem";
import { SidebarProps } from "./types";
import { FaUncharted } from "react-icons/fa";
import "./Layout.css";
import { usePortfolios } from "../../context/PortfoliosContext";
import { useWatchlists } from "../../context/WatchlistContext";
import { Link, useNavigate } from "react-router-dom";
import { portfolioStorage, watchlistStorage } from "../../services/storage";
import NewPortfolioModal from "../modals/AddPortfolioModal";
import AddWatchlistModal from "../modals/AddWatchlistModal";

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { portfolios, appendPortfolio } = usePortfolios();
  const { watchlists, appendWatchlist } = useWatchlists();
  const [portfolioModal, setPortfolioModal] = useState(false);
  const [addWatchlistModalIsOpen, setAddWatchlistModalIsOpen] = useState(false);
  const settings = "/settings";
  const topItems = [
    {
      icon: BsHouseFill,
      label: "Home",
      href: "/",
      auth: true,
    },
    {
      icon: MdManageSearch,
      label: "Market Trends",
      href: "/market-trends/indexes",
      auth: true,
    },
  ];
  const bottomItems = [
    {
      icon: IoMdSettings,
      label: "settings",
      href: settings,
      auth: true,
    },
  ];

  const canCreateNewPortfolio = () => {
    return portfolios.length < 3;
  };
  const canCreateNewWatchlist = () => {
    return watchlists.length < 3;
  };
  const closeModal = () => {
    setPortfolioModal(false);
    setAddWatchlistModalIsOpen(false);
  };
  const handleSavePortfolio = (portfolioName: string) => {
    const response = portfolioStorage.create({
      title: portfolioName,
    });
    appendPortfolio(response);

    closeModal();
    navigate(`/portfolio/${response.id}`);
  };

  const handleSaveWatchlist = (watchlistName: string) => {
    const response = watchlistStorage.create({
      title: watchlistName,
    });
    appendWatchlist(response);

    closeModal();
  };

  const addList = (listType: string) => {
    if (listType === "portfolio" && canCreateNewPortfolio()) {
      setPortfolioModal(true);
    }
    if (listType === "watchlist" && canCreateNewWatchlist()) {
      setAddWatchlistModalIsOpen(true);
    }
  };
  const exceedsWatchlistLimit = watchlists.length >= 3;
  const exceedsPortfoliosLimit = portfolios.length >= 3;
  return (
    <>
      {portfolioModal && (
        <NewPortfolioModal onCancel={closeModal} onSave={handleSavePortfolio} />
      )}
      {addWatchlistModalIsOpen && (
        <AddWatchlistModal
          onCancel={closeModal}
          onSave={(watchlistName) => {
            handleSaveWatchlist(watchlistName);
            closeModal();
          }}
        />
      )}
      <span className="logo-side">
        {" "}
        <FaUncharted size={24} />
        <span>Finch</span>
      </span>
      <div className="sidebar-items">
        {topItems.map((item) => (
          <SidebarItem
            key={item.href}
            auth={true}
            href={item.href}
            icon={item.icon}
            label={item.label}
          />
        ))}
        <div className="divider"></div>
        <li className="sidebar-heading">
          <div className="sidebar-heading-label">Portfolios</div>
          <div className="sidebar-heading-icon">
            {!exceedsPortfoliosLimit && (
              <div className="inner-icon">
                <IoMdAddCircleOutline
                  size={24}
                  onClick={() => addList("portfolio")}
                />
              </div>
            )}
          </div>
        </li>
        {portfolios.map((p) => (
            <Link to={`/portfolio/${p.id}`} key={p.id} onClick={onClose}>
              <li className="sidebar-item">
                <div className="sidebar-button-icon">
                  <MdOutlineInsertChart size={24} />
                </div>
                <div className="sidebar-button-label">{p.title}</div>
              </li>
            </Link>
          ))}

        <li className="sidebar-heading">
          <div className="sidebar-heading-label">Watchlists</div>
          <div className="sidebar-heading-icon">
            {!exceedsWatchlistLimit && (
              <div className="inner-icon">
                <IoMdAddCircleOutline
                  size={24}
                  onClick={() => addList("watchlist")}
                />
              </div>
            )}
          </div>
        </li>
        {watchlists.map((w) => (
            <Link to={`/watchlist/${w.id}`} key={w.id} onClick={onClose}>
              <li className="sidebar-item">
                <div className="sidebar-button-icon">
                  <BsListUl size={24} />
                </div>
                <div className="sidebar-button-label">{w.title}</div>
              </li>
            </Link>
          ))}
        <div className="divider"></div>
        {bottomItems.map((item) => (
          <SidebarItem
            key={item.label}
            auth={true}
            href={item.href}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>
    </>
  );
};

export default Sidebar;
