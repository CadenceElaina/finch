/**
 * QuoteListsColumn — Google Finance Beta-style left column
 * ─────────────────────────────────────────────────────────
 * Shows the user's watchlist + portfolio items with price &
 * sparkline while they research a stock. Mirrors the "Lists"
 * panel from Google Finance Beta.
 */

import React, { useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useWatchlists } from "../../context/WatchlistContext";
import { usePortfolios } from "../../context/PortfoliosContext";
import { useQueryClient } from "@tanstack/react-query";
import { getBatchQuotes } from "../search/quoteUtils";
import { quoteType } from "../search/types";
import { IoAddSharp, IoChevronUpSharp, IoChevronDownSharp } from "react-icons/io5";
import { WatchlistSecurity, Security } from "../../types/types";
import AddToWatchlistModal from "../modals/AddToWatchlist";
import AddToPortfolioModal from "../modals/AddToPortfolioModal";
import Sparkline from "./Sparkline";
import "./QuoteListsColumn.css";

const QuoteListsColumn: React.FC = () => {
  const { watchlists, addSecurityToWatchlist } = useWatchlists();
  const { portfolios, addSecurityToPortfolio } = usePortfolios();
  const queryClient = useQueryClient();

  const [quotes, setQuotes] = useState<Record<string, quoteType | null>>({});
  const [loading, setLoading] = useState(true);

  // Collapsed state for each section (key = watchlist/portfolio id)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Add-to-list modal state
  const [addWatchlistTarget, setAddWatchlistTarget] = useState<{ id: string; title: string } | null>(null);
  const [addPortfolioTarget, setAddPortfolioTarget] = useState<{ id: string; title: string } | null>(null);

  const toggleSection = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  // Gather all unique symbols
  const allSymbols = useMemo(() => {
    const syms = new Set<string>();
    watchlists.forEach((wl) =>
      wl.securities?.forEach((s) => syms.add(s.symbol))
    );
    portfolios.forEach((p) =>
      p.securities?.forEach((s) => syms.add(s.symbol))
    );
    return Array.from(syms);
  }, [watchlists, portfolios]);

  // Fetch quotes for all symbols
  useEffect(() => {
    if (allSymbols.length === 0) {
      setQuotes({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const batch = await getBatchQuotes(queryClient, allSymbols);
        if (!cancelled) setQuotes(batch);
      } catch (err) {
        console.warn("[QuoteListsColumn] batch fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [allSymbols.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't render if user has no lists at all
  const hasContent =
    watchlists.some((wl) => wl.securities && wl.securities.length > 0) ||
    portfolios.some((p) => p.securities && p.securities.length > 0);

  if (!hasContent && !loading) return null;

  const renderItem = (sym: string, _name?: string) => {
    const q = quotes[sym];
    const displayName = q?.name ?? _name ?? sym;
    const price = q?.price ?? 0;
    const pctChange = q?.percentChange ?? 0;
    const isUp = pctChange >= 0;

    return (
      <Link
        to={`/quote/${sym}`}
        state={[false, sym]}
        key={sym}
        className="qlc-item"
      >
        <div className="qlc-item-left">
          <span className="qlc-symbol">{sym}</span>
          <span className="qlc-name">{displayName}</span>
        </div>
        <div className="qlc-item-mid">
          <Sparkline up={isUp} />
        </div>
        <div className="qlc-item-right">
          <span className="qlc-price">${price.toFixed(2)}</span>
          <span className={`qlc-change ${isUp ? "positive" : "negative"}`}>
            {isUp ? "+" : ""}{pctChange.toFixed(2)}%
          </span>
        </div>
      </Link>
    );
  };

  return (
    <>
    <aside className="qlc-column">
      <div className="qlc-header">
        <Link to="/" className="qlc-title-link">Lists</Link>
      </div>

      {/* ── Watchlists ── */}
      {watchlists.map((wl) => {
        const isCollapsed = collapsed[`wl-${wl.id}`];
        const items = wl.securities ?? [];

        return (
          <div key={`wl-${wl.id}`} className="qlc-section">
            <div className="qlc-section-header">
              <Link
                to={`/watchlist/${wl.id}`}
                className="qlc-section-label"
              >
                {wl.title}
              </Link>
              <span className="qlc-section-controls">
                <IoAddSharp
                  size={16}
                  className="qlc-section-icon"
                  title={`Add to ${wl.title}`}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setAddWatchlistTarget({ id: wl.id, title: wl.title });
                  }}
                />
                <button
                  className="qlc-collapse-btn"
                  onClick={() => toggleSection(`wl-${wl.id}`)}
                  aria-label={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? (
                    <IoChevronDownSharp size={14} />
                  ) : (
                    <IoChevronUpSharp size={14} />
                  )}
                </button>
              </span>
            </div>
            {!isCollapsed && items.length > 0 && (
              <div className="qlc-items">
                {items.map((s) => renderItem(s.symbol, (s as WatchlistSecurity).name))}
              </div>
            )}
            {!isCollapsed && items.length === 0 && (
              <div className="qlc-empty">
                <button
                  className="qlc-empty-add"
                  onClick={() => setAddWatchlistTarget({ id: wl.id, title: wl.title })}
                >
                  + Add symbol
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Portfolios ── */}
      {portfolios.map((p) => {
        const isCollapsed = collapsed[`pf-${p.id}`];
        const items = p.securities ?? [];

        return (
          <div key={`pf-${p.id}`} className="qlc-section">
            <div className="qlc-section-header">
              <Link
                to={`/portfolio/${p.id}`}
                className="qlc-section-label"
              >
                {p.title}
              </Link>
              <span className="qlc-section-controls">
                <IoAddSharp
                  size={16}
                  className="qlc-section-icon"
                  title={`Add to ${p.title}`}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setAddPortfolioTarget({ id: p.id, title: p.title });
                  }}
                />
                <button
                  className="qlc-collapse-btn"
                  onClick={() => toggleSection(`pf-${p.id}`)}
                  aria-label={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? (
                    <IoChevronDownSharp size={14} />
                  ) : (
                    <IoChevronUpSharp size={14} />
                  )}
                </button>
              </span>
            </div>
            {!isCollapsed && items.length > 0 && (
              <div className="qlc-items">
                {items.map((s) => renderItem(s.symbol))}
              </div>
            )}
            {!isCollapsed && items.length === 0 && (
              <div className="qlc-empty">
                <button
                  className="qlc-empty-add"
                  onClick={() => setAddPortfolioTarget({ id: p.id, title: p.title })}
                >
                  + Add symbol
                </button>
              </div>
            )}
          </div>
        );
      })}
    </aside>

      {/* ── Add-to-watchlist modal (portaled to body) ── */}
      {addWatchlistTarget && createPortal(
        <AddToWatchlistModal
          isOpen={true}
          listName={addWatchlistTarget.title}
          existingSymbols={watchlists.find((w) => w.id === addWatchlistTarget.id)?.securities?.map((s: WatchlistSecurity) => s.symbol) ?? []}
          onClose={() => setAddWatchlistTarget(null)}
          onSave={(symbol: string) => {
            addSecurityToWatchlist(addWatchlistTarget.id, {
              symbol: symbol.toUpperCase(),
            } as WatchlistSecurity);
            setAddWatchlistTarget(null);
          }}
        />,
        document.body
      )}

      {/* ── Add-to-portfolio modal (portaled to body) ── */}
      {addPortfolioTarget && createPortal(
        <AddToPortfolioModal
          isOpen={true}
          listName={addPortfolioTarget.title}
          existingSymbols={portfolios.find((p) => p.id === addPortfolioTarget.id)?.securities?.map((s: Security) => s.symbol) ?? []}
          onClose={() => setAddPortfolioTarget(null)}
          onSave={(symbol: string, quantity: number, purchaseDate: string, purchasePrice: number) => {
            addSecurityToPortfolio(addPortfolioTarget.id, {
              symbol: symbol.toUpperCase(),
              quantity,
              purchaseDate,
              purchasePrice,
            } as Security);
            setAddPortfolioTarget(null);
          }}
        />,
        document.body
      )}
    </>
  );
};

export default QuoteListsColumn;
