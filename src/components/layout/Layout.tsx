import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaChevronLeft, FaUncharted } from "react-icons/fa";
import Sidebar from "./Sidebar";
import DemoBanner from "../DemoBanner";
import FuelGauge from "../FuelGauge";
import { useDemoMode } from "../../context/DemoModeContext";
import "./Layout.css";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <div className={`layout-container ${open ? "open" : ""}`}>
      <DemoBanner />
      <div
        className={`overlay ${open ? "open" : ""}`}
        onClick={handleDrawerClose}
      ></div>
      <div className="top-banner">
        <div className="logo-container">
          <button className="menu-button" onClick={handleDrawerToggle}>
            {open ? <FaChevronLeft /> : <FaBars />}
          </button>
          <span className="logo">
            {" "}
            <FaUncharted size={24} />
            <Link to={"/"}>Finch</Link>
          </span>
        </div>
        <div className="top-banner-right">
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
        {open && (
          <div className="sidebar">
            <div className="sidebar-header">
              <button className="close-button" onClick={handleDrawerClose}>
                <FaChevronLeft />
              </button>
            </div>
            <Sidebar isOpen={open} onClose={handleDrawerClose} />
          </div>
        )}

        <div className={`main-content ${open ? "open" : ""}`}>{children}</div>
      </div>
    </div>
  );
};

export default Layout;
