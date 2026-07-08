import { useState } from "react";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const initialForm = {
  name: "",
  username: "",
  email: "",
  password: "",
  grade: "12"
};

export default function Register() {
  const { apiFetch, showToast } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          grade: Number(form.grade)
        })
      });
      setForm(initialForm);
      showToast("Đăng ký thành công. Bạn có thể đăng nhập ngay.");
      window.location.hash = "#/";
    } catch (registerError) {
      const message = registerError.message || "Không thể đăng ký tài khoản.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SectionTitle>Đăng ký</SectionTitle>
      <div className="register-layout">
        <form className="content-box profile-form register-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <label>
            <span>Họ tên</span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Nhập họ tên"
            />
          </label>
          <label>
            <span>Username</span>
            <input
              required
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
              placeholder="Nhập username"
            />
          </label>
          <label>
            <span>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="Nhập email"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              required
              minLength={6}
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Tối thiểu 6 ký tự"
            />
          </label>
          <label>
            <span>Lớp</span>
            <select
              className="class-selector"
              value={form.grade}
              onChange={(event) => updateField("grade", event.target.value)}
            >
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>
            <button className="btn-secondary" type="button" onClick={() => { window.location.hash = "#/"; }}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
