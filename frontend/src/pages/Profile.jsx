import { useEffect, useState } from "react";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { resolveApiUrl } from "../services/api.js";

const DEFAULT_AVATAR_URL = "/static/default-avatar.png";

function InfoRow({ label, value }) {
  return (
    <div className="profile-info-row">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

export default function Profile() {
  const { apiFetch, me, refreshMe, showToast } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      name: me?.name || "",
      email: me?.email || ""
    });
  }, [me]);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiFetch("/v1/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim()
        })
      });
      await refreshMe();
      setEditing(false);
      showToast("Đã cập nhật thông tin cá nhân.");
    } catch (saveError) {
      setError(saveError.message || "Không thể cập nhật thông tin.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setError("");

    try {
      await apiFetch("/v1/me/upload-avatar", {
        method: "POST",
        body: formData
      });
      await refreshMe();
      showToast("Đã cập nhật ảnh đại diện.");
    } catch (uploadError) {
      setError(uploadError.message || "Không thể tải ảnh đại diện.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const avatarUrl = resolveApiUrl(me?.avatar_url || DEFAULT_AVATAR_URL);

  return (
    <>
      <SectionTitle>Profile</SectionTitle>
      <div className="profile-layout">
        <section className="content-box profile-card">
          <div className="profile-avatar-panel">
            <img
              className="profile-avatar"
              src={avatarUrl}
              alt="Avatar"
              onError={(event) => {
                const fallback = resolveApiUrl(DEFAULT_AVATAR_URL);
                if (event.currentTarget.src === fallback) return;
                event.currentTarget.src = fallback;
              }}
            />
            <label className="btn-secondary profile-upload-button">
              {uploading ? "Đang tải..." : "Đổi avatar"}
              <input accept="image/*" disabled={uploading} type="file" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="profile-details">
            <div className="detail-header">
              <div>
                <h3>{me?.name || "Người dùng"}</h3>
                <p>{me?.username || "-"}</p>
              </div>
              {!editing && (
                <button className="btn-primary" type="button" onClick={() => setEditing(true)}>
                  Chỉnh sửa
                </button>
              )}
            </div>

            {error && <div className="form-error">{error}</div>}

            {editing ? (
              <form className="profile-form" onSubmit={handleSave}>
                <label>
                  <span>Họ tên</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>
                <div className="exam-actions">
                  <button className="btn-primary" type="submit" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setEditing(false);
                      setError("");
                      setForm({ name: me?.name || "", email: me?.email || "" });
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-grid">
                <InfoRow label="UUID" value={me?.uuid} />
                <InfoRow label="Họ tên" value={me?.name} />
                <InfoRow label="Username" value={me?.username} />
                <InfoRow label="Email" value={me?.email} />
                <InfoRow label="Vai trò" value={me?.role} />
                <InfoRow label="Lớp" value={me?.grade} />
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
