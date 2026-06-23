import { useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function OAuthCallback() {
  const { setToken, setRefreshToken, refreshMe, showToast } = useAuth();

  useEffect(() => {
    const queryString = window.location.hash.split("?")[1] || "";
    const params = new URLSearchParams(queryString);

    const error = params.get("error");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (error) {
      showToast("Dang nhap Google that bai.");
      window.location.hash = "#/";
      return;
    }

    if (!accessToken || !refreshToken) {
      showToast("Khong nhan duoc token dang nhap Google.");
      window.location.hash = "#/";
      return;
    }

    setToken(accessToken);
    setRefreshToken(refreshToken);
    refreshMe();

    showToast("Dang nhap Google thanh cong.");
    window.location.hash = "#/profile";
  }, [refreshMe, setRefreshToken, setToken, showToast]);

  return (
    <section className="page-section">
      <h1>Dang dang nhap...</h1>
    </section>
  );
}
