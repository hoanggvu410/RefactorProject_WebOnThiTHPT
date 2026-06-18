import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, parseJwt } from "../services/api.js";

const AuthContext = createContext(null);
const SESSION_EXPIRED_MESSAGE = "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.";
const REFRESH_TOKEN_ERROR_CODES = new Set([
  "REFRESH_TOKEN_EXPIRED",
  "INVALID_REFRESH_TOKEN",
  "REFRESH_TOKEN_REVOKED"
]);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem("access_token") || "");
  const [refreshToken, setRefreshTokenState] = useState(() => localStorage.getItem("refresh_token") || "");
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

  const setRefreshToken = useCallback((nextToken) => {
    const cleanToken = nextToken || "";
    setRefreshTokenState(cleanToken);
    if (cleanToken) {
      localStorage.setItem("refresh_token", cleanToken);
    } else {
      localStorage.removeItem("refresh_token");
    }
  }, []);

  const clearSession = useCallback(() => {
    setToken("");
    setRefreshToken("");
    setMe(null);
  }, [setRefreshToken, setToken]);

  const handleExpiredSession = useCallback(() => {
    clearSession();
    showToast(SESSION_EXPIRED_MESSAGE);
    window.dispatchEvent(new Event("auth:expired"));
  }, [clearSession, showToast]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      handleExpiredSession();
      return "";
    }

    try {
      const data = await apiFetch("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      const nextToken = data.access_token || "";
      if (!nextToken) {
        handleExpiredSession();
        return "";
      }
      setToken(nextToken);
      return nextToken;
    } catch (error) {
      if (REFRESH_TOKEN_ERROR_CODES.has(error.code) || error.status === 401) {
        handleExpiredSession();
        return "";
      }
      throw error;
    }
  }, [handleExpiredSession, refreshToken, setToken]);

  const login = useCallback(async (username, password) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    showToast("Đăng nhập thành công! Chúc bạn luyện đề vui vẻ.");
  }, [setRefreshToken, setToken, showToast]);

  const logout = useCallback(async () => {
    if (token && refreshToken) {
      try {
        await apiFetch("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken })
        }, token);
      } catch {
        // Local logout should still complete even if the server session is already invalid.
      }
    }
    clearSession();
    showToast("Đã đăng xuất.");
  }, [clearSession, refreshToken, showToast, token]);

  const authedApiFetch = useCallback(async (path, options = {}) => {
    try {
      return await apiFetch(path, options, token);
    } catch (error) {
      if (error.code !== "TOKEN_EXPIRED") {
        throw error;
      }

      const nextToken = await refreshAccessToken();
      if (!nextToken) {
        throw error;
      }
      return apiFetch(path, options, nextToken);
    }
  }, [refreshAccessToken, token]);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await authedApiFetch("/v1/me/");
      setMe(profile);
    } catch {
      setMe(null);
    }
  }, [authedApiFetch, token]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const value = useMemo(() => ({
    token,
    refreshToken,
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
    apiFetch: authedApiFetch,
    showToast
  }), [authedApiFetch, displayName, isLoggedIn, login, logout, me, refreshMe, refreshToken, role, showToast, toast, token, tokenPayload]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
