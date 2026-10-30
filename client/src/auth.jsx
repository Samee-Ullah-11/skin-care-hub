import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api("/auth/me")
      .then(d => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback((token, user) => {
    setToken(token);
    setUser(user);
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try { setUser((await api("/auth/me")).user); } catch {}
  }, []);

  return (
    <AuthCtx.Provider value={{ user, ready, signIn, signOut, refresh, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

export function destFor(user, next) {
  if (!user) return "/login";
  if (user.role === "clinic") return "/dashboard";
  if (user.role === "admin") return "/admin";
  return next || "/bookings";
}
