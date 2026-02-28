import "./App.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
} from "react-router-dom";
import Home from "./pages/Home";
import Portfolio from "./components/portfolio/Portfolio";
import Help from "./pages/footer/Help";
import Feedback from "./pages/footer/Feedback";
import Privacy from "./pages/footer/Privacy";
import Terms from "./pages/footer/Terms";
import Disclaimer from "./pages/footer/Disclaimer";
import Watchlist from "./pages/Watchlist";
import Settings from "./pages/Settings";
import Quote from "./pages/quote/Quote";
import MarketIndexes from "./components/market-trends/MarketIndexes";
import MostActive from "./components/market-trends/MostActive";
import Gainers from "./components/market-trends/Gainers";
import Losers from "./components/market-trends/Losers";
import Trending from "./components/market-trends/Trending";
import Layout from "./components/layout/Layout";

const NotFound = () => (
  <Layout>
    <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>404</h1>
      <p style={{ marginBottom: "1.5rem" }}>Page not found</p>
      <Link to="/" style={{ color: "#1a73e8" }}>Go home</Link>
    </div>
  </Layout>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home portfolios={[]} />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:id" element={<Portfolio />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/watchlist/:id" element={<Portfolio />} />
        <Route path="/quote/:quote" element={<Quote />} />
        <Route path="/market-trends/indexes" element={<MarketIndexes />} />
        <Route path="/market-trends/active" element={<MostActive />} />
        <Route path="/market-trends/gainers" element={<Gainers />} />
        <Route path="/market-trends/losers" element={<Losers />} />
        <Route path="/market-trends/trending" element={<Trending />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
