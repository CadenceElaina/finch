import React, { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarItemProps } from "./types";

const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  icon: Icon,
  href,
  auth,
  onClick,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive =
    href === "/"
      ? pathname === "/"
      : href
        ? pathname.startsWith(href)
        : false;

  const handleClick = useCallback(() => {
    if (href === "/") {
      navigate("/");
    } else if (!auth) {
      if (onClick) {
        onClick();
      } else {
        navigate("/login");
      }
    } else if (href) {
      navigate(`../${href}`);
    }
  }, [onClick, auth, href, navigate]);

  return (
    <li key={label} className={`sidebar-item${isActive ? " sidebar-item-active" : ""}`}>
      <button className="sidebar-item-button" onClick={handleClick}>
        <div className="sidebar-button-icon">
          <Icon size={22} />
        </div>
        <div className="sidebar-button-label">{label}</div>
      </button>
    </li>
  );
};

export default SidebarItem;
