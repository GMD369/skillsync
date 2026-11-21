"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest, setUnauthorizedHandler } from "@/lib/api";

// Keeps track of the logged-in student for the whole app.
const AuthContext = createContext(null);
const TOKEN_KEY = "skillsync_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking a saved token

  const saveSession = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // If any API call reports that the token is no longer valid (e.g. it expired while the
  // student was using the app), log out so protected pages redirect to the login page.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // On page load, restore the session if a valid token was saved earlier.
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    const restore = saved
      ? apiRequest("/auth/me", { token: saved })
          .then((data) => {
            setToken(saved);
            setUser(data.user);
          })
          .catch(() => localStorage.removeItem(TOKEN_KEY)) // expired or invalid token
      : Promise.resolve();
    restore.finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    saveSession(await apiRequest("/auth/login", { method: "POST", body: { email, password } }));
  };

  const register = async (name, email, password) => {
    saveSession(await apiRequest("/auth/register", { method: "POST", body: { name, email, password } }));
  };

  return (
    // updateUser lets other modules (e.g. Profile) refresh the user after saving changes,
    // so the navbar and dashboard update immediately.
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
