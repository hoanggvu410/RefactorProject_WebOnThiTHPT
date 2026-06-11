import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginModal({ open, onClose }) {
  const { login, isLoggedIn, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [onClose, open]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!username.trim() || !password) {
      window.alert("Vui lòng nhập username và password");
      return;
    }

    try {
      await login(username.trim(), password);
      setPassword("");
      onClose();
    } catch (error) {
      window.alert(`Lỗi đăng nhập: ${error.message}`);
    }
  }

  return (
    <div className="modal">
      <form className="modal-content" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>Đăng nhập</h2>
          <button className="close-btn" type="button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <label>
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} type="text" placeholder="Nhập username" />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Nhập password" />
          </label>
          <div className="modal-actions">
            <button className="btn-primary" type="submit">Đăng nhập</button>
            {isLoggedIn && <button className="btn-secondary" type="button" onClick={logout}>Đăng xuất</button>}
          </div>
        </div>
      </form>
    </div>
  );
}
