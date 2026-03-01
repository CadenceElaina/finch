import { useState } from "react";
import Layout from "../components/layout/Layout";
import Footer from "../components/Footer";
import { useDemoMode } from "../context/DemoModeContext";
import { useAi } from "../context/AiContext";
import { usePortfolios } from "../context/PortfoliosContext";
import { useWatchlists } from "../context/WatchlistContext";
import { useTheme } from "../context/ThemeContext";
import "./Settings.css";

const APP_VERSION = "0.15.0";
const CACHE_PREFIX = "finch_cache_";

const Settings = () => {
  const { isDemoMode, exitDemoMode, enterDemoMode } = useDemoMode();
  const { creditsRemaining, maxCredits, configured } = useAi();
  const { portfolios } = usePortfolios();
  const { watchlists } = useWatchlists();
  const { theme, toggleTheme } = useTheme();
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleDemoToggle = () => {
    if (isDemoMode) {
      exitDemoMode();
    } else {
      enterDemoMode();
    }
    // All contexts + react-query caches hold stale data from the previous mode.
    // A reload is the simplest way to ensure every fetch re-runs against the
    // new demo/live flag.  Short delay lets the localStorage write flush first.
    setTimeout(() => window.location.assign("/"), 150);
  };

  const handleClearCache = () => {
    // Remove all finch_cache_ keys (API caches), preserve portfolios/watchlists/preferences
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const storageStats = () => {
    let cacheEntries = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) cacheEntries++;
    }
    return { cacheEntries, portfolios: portfolios.length, watchlists: watchlists.length };
  };

  const stats = storageStats();

  return (
    <Layout>
      <div className="settings-container">
        <div className="settings-heading">Settings</div>

        {/* Data Source */}
        <section className="settings-section">
          <div className="settings-section-title">Data Source</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Demo Mode</div>
              <div className="settings-row-desc">
                {isDemoMode
                  ? "Showing static demo data. Prices are a frozen snapshot and won't update."
                  : "Using live API data. Demo mode activates automatically if the API quota is exhausted."}
              </div>
            </div>
            <button
              className={`settings-toggle ${isDemoMode ? "active" : ""}`}
              onClick={handleDemoToggle}
              aria-label="Toggle demo mode"
            >
              <span className="settings-toggle-knob" />
            </button>
          </div>
        </section>

        {/* Appearance */}
        <section className="settings-section">
          <div className="settings-section-title">Appearance</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Theme</div>
              <div className="settings-row-desc">
                {theme === "dark"
                  ? "Dark mode is active. Easier on the eyes in low light."
                  : "Light mode is active. Classic bright appearance."}
              </div>
            </div>
            <button
              className={`settings-toggle ${theme === "light" ? "active" : ""}`}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <span className="settings-toggle-knob" />
            </button>
          </div>
        </section>

        {/* AI */}
        {configured && (
          <section className="settings-section">
            <div className="settings-section-title">AI Research</div>
            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Daily Credits</div>
                <div className="settings-row-desc">
                  {creditsRemaining} of {maxCredits} remaining today. Resets at
                  midnight.
                </div>
              </div>
              <div className="settings-credits-pill">
                ⚡ {creditsRemaining}/{maxCredits}
              </div>
            </div>
          </section>
        )}

        {/* Storage & Cache */}
        <section className="settings-section">
          <div className="settings-section-title">Storage</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Local Data</div>
              <div className="settings-row-desc">
                {stats.portfolios} portfolio{stats.portfolios !== 1 ? "s" : ""},{" "}
                {stats.watchlists} watchlist{stats.watchlists !== 1 ? "s" : ""},{" "}
                {stats.cacheEntries} cached API response{stats.cacheEntries !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Clear API Cache</div>
              <div className="settings-row-desc">
                Remove cached market data to force fresh API calls. Your portfolios
                and watchlists are preserved.
              </div>
            </div>
            <button
              className="settings-action-btn"
              onClick={handleClearCache}
              disabled={cacheCleared}
            >
              {cacheCleared ? "Cleared ✓" : "Clear"}
            </button>
          </div>
        </section>

        {/* About */}
        <section className="settings-section">
          <div className="settings-section-title">About</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Finch</div>
              <div className="settings-row-desc">
                Google Finance-inspired market intelligence dashboard. Built with
                React, TypeScript, and Gemini AI.
              </div>
            </div>
            <div className="settings-version-pill">v{APP_VERSION}</div>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Market Data</div>
              <div className="settings-row-desc">
                Powered by Yahoo Finance and Seeking Alpha via RapidAPI. Prices
                may be delayed up to 15 minutes.
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </Layout>
  );
};

export default Settings;
