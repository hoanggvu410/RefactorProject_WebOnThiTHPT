import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { API_BASE_URL, apiFetch } from "../services/api.js";

const initialRegisterForm = {
  username: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  grade: "12"
};

const MODE_TITLES = {
  login: "Đăng nhập",
  register: "Tạo Tài Khoản",
  "forgot-email": "Quên mật khẩu",
  "forgot-otp": "Nhập mã OTP",
  "reset-password": "Đặt mật khẩu mới"
};

export default function LoginModal({ open, onClose }) {
  const { login, isLoggedIn, logout, showToast } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
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
      setPassword("");
      setRegisterForm(initialRegisterForm);
    }
  }, [open]);

  if (!open) return null;

  function handleGoogleLogin() {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setRegisterForm(initialRegisterForm);
  }

  function updateRegisterField(field, value) {
    setRegisterForm((current) => ({ ...current, [field]: value }));
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

      if (mode === "register") {
        const payload = {
          name: registerForm.name.trim(),
          username: registerForm.username.trim(),
          email: registerForm.email.trim(),
          password: registerForm.password,
          grade: Number(registerForm.grade)
        };

        if (!payload.username || !payload.name || !payload.email || !payload.password || !registerForm.confirmPassword) {
          setError("Vui lòng nhập đầy đủ thông tin đăng ký.");
          return;
        }

        if (registerForm.password !== registerForm.confirmPassword) {
          setError("Mật khẩu nhập lại không khớp.");
          return;
        }

        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setRegisterForm(initialRegisterForm);
        showToast("Đăng ký thành công. Bạn có thể đăng nhập ngay.");
        setMode("login");
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
    switchMode("login");
    setError("");
    setOtp("");
    setResetToken("");
    setNewPassword("");
  }

  function renderFields() {
    if (mode === "login") {
      return (
        <>
          <label className="auth-field">
            <span className="auth-field-icon">♙</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} type="text" placeholder="Nhập tài khoản" />
          </label>
          <label className="auth-field">
            <span className="auth-field-icon">▣</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Nhập mật khẩu" />
          </label>
          <button className="link-button auth-forgot-link" type="button" onClick={() => {
            setMode("forgot-email");
            setError("");
          }}>
            Quên mật khẩu?
          </button>
        </>
      );
    }

    if (mode === "register") {
      return (
        <div className="auth-register-grid">
          <label className="auth-field">
            <span className="auth-field-icon">♙</span>
            <input value={registerForm.username} onChange={(event) => updateRegisterField("username", event.target.value)} type="text" placeholder="Nhập tài khoản" />
          </label>
          <label className="auth-field">
            <span className="auth-field-icon">✉</span>
            <input value={registerForm.email} onChange={(event) => updateRegisterField("email", event.target.value)} type="email" placeholder="Email" />
          </label>
          <label className="auth-field">
            <span className="auth-field-icon">♙</span>
            <input value={registerForm.name} onChange={(event) => updateRegisterField("name", event.target.value)} type="text" placeholder="Nhập tên" />
          </label>
          <label className="auth-field">
            <span className="auth-field-icon">▣</span>
            <select value={registerForm.grade} onChange={(event) => updateRegisterField("grade", event.target.value)}>
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </label>
          <label className="auth-field">
            <span className="auth-field-icon">▣</span>
            <input value={registerForm.password} onChange={(event) => updateRegisterField("password", event.target.value)} type="password" placeholder="Nhập mật khẩu" />
          </label>
          <label className="auth-field">
            <span className="auth-field-icon">▣</span>
            <input value={registerForm.confirmPassword} onChange={(event) => updateRegisterField("confirmPassword", event.target.value)} type="password" placeholder="Nhập lại mật khẩu" />
          </label>
        </div>
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
    if (mode === "register") return "Đăng ký ngay";
    if (mode === "forgot-email") return "Gửi OTP";
    if (mode === "forgot-otp") return "Xác nhận OTP";
    if (mode === "reset-password") return "Đổi mật khẩu";
    return "Đăng nhập";
  }

  function secondaryAction() {
    if (mode === "login") {
      return isLoggedIn && <button className="btn-secondary" type="button" onClick={logout}>Đăng xuất</button>;
    }

    if (mode === "register") return null;

    return <button className="btn-secondary auth-back-button" type="button" disabled={submitting} onClick={backToLogin}>Quay lại đăng nhập</button>;
  }

  return (
    <div className="modal">
      <form className={`modal-content auth-modal ${mode === "register" ? "auth-modal-register" : ""}`} onSubmit={handleSubmit}>
        <div className="modal-header auth-modal-header">
          <h2>{MODE_TITLES[mode]}</h2>
          <button className="close-btn auth-close-btn" type="button" onClick={onClose} aria-label="Đóng">&times;</button>
        </div>
        <div className="modal-body auth-modal-body">
          {error && <div className="form-error">{error}</div>}
          {renderFields()}
          <div className="modal-actions auth-modal-actions">
            <button className="btn-primary" type="submit" disabled={submitting}>{primaryLabel()}</button>
            {secondaryAction()}
          </div>
          {(mode === "login" || mode === "register") && (
            <>
              <div className="auth-divider"><span>{mode === "login" ? "HOẶC" : "Hoặc"}</span></div>
              <button className="btn-secondary auth-google-button" type="button" onClick={handleGoogleLogin}>
                <span className="auth-google-mark">G</span>
                <span>Đăng nhập với Google</span>
              </button>
              <p className="auth-switch-text">
                {mode === "login" ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}
                <button
                  className="link-button auth-switch-link"
                  type="button"
                  onClick={() => switchMode(mode === "login" ? "register" : "login")}
                >
                  {mode === "login" ? "Đăng ký ngay" : "Đăng nhập ngay"}
                </button>
              </p>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
