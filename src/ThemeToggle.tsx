import React, { useState, useEffect } from "react";

const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setIsDarkMode(savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("theme", newTheme);
    document.body.className = newTheme + "-mode";
  };

  return (
    <button onClick={toggleTheme}>
      Toggle Theme: {isDarkMode ? "Dark" : "Light"}
    </button>
  );
};

export default ThemeToggle;
