import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, parseJwt } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem("access_token") || "");
  const [me, setMe] = useState(null);
  const [toast, setToast] = useState("");

  const tokenPayload = useMemo(() => parseJwt(token), [token]);
  const isLoggedIn = Boolean(token && tokenPayload);
  const role = me?.role || tokenPayload?.role || "student";
  const displayName = me?.name || tokenPayload?.name || tokenPayload?.sub || "Người dùng";

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }, []);

  const setToken = useCallback((nextToken) => {
    const cleanToken = nextToken || "";
    setTokenState(cleanToken);
    if (cleanToken) {
      localStorage.setItem("access_token", cleanToken);
    } else {
      localStorage.removeItem("access_token");
      setMe(null);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await apiFetch("/v1/me/", {}, token);
      setMe(profile);
    } catch {
      setMe(null);
    }
  }, [token]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (username, password) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    setToken(data.access_token);
    showToast("Đăng nhập thành công! Chúc bạn luyện đề vui vẻ.");
  }, [setToken, showToast]);

  const logout = useCallback(() => {
    setToken("");
    showToast("Đã đăng xuất.");
  }, [setToken, showToast]);

  const value = useMemo(() => ({
    token,
    tokenPayload,
    me,
    role,
    displayName,
    isAdmin: role === "admin",
    isLoggedIn,
    toast,
    login,
    logout,
    refreshMe,
    apiFetch: (path, options) => apiFetch(path, options, token),
    showToast
  }), [displayName, isLoggedIn, login, logout, me, refreshMe, role, showToast, toast, token, tokenPayload]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
