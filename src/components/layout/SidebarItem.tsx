import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarItemProps } from "./types";

const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  icon: Icon,
  href,
  auth,
  onClick,
}) => {
  const navigate = useNavigate();

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
    <li key={label} className="sidebar-item">
      <button className="sidebar-item-button" onClick={handleClick}>
        <div className="sidebar-button-icon">
          <Icon size={28} color="white" />
        </div>
        <div className="sidebar-button-label">{label}</div>
      </button>
    </li>
  );
};

export default SidebarItem;
