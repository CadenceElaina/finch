import Layout from "../components/layout/Layout";
import Footer from "../components/Footer";
import { useDemoMode } from "../context/DemoModeContext";
import { useAi } from "../context/AiContext";
import "./Settings.css";

const Settings = () => {
  const { isDemoMode, exitDemoMode, enterDemoMode } = useDemoMode();
  const { creditsRemaining, maxCredits, configured } = useAi();

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
