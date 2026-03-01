import Layout from "../components/layout/Layout";
import Footer from "../components/Footer";
import { useWatchlists } from "../context/WatchlistContext";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import "./Watchlist.css";

const Watchlist = () => {
  const { watchlists } = useWatchlists();

  return (
    <Layout>
      <div className="watchlist-page">
        <h1 className="watchlist-page-heading">Your Watchlists</h1>

        {watchlists.length === 0 ? (
          <div className="watchlist-empty">
            <p className="watchlist-empty-text">
              You don't have any watchlists yet.
            </p>
            <p className="watchlist-empty-hint">
              Create one from the sidebar to start tracking stocks.
            </p>
          </div>
        ) : (
          <div className="watchlist-list">
            {watchlists.map((w) => {
              const count = w.securities?.length ?? 0;
              return (
                <Link
                  key={w.id}
                  to={`/watchlist/${w.id}`}
                  className="watchlist-card"
                >
                  <div className="watchlist-card-info">
                    <span className="watchlist-card-title">{w.title}</span>
                    <span className="watchlist-card-meta">
                      {count} {count === 1 ? "security" : "securities"}
                    </span>
                  </div>
                  <FaChevronRight className="watchlist-card-arrow" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </Layout>
  );
};

export default Watchlist;
