import { useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function getCallbackParams() {
  const hashQuery = window.location.hash.split("?")[1] || "";
  const searchQuery = window.location.search.startsWith("?")
    ? window.location.search.slice(1)
    : window.location.search;
  return new URLSearchParams(hashQuery || searchQuery);
}

export default function OAuthCallback() {
  const { setToken, setRefreshToken, refreshMe, showToast } = useAuth();

  useEffect(() => {
    const params = getCallbackParams();

    const error = params.get("error");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (error) {
      setToken("");
      setRefreshToken("");
      showToast("Đăng nhập Google thất bại.", "error");
      window.location.hash = "#/";
      return;
    }

    if (!accessToken || !refreshToken) {
      setToken("");
      setRefreshToken("");
      showToast("Không nhận được token đăng nhập Google.", "error");
      window.location.hash = "#/";
      return;
    }

    setToken(accessToken);
    setRefreshToken(refreshToken);
    refreshMe();

    showToast("Đăng nhập Google thành công.");
    window.setTimeout(() => {
      window.location.hash = "#/profile";
    }, 0);
  }, [refreshMe, setRefreshToken, setToken, showToast]);

  return (
    <section className="page-section">
      <h1>Đang đăng nhập...</h1>
    </section>
  );
}
