import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaBars, FaChevronLeft, FaUncharted } from "react-icons/fa";
import { Button, Menu, MenuItem } from "@mui/material";
import Avatar from "@mui/material/Avatar/Avatar";
import Sidebar from "./Sidebar";
import CustomButton from "../CustomButton";
import "./Layout.css";
import { useNotification } from "../../context/NotificationContext";

const getUserInitials = (name: string | undefined): string => {
  if (!name) return "";
  const nameParts = name.split(" ");
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0);
  } else {
    return nameParts[0].charAt(0) + nameParts[1].charAt(0);
  }
};
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useNotification();
  const { user, signOut } = useAuth();
  const auth = !!user;

  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const handleDrawerToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleClick = () => {
    if (!auth) {
      navigate("/login");
    }
  };
  const handleAvatarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleSignOut = async () => {
    handleMenuClose();
    navigate("/");
    localStorage.clear();
    await signOut();
    addNotification(`${user?.username} successfully signed out!`, "success");
  };
  return (
    <div className={`layout-container ${open ? "open" : ""}`}>
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

        {auth ? (
          <Button className="avatar-button" onClick={handleAvatarClick}>
            <Avatar>{getUserInitials(user?.name)}</Avatar>
          </Button>
        ) : (
          <CustomButton
            label={"Sign in"}
            onClick={handleClick}
            auth={auth}
            primary={true}
          />
        )}
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem>
            {user?.name} - {user?.username}
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>Hi, {user?.name}!</MenuItem>
          <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
        </Menu>
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
