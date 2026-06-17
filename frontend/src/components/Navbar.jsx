import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { resolveApiUrl } from "../services/api.js";

const DEFAULT_AVATAR_URL = "/static/default-avatar.png";

const links = [
  { href: "#/", label: "Trang chủ" },
  { href: "#/news", label: "Tin tức" },
  { href: "#/subjects", label: "Môn học" },
  { href: "#/exams", label: "Đề thi" },
  { href: "#/documents", label: "Tài liệu" }
];

export default function Navbar({ route, onLoginClick }) {
  const { displayName, isAdmin, isLoggedIn, logout, me, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const avatarUrl = me?.avatar_url || "";
  const resolvedAvatarUrl = resolveApiUrl(avatarUrl || DEFAULT_AVATAR_URL);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  function handleMenuLink() {
    setMenuOpen(false);
  }

  function handleLogout() {
    setMenuOpen(false);
    logout();
  }

  return (
    <header className="header">
      <div className="header-container">
        <a href="#/" className="logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">Sĩ Tử Chiến</span>
        </a>

        <nav className="nav">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={`nav-link ${route === link.href ? "active" : ""}`}>
              {link.label}
            </a>
          ))}
          {isAdmin && (
            <a href="#/admin" className={`nav-link ${route === "#/admin" ? "active" : ""}`}>Quản trị</a>
          )}
        </nav>

        <div className="header-actions">
          {isLoggedIn ? (
            <div className="user-menu" ref={menuRef}>
              <button
                className="user-profile user-profile-button"
                type="button"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <img
                  className="user-avatar"
                  src={resolvedAvatarUrl}
                  alt="Avatar"
                  onError={(event) => {
                    const fallback = resolveApiUrl(DEFAULT_AVATAR_URL);
                    if (event.currentTarget.src === fallback) return;
                    event.currentTarget.src = fallback;
                  }}
                />
                <span className="user-info">{displayName} ({role})</span>
                <span className="user-menu-caret">▾</span>
              </button>

              {menuOpen && (
                <div className="user-dropdown" role="menu">
                  <a href="#/profile" role="menuitem" onClick={handleMenuLink}>Profile</a>
                  <a href="#/dashboard" role="menuitem" onClick={handleMenuLink}>Dashboard</a>
                  <a href="#/history" role="menuitem" onClick={handleMenuLink}>Lịch sử thi</a>
                  <button type="button" role="menuitem" onClick={handleLogout}>Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <a className="btn-secondary nav-register-link" href="#/register">Đăng ký</a>
              <button className="btn-login" type="button" onClick={onLoginClick}>Đăng nhập</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
