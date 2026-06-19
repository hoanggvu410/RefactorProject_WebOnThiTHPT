import { useEffect, useState } from "react";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../services/api.js";

const verifiedTokens = new Set();

function getVerifyToken() {
  const [, queryString = ""] = window.location.hash.split("?");
  return (
    new URLSearchParams(queryString).get("token") ||
    new URLSearchParams(window.location.search).get("token") ||
    ""
  );
}

function isSentView() {
  const [, queryString = ""] = window.location.hash.split("?");
  return new URLSearchParams(queryString).get("sent") === "1";
}

export default function VerifyEmail() {
  const { isLoggedIn, refreshMe } = useAuth();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Đang xác thực email...");

  useEffect(() => {
    let isMounted = true;

    async function verifyEmail() {
      const token = getVerifyToken();
      if (!token && isSentView()) {
        setStatus("sent");
        setMessage("Email xác thực đã được gửi. Vui lòng mở email và bấm vào link xác thực.");
        return;
      }

      if (!token) {
        setStatus("error");
        setMessage("Link xác thực không hợp lệ.");
        return;
      }

      if (verifiedTokens.has(token)) {
        setStatus("success");
        setMessage("Xác thực email thành công.");
        window.setTimeout(() => {
          window.location.hash = isLoggedIn ? "#/profile" : "#/";
        }, 1200);
        return;
      }

      try {
        const data = await apiFetch("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ token })
        });

        if (!isMounted) return;
        verifiedTokens.add(token);
        setStatus("success");
        setMessage(data.message || "Xác thực email thành công.");

        if (isLoggedIn) {
          await refreshMe();
        }

        window.setTimeout(() => {
          window.location.hash = isLoggedIn ? "#/profile" : "#/";
        }, 1800);
      } catch (verifyError) {
        if (!isMounted) return;
        setStatus("error");
        setMessage(verifyError.message || "Không thể xác thực email.");
      }
    }

    verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, refreshMe]);

  return (
    <>
      <SectionTitle>Xác thực email</SectionTitle>
      <div className="register-layout">
        <section className="content-box profile-form register-form">
          {status === "error" ? (
            <div className="form-error">{message}</div>
          ) : (
            <div className="empty">{message}</div>
          )}
          <div className="modal-actions">
            <button
              className="btn-primary"
              type="button"
              disabled={status === "loading"}
              onClick={() => {
                window.location.hash = isLoggedIn ? "#/profile" : "#/";
              }}
            >
              {isLoggedIn ? "Về Profile" : "Về trang chủ"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
