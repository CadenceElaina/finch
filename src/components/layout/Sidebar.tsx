import React, { useState } from "react";

import { BsHouseFill, BsListUl } from "react-icons/bs";
import { IoMdAddCircleOutline, IoMdSettings } from "react-icons/io";
import { MdManageSearch, MdOutlineInsertChart } from "react-icons/md";
import SidebarItem from "./SidebarItem";
import { SidebarProps } from "./types";
import { FaUncharted } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./Layout.css";
import { usePortfolios } from "../../context/PortfoliosContext";
import { useWatchlists } from "../../context/WatchlistContext";
import { Link, useNavigate } from "react-router-dom";
import portfolioService from "../../services/portfolios";
import watchlistService from "../../services/watchlist";
import NewPortfolioModal from "../modals/AddPortfolioModal";
import AddWatchlistModal from "../modals/AddWatchlistModal";

const Sidebar: React.FC<SidebarProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { portfolios, appendPortfolio } = usePortfolios();
  const { watchlists, appendWatchlist } = useWatchlists();
  const [portfolioModal, setPortfolioModal] = useState(false);
  const [addWatchlistModalIsOpen, setAddWatchlistModalIsOpen] = useState(false);
  const auth = !!user;
  const settings = `/${user?.username}/settings/`;
  const login = "/login";
  const topItems = [
    {
      icon: BsHouseFill,
      label: "Home",
      href: "/",
      auth: true, // We dont want to be rerouted to login if click home
    },
    {
      icon: MdManageSearch,
      label: "Market Trends",
      href: "/market-trends/indexes",
      auth: true, //does not require user signed in
    },
  ];
  const bottomItems = [
    {
      icon: MdOutlineInsertChart,
      label: "portfolio",
      href: "/portfolio",
      auth: auth,
    },
    {
      icon: BsListUl,
      label: "watchlist",
      href: "/portfolio",
      auth: auth,
    },
    {
      icon: IoMdSettings,
      label: "settings",
      href: `${user ? settings : login}`,
      auth: auth,
    },
  ];

  const canCreateNewPortfolio = () => {
    // Check if the user has less than 3 portfolios
    const userPortfolios = portfolios.filter(
      (portfolio) => portfolio.author === user?.name
    );
    return userPortfolios.length < 3;
  };
  const canCreateNewWatchlist = () => {
    // Check if the user has less than 3 portfolios
    const userWatchlists = watchlists.filter(
      (watchlist) => watchlist.author === user?.name
    );
    return userWatchlists.length < 3;
  };
  const closeModal = () => {
    setPortfolioModal(false);
    setAddWatchlistModalIsOpen(false);
  };
  const handleSavePortfolio = async (portfolioName: string) => {
    // Handle saving the portfolio data (you can implement this part)
    const newPortfolio = {
      title: portfolioName,
      author: user?.name,
    };
    const response = await portfolioService.create(newPortfolio);
    // appendPortfolio to our context state
    appendPortfolio({
      id: response.id,
      title: response.title,
      author: response.author,
    });

    closeModal();
    navigate(`/portfolio/${response.id}`);
  };

  const handleSaveWatchlist = async (watchlistName: string) => {
    const newWatchlist = {
      title: watchlistName,
      author: user?.name,
    };
    const response = await watchlistService.create(newWatchlist);
    appendWatchlist({
      id: response.id,
      title: response.title,
      author: response.author,
    });

    closeModal();
  };

  const addList = (listType: string) => {
    if (!user) {
      navigate("/login");
    }
    if (listType === "portfolio" && canCreateNewPortfolio()) {
      setPortfolioModal(true);
    }
    if (listType === "watchlist" && canCreateNewWatchlist()) {
      setAddWatchlistModalIsOpen(true);
    }
  };
  const usersPortfolios = portfolios.filter((p) => p.author === user?.name);
  const usersWatchlists = watchlists.filter((w) => w.author === user?.name);
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
            auth={auth}
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
        {user &&
          usersPortfolios.map((p) => (
            <Link to={"/portfolio"}>
              <li key={p.id} className="sidebar-item">
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
        {user &&
          usersWatchlists.map((w) => (
            <Link to={`/portfolio/${w.id}`} key={w.id}>
              <li className="sidebar-item">
                <div className="sidebar-button-icon">
                  <MdOutlineInsertChart size={24} />
                </div>
                <div className="sidebar-button-label">{w.title}</div>
              </li>
            </Link>
          ))}
        <div className="divider"></div>
        {bottomItems.map((item) => (
          <SidebarItem
            key={item.href}
            auth={auth}
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
