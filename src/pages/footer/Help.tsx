import Layout from "../../components/layout/Layout";
import Footer from "../../components/Footer";
import "./FooterPage.css";

const Help = () => {
  return (
    <Layout>
      <div className="footer-page">
        <h1>Help</h1>
        <p className="page-subtitle">Get the most out of Finch</p>

        <div className="help-section">
          <h3>Search for Stocks</h3>
          <p>
            Use the search bar on the home page to look up any publicly traded
            company by name or ticker symbol. Click a result to view the full
            quote page with charts, news, and AI analysis.
          </p>
        </div>

        <div className="help-section">
          <h3>Manage Watchlists</h3>
          <p>
            Create up to 3 watchlists to track your favorite stocks. Add
            securities from any quote page or the market trends tables using the
            + icon. All watchlist data is stored locally in your browser.
          </p>
        </div>

        <div className="help-section">
          <h3>Track Portfolios</h3>
          <p>
            Create up to 3 portfolios with holdings including purchase price and
            quantity. Finch calculates your total value, cost basis, and
            gain/loss in real time. Portfolio data is stored locally in your browser.
          </p>
        </div>

        <div className="help-section">
          <h3>AI Research</h3>
          <p>
            Finch includes AI-powered market analysis via Google Gemini. You get
            10 AI credits per day — each market overview, stock snapshot, or
            chat question costs 1 credit. Credits reset at midnight.
          </p>
        </div>

        <div className="help-section">
          <h3>Demo Mode</h3>
          <p>
            When API rate limits are reached, Finch automatically switches to
            demo mode with static sample data. You can toggle demo mode on or
            off in Settings. A "DEMO" badge appears in the header when demo mode
            is active.
          </p>
        </div>

        <h2>Data Storage</h2>
        <p>
          All user data (portfolios, watchlists, preferences, AI credits) is
          stored in your browser's localStorage. Clearing your browser data
          will reset all Finch data. No data is sent to any server.
        </p>
      </div>
      <Footer />
    </Layout>
  );
};

export default Help;
