import { useEffect, useState } from "react";
import { FaList, FaChartLine, FaPlus, FaAngleRight } from "react-icons/fa";
import Layout from "../layout/Layout";
import "./Portfolio.css";
import { usePortfolios } from "../../context/PortfoliosContext";
import AddToPortfolioModal from "../../components/modals/AddToPortfolioModal";
import { Link, useNavigate, useParams } from "react-router-dom";
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
} from "../../types/types";
import { useNotification } from "../../context/NotificationContext";
import Notification from "../Notification";
import PortfolioSummary from "../ai/PortfolioSummary";
import ResearchChat from "../ai/ResearchChat";
import RenameModal from "../modals/RenameModal";
import Footer from "../Footer";

/**
 * Unified "Your Lists" page — Google Finance Beta style.
 * All watchlists and portfolios appear as tabs in one horizontal row.
 */

interface UnifiedTab {
  id: string;
  title: string;
  count: number;
  type: "watchlist" | "portfolio";
}

const Portfolio = () => {
  const { addNotification } = useNotification();
  const [showDropdown, setShowDropdown] = useState(false);
  const [addToPortfolioModalIsOpen, setAddToPortfolioModalIsOpen] = useState(false);
  const [addToWatchlistModalIsOpen, setAddToWatchlistModalIsOpen] = useState(false);
  const [newListModalOpen, setNewListModalOpen] = useState<"watchlist" | "portfolio" | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);

  const { portfolios, removePortfolio, renamePortfolio, addSecurityToPortfolio, removeSecurityFromPortfolio, appendPortfolio } = usePortfolios();
  const { watchlists, addSecurityToWatchlist, appendWatchlist, removeWatchlist, renameWatchlist, removeSecurityFromWatchlist } = useWatchlists();

  const { id } = useParams();
  const navigate = useNavigate();

  // ── Build unified tab list ──
  const tabs: UnifiedTab[] = [
    ...watchlists.map((w) => ({
      id: w.id,
      title: w.title,
      count: w.securities?.length ?? 0,
      type: "watchlist" as const,
    })),
    ...portfolios.map((p) => ({
      id: p.id,
      title: p.title,
      count: p.securities?.length ?? 0,
      type: "portfolio" as const,
    })),
  ];

  // ── Determine active tab ──
  const activeTab = tabs.find((t) => t.id === id) ?? tabs[0] ?? null;
  const activeWatchlist = activeTab?.type === "watchlist" ? watchlists.find((w) => w.id === activeTab.id) : undefined;
  const activePortfolio = activeTab?.type === "portfolio" ? portfolios.find((p) => p.id === activeTab.id) : undefined;

  // Auto-navigate to first tab if no id or invalid id
  useEffect(() => {
    if (tabs.length === 0) return;
    if (!id || !tabs.find((t) => t.id === id)) {
      const firstTab = tabs[0];
      const prefix = firstTab.type === "watchlist" ? "/watchlist" : "/portfolio";
      navigate(`${prefix}/${firstTab.id}`, { replace: true });
    }
  }, [id, tabs.length]);

  const handleTabClick = (tab: UnifiedTab) => {
    const prefix = tab.type === "watchlist" ? "/watchlist" : "/portfolio";
    navigate(`${prefix}/${tab.id}`);
  };

  // ── CRUD handlers ──
  const handleDropdownOptionClick = (option: string) => {
    if (!activeTab) return;
    if (option === "remove") {
      if (activeTab.type === "portfolio") {
        const p = portfolios.find((p) => p.id === activeTab.id);
        if (p) {
          removePortfolio(p);
          addNotification(`${p.title} removed`, "success");
          const remaining = portfolios.filter((x) => x.id !== p.id);
          if (remaining.length > 0) navigate(`/portfolio/${remaining[0].id}`);
          else if (watchlists.length > 0) navigate(`/watchlist/${watchlists[0].id}`);
          else navigate("/");
        }
      } else {
        const w = watchlists.find((w) => w.id === activeTab.id);
        if (w) {
          removeWatchlist(w);
          addNotification(`${w.title} removed`, "success");
          const remaining = watchlists.filter((x) => x.id !== w.id);
          if (remaining.length > 0) navigate(`/watchlist/${remaining[0].id}`);
          else if (portfolios.length > 0) navigate(`/portfolio/${portfolios[0].id}`);
          else navigate("/");
        }
      }
    }
    if (option === "rename") setRenameModalOpen(true);
    setShowDropdown(false);
  };

  const handleSaveNewList = (name: string, type: "watchlist" | "portfolio") => {
    if (type === "watchlist") {
      const response = watchlistStorage.create({ title: name });
      appendWatchlist(response);
      addNotification(`${response.title} created!`, "success");
      navigate(`/watchlist/${response.id}`);
    } else {
      const response = portfolioStorage.create({ title: name });
      appendPortfolio(response);
      addNotification(`${response.title} created!`, "success");
      navigate(`/portfolio/${response.id}`);
    }
    setNewListModalOpen(null);
  };

  const exceedsLimit = (type: "watchlist" | "portfolio") =>
    type === "watchlist" ? watchlists.length >= 3 : portfolios.length >= 3;

  return (
    <Layout>
      <Notification />

      {/* ── Modals ── */}
      {addToPortfolioModalIsOpen && activePortfolio && (
        <AddToPortfolioModal
          isOpen={true}
          listName={activePortfolio.title}
          onClose={() => setAddToPortfolioModalIsOpen(false)}
          onSave={(symbol, quantity, purchaseDate, purchasePrice) => {
            addSecurityToPortfolio(activePortfolio.id, { symbol, quantity, purchaseDate, purchasePrice });
            addNotification(`${symbol.toUpperCase()} added to ${activePortfolio.title}!`, "success");
            setAddToPortfolioModalIsOpen(false);
          }}
        />
      )}
      {addToWatchlistModalIsOpen && activeWatchlist && (
        <AddToWatchlistModal
          isOpen={true}
          listName={activeWatchlist.title}
          onClose={() => setAddToWatchlistModalIsOpen(false)}
          onSave={(symbol) => {
            addSecurityToWatchlist(activeWatchlist.id, { symbol } as WatchlistSecurity);
            addNotification(`${symbol.toUpperCase()} added to ${activeWatchlist.title}!`, "success");
            setAddToWatchlistModalIsOpen(false);
          }}
        />
      )}
      {newListModalOpen === "watchlist" && (
        <AddWatchlistModal
          onCancel={() => setNewListModalOpen(null)}
          onSave={(name) => handleSaveNewList(name, "watchlist")}
        />
      )}
      {newListModalOpen === "portfolio" && (
        <NewPortfolioModal
          onCancel={() => setNewListModalOpen(null)}
          onSave={(name) => handleSaveNewList(name, "portfolio")}
        />
      )}
      {renameModalOpen && activeTab && (
        <RenameModal
          currentName={activeTab.title}
          itemType={activeTab.type}
          onCancel={() => setRenameModalOpen(false)}
          onSave={(newName) => {
            if (activeTab.type === "portfolio" && activePortfolio) {
              renamePortfolio(activePortfolio.id, newName);
            } else if (activeTab.type === "watchlist" && activeWatchlist) {
              renameWatchlist(activeWatchlist.id, newName);
            }
            addNotification(`Renamed to ${newName}`, "success");
            setRenameModalOpen(false);
          }}
        />
      )}

      <div className="lists-page">
        {/* ── Breadcrumb ── */}
        <div className="lists-breadcrumb">
          <Link to="/">HOME</Link>
          <FaAngleRight size={10} />
          <span>YOUR LISTS</span>
        </div>

        {/* ── Unified tab bar ── */}
        <div className="lists-tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`lists-tab ${activeTab?.id === tab.id ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab.type === "watchlist" ? <FaList size={14} /> : <FaChartLine size={14} />}
              <span className="lists-tab-name">{tab.title}</span>
              <span className="lists-tab-count">{tab.count}</span>
            </button>
          ))}
          <div className="lists-new-btns">
            {!exceedsLimit("watchlist") && (
              <button className="lists-new-btn" onClick={() => setNewListModalOpen("watchlist")}>
                <FaPlus size={12} />
                <span>New list</span>
              </button>
            )}
            {!exceedsLimit("portfolio") && (
              <button className="lists-new-btn" onClick={() => setNewListModalOpen("portfolio")}>
                <FaPlus size={12} />
                <span>New portfolio</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Empty state ── */}
        {tabs.length === 0 && (
          <div className="lists-empty">
            <FaList size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
            <p className="lists-empty-title">No lists yet</p>
            <p className="lists-empty-sub">Create a watchlist or portfolio to get started</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="lists-cta-btn" onClick={() => setNewListModalOpen("watchlist")}>
                <FaPlus size={12} /> New Watchlist
              </button>
              <button className="lists-cta-btn" onClick={() => setNewListModalOpen("portfolio")}>
                <FaPlus size={12} /> New Portfolio
              </button>
            </div>
          </div>
        )}

        {/* ── Active list content ── */}
        {activeTab && (
          <div className="lists-content">
            {/* ── Watchlist view ── */}
            {activeTab.type === "watchlist" && activeWatchlist && (
              <>
                <WatchlistContent
                  watchlistName={activeWatchlist.title}
                  handleDropdownOptionClick={handleDropdownOptionClick}
                  handleDropdownToggle={() => setShowDropdown(!showDropdown)}
                  showDropdown={showDropdown}
                  openAddToWatchlistModal={() => setAddToWatchlistModalIsOpen(true)}
                />
                <WatchlistPerformance
                  watchlist={activeWatchlist}
                  onRemoveSecurity={(s) => {
                    removeSecurityFromWatchlist(activeWatchlist.id, s);
                    addNotification(`${s.symbol} removed`, "success");
                  }}
                />
              </>
            )}

            {/* ── Portfolio view ── */}
            {activeTab.type === "portfolio" && activePortfolio && (
              <>
                <PortfolioContent
                  portfolio={activePortfolio}
                  portfolioName={activePortfolio.title}
                  handleDropdownOptionClick={handleDropdownOptionClick}
                  handleDropdownToggle={() => setShowDropdown(!showDropdown)}
                  showDropdown={showDropdown}
                  openAddToPortfolioModal={() => setAddToPortfolioModalIsOpen(true)}
                  onRemoveSecurity={(symbol) => {
                    removeSecurityFromPortfolio(activePortfolio.id, symbol);
                    addNotification(`${symbol.toUpperCase()} removed`, "success");
                  }}
                />
                <PortfolioSummary portfolio={activePortfolio} />
              </>
            )}

            {/* ── AI Chat ── */}
            <ResearchChat contextHint={activeTab?.title ?? "your lists"} />
          </div>
        )}
        <Footer />
      </div>
    </Layout>
  );
};

export default Portfolio;
