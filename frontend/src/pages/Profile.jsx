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

function isEmailVerified(value) {
  return value === true || value === 1 || value === "true";
}

export default function Profile() {
  const { apiFetch, me, refreshMe, showToast } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      name: me?.name || "",
      grade: me?.grade ? String(me.grade) : ""
    });
  }, [me]);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiFetch("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          grade: form.grade ? Number(form.grade) : undefined
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
      await apiFetch("/me/upload-avatar", {
        method: "PATCH",
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

  async function handleSendVerifyEmail() {
    setSendingVerify(true);
    setError("");

    try {
      await apiFetch("/auth/send-verify-email", { method: "POST" });
      showToast("Đã gửi email xác thực.");
      await refreshMe();
      window.location.hash = "#/verify-email?sent=1";
    } catch (verifyError) {
      setError(verifyError.message || "Không thể gửi email xác thực.");
    } finally {
      setSendingVerify(false);
    }
  }

  const avatarUrl = resolveApiUrl(me?.avatar_url || DEFAULT_AVATAR_URL);
  const emailVerified = isEmailVerified(me?.email_verified);

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
            {!emailVerified && (
              <div className="exam-actions">
                <button
                  className="btn-secondary"
                  type="button"
                  disabled={sendingVerify}
                  onClick={handleSendVerifyEmail}
                >
                  {sendingVerify ? "Đang gửi..." : "Xác thực email"}
                </button>
              </div>
            )}

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
                  <span>Lớp</span>
                  <select
                    className="class-selector"
                    value={form.grade}
                    onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value }))}
                  >
                    <option value="">Chọn lớp</option>
                    <option value="10">Lớp 10</option>
                    <option value="11">Lớp 11</option>
                    <option value="12">Lớp 12</option>
                  </select>
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
                      setForm({ name: me?.name || "", grade: me?.grade ? String(me.grade) : "" });
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
                <InfoRow label="Trạng thái email" value={emailVerified ? "Đã xác thực email" : "Chưa xác thực"} />
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
