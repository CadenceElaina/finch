import "./App.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
} from "react-router-dom";
import Home from "./pages/Home";
import Layout from "./components/layout/Layout";
import { Analytics } from "@vercel/analytics/react";

const News = lazy(() => import("./pages/News"));
const Portfolio = lazy(() => import("./components/portfolio/Portfolio"));
const Settings = lazy(() => import("./pages/Settings"));
const Quote = lazy(() => import("./pages/quote/Quote"));
const MarketIndexes = lazy(() => import("./components/market-trends/MarketIndexes"));
const MostActive = lazy(() => import("./components/market-trends/MostActive"));
const Gainers = lazy(() => import("./components/market-trends/Gainers"));
const Losers = lazy(() => import("./components/market-trends/Losers"));
const Trending = lazy(() => import("./components/market-trends/Trending"));
const Help = lazy(() => import("./pages/footer/Help"));
const Feedback = lazy(() => import("./pages/footer/Feedback"));
const Privacy = lazy(() => import("./pages/footer/Privacy"));
const Terms = lazy(() => import("./pages/footer/Terms"));
const Disclaimer = lazy(() => import("./pages/footer/Disclaimer"));

const NotFound = () => (
  <Layout>
    <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>404</h1>
      <p style={{ marginBottom: "1.5rem" }}>Page not found</p>
      <Link to="/" style={{ color: "var(--accent)" }}>Go home</Link>
    </div>
  </Layout>
);

function App() {
  return (
    <Router>
      <Analytics />
      <Suspense fallback={null}>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:id" element={<Portfolio />} />
        <Route path="/watchlist" element={<Portfolio />} />
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
      </Suspense>
    </Router>
  );
}

export default App;
