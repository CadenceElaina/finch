import { Link, useLocation, useNavigate, NavLink } from "react-router-dom";
import { FaUncharted } from "react-icons/fa";
import { BsNewspaper } from "react-icons/bs";
import { MdManageSearch } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { FaListUl } from "react-icons/fa";
import FuelGauge from "../FuelGauge";
import Search from "../search/Search";
import MarketClock from "./MarketClock";
import { useDemoMode } from "../../context/DemoModeContext";
import { useTheme } from "../../context/ThemeContext";
import { BsSun, BsMoon } from "react-icons/bs";
import "./Layout.css";

/** Pages that render their own full-size Search bar */
const PAGES_WITH_SEARCH = ["/"];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDemoMode } = useDemoMode();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hideHeaderSearch = PAGES_WITH_SEARCH.includes(pathname);

  return (
    <div className="layout-container">
      <div className="top-banner">
        <div className="logo-container">
          <span className="logo">
            <FaUncharted size={24} />
            <Link to={"/"}>Finch</Link>
          </span>
          <nav className="header-nav">
            <NavLink to="/news" className={({ isActive }) => `header-nav-link${isActive ? " active" : ""}`}>
              <BsNewspaper size={14} />
              <span>News</span>
            </NavLink>
            <NavLink to="/portfolio" className={() => `header-nav-link${pathname.startsWith("/portfolio") || pathname.startsWith("/watchlist") ? " active" : ""}`}>
              <FaListUl size={14} />
              <span>Lists</span>
            </NavLink>
            <NavLink to="/market-trends/indexes" className={() => `header-nav-link${pathname.startsWith("/market-trends") ? " active" : ""}`}>
              <MdManageSearch size={16} />
              <span>Markets</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `header-nav-link${isActive ? " active" : ""}`}>
              <IoMdSettings size={15} />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>
        <div className="header-search-inline">
          {!hideHeaderSearch && <Search compact onNavigate={() => {}} />}
        </div>
        <div className="top-banner-right">
          <MarketClock />
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <BsSun size={16} /> : <BsMoon size={16} />}
          </button>
          {isDemoMode && (
            <button
              className="demo-badge"
              onClick={() => navigate("/settings")}
              title="Using demo data — click to change"
            >
              DEMO
            </button>
          )}
          <FuelGauge />
        </div>
      </div>

      <div className="container">
        <div className="main-content">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
