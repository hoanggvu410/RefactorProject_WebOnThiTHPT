import { useAuth } from "../context/AuthContext.jsx";

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
  const avatarUrl = me?.avatar_url || "";
  const resolvedAvatarUrl = avatarUrl || DEFAULT_AVATAR_URL;

  return (
    <header className="header">
      <div className="header-container">
        <a href="#/" className="logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">OnThiTHPT</span>
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
          <div className="user-profile">
            {isLoggedIn && (
              <img
                className="user-avatar"
                src={resolvedAvatarUrl}
                alt="Avatar"
                onError={(event) => {
                  if (event.currentTarget.src.endsWith(DEFAULT_AVATAR_URL)) return;
                  event.currentTarget.src = DEFAULT_AVATAR_URL;
                }}
              />
            )}
            <span className="user-info">{isLoggedIn ? `${displayName} (${role})` : "Chưa đăng nhập"}</span>
          </div>
          {isLoggedIn ? (
            <button className="btn-secondary" type="button" onClick={logout}>Đăng xuất</button>
          ) : (
            <button className="btn-login" type="button" onClick={onLoginClick}>Đăng nhập</button>
          )}
        </div>
      </div>
    </header>
  );
}
