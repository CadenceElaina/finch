import Layout from "../components/layout/Layout";
import Footer from "../components/Footer";
import { useWatchlists } from "../context/WatchlistContext";
import { Link } from "react-router-dom";

const Watchlist = () => {
  const { watchlists } = useWatchlists();

  return (
    <Layout>
      <div className="content-wrapper">
        <div
          role="heading"
          style={{ fontSize: "1.5rem", fontWeight: 600, padding: "1rem 0" }}
        >
          Your Watchlists
        </div>
        {watchlists.length === 0 ? (
          <p style={{ color: "var(--text-secondary, #999)" }}>
            You don't have any watchlists yet. Create one from the sidebar.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {watchlists.map((w) => (
              <li key={w.id} style={{ padding: "0.5rem 0" }}>
                <Link
                  to={`/portfolio/${w.id}`}
                  style={{ color: "var(--text-primary, #e0e0e0)" }}
                >
                  {w.title} ({w.securities?.length ?? 0} securities)
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footer />
    </Layout>
  );
};

export default Watchlist;
