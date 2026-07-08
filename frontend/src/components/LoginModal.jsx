import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { API_BASE_URL, apiFetch } from "../services/api.js";

const MODE_TITLES = {
  login: "Đăng nhập",
  "forgot-email": "Quên mật khẩu",
  "forgot-otp": "Nhập mã OTP",
  "reset-password": "Đặt mật khẩu mới"
};

export default function LoginModal({ open, onClose }) {
  const { login, isLoggedIn, logout, showToast } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setMode("login");
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  function handleGoogleLogin() {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        if (!username.trim() || !password) {
          setError("Vui lòng nhập username và password");
          return;
        }

        await login(username.trim(), password);
        setPassword("");
        onClose();
        return;
      }

      if (mode === "forgot-email") {
        if (!forgotEmail.trim()) {
          setError("Vui lòng nhập email");
          return;
        }

        const data = await apiFetch("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email: forgotEmail.trim() })
        });
        showToast(data.message || "Mã OTP đã được gửi.");
        setMode("forgot-otp");
        return;
      }

      if (mode === "forgot-otp") {
        if (!otp.trim()) {
          setError("Vui lòng nhập mã OTP");
          return;
        }

        const data = await apiFetch("/auth/verify-reset-otp", {
          method: "POST",
          body: JSON.stringify({ email: forgotEmail.trim(), otp: otp.trim() })
        });
        setResetToken(data.reset_token || "");
        setMode("reset-password");
        return;
      }

      if (mode === "reset-password") {
        if (!newPassword) {
          setError("Vui lòng nhập mật khẩu mới");
          return;
        }

        const data = await apiFetch("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ reset_token: resetToken, new_password: newPassword })
        });
        showToast(data.message || "Đổi mật khẩu thành công.");
        setMode("login");
        setPassword("");
        setOtp("");
        setResetToken("");
        setNewPassword("");
      }
    } catch (submitError) {
      const message = submitError.message || "Không thể xử lý yêu cầu.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  function backToLogin() {
    setMode("login");
    setError("");
    setOtp("");
    setResetToken("");
    setNewPassword("");
  }

  function renderFields() {
    if (mode === "login") {
      return (
        <>
          <label>
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} type="text" placeholder="Nhập username" />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Nhập password" />
          </label>
          <button className="link-button" type="button" onClick={() => {
            setMode("forgot-email");
            setError("");
          }}>
            Quên mật khẩu?
          </button>
          <button className="btn-secondary" type="button" onClick={handleGoogleLogin}>
            Đăng nhập với Google
          </button>
        </>
      );
    }

    if (mode === "forgot-email") {
      return (
        <label>
          <span>Email</span>
          <input value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} type="email" placeholder="Nhập email tài khoản" />
        </label>
      );
    }

    if (mode === "forgot-otp") {
      return (
        <label>
          <span>Mã OTP</span>
          <input value={otp} onChange={(event) => setOtp(event.target.value)} inputMode="numeric" maxLength={6} placeholder="Nhập mã OTP" />
        </label>
      );
    }

    return (
      <label>
        <span>Mật khẩu mới</span>
        <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" placeholder="Nhập mật khẩu mới" />
      </label>
    );
  }

  function primaryLabel() {
    if (submitting) return "Đang xử lý...";
    if (mode === "forgot-email") return "Gửi OTP";
    if (mode === "forgot-otp") return "Xác nhận OTP";
    if (mode === "reset-password") return "Đổi mật khẩu";
    return "Đăng nhập";
  }

  function secondaryAction() {
    if (mode === "login") {
      return isLoggedIn && <button className="btn-secondary" type="button" onClick={logout}>Đăng xuất</button>;
    }

    return <button className="btn-secondary" type="button" disabled={submitting} onClick={backToLogin}>Quay lại đăng nhập</button>;
  }

  return (
    <div className="modal">
      <form className="modal-content" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>{MODE_TITLES[mode]}</h2>
          <button className="close-btn" type="button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}
          {renderFields()}
          <div className="modal-actions">
            <button className="btn-primary" type="submit" disabled={submitting}>{primaryLabel()}</button>
            {secondaryAction()}
          </div>
        </div>
      </form>
    </div>
  );
}
