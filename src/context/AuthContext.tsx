import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types/types";

interface AuthContextProps {
  user: User | null;
  signIn: (user: User) => void;
  signOut: () => void;
  updateUserToken: (newToken: string) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for a logged-in user on component mount
    const loggedUserJSON = window.localStorage.getItem("loggedFinanceappUser");
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON);
      setUser(user);
    }
  }, []); // Run once on component mount

  const signIn = (userData: User) => {
    setUser(userData);
    window.localStorage.setItem(
      "loggedFinanceappUser",
      JSON.stringify(userData)
    );
  };

  const signOut = () => {
    window.localStorage.removeItem("loggedFinanceappUser");
    setUser(null);
  };

  const updateUserToken = (newToken: string) => {
    setUser((prevUser) => {
      if (prevUser) {
        return { ...prevUser, token: newToken };
      }
      return null;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signOut, updateUserToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
