import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function renderValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return String(value);
  return value;
}

const resourceConfig = {
  users: {
    label: "Users",
    endpoint: "/users/",
    defaultSort: "created_at",
    sortOptions: [
      { value: "created_at", label: "Created At" },
      { value: "username", label: "Username" },
      { value: "name", label: "Name" },
      { value: "role", label: "Role" },
      { value: "grade", label: "Grade" }
    ],
    columns: [
      { label: "UUID", render: (row) => renderValue(row.uuid) },
      { label: "Name", key: "name" },
      { label: "Username", key: "username" },
      { label: "Email", key: "email" },
      { label: "Role", key: "role" },
      { label: "Grade", key: "grade" }
    ]
  },
  news: {
    label: "News",
    endpoint: "/news/",
    defaultSort: "date",
    sortOptions: [
      { value: "date", label: "Date" },
      { value: "title", label: "Title" },
      { value: "published_at", label: "Published At" },
      { value: "uuid", label: "UUID" }
    ],
    columns: [
      { label: "UUID", render: (row) => renderValue(row.uuid) },
      { label: "Title", key: "title" },
      { label: "Date", key: "date" }
    ]
  },
  documents: {
    label: "Documents",
    endpoint: "/documents/",
    defaultSort: "created_at",
    sortOptions: [
      { value: "created_at", label: "Created At" },
      { value: "title", label: "Title" },
      { value: "grade", label: "Grade" },
      { value: "subject_id", label: "Subject" },
      { value: "uuid", label: "UUID" }
    ],
    columns: [
      { label: "UUID", render: (row) => renderValue(row.uuid) },
      { label: "Title", key: "title" },
      { label: "Grade", key: "grade" },
      { label: "Subject", key: "subject_id" },
      { label: "Link", render: (row) => row.link ? <a href={row.link} target="_blank" rel="noreferrer">Tải xuống</a> : "" }
    ]
  },
  exams: {
    label: "Exams",
    endpoint: "/exam/",
    defaultSort: "uuid",
    sortOptions: [
      { value: "uuid", label: "UUID" },
      { value: "title", label: "Title" },
      { value: "grade", label: "Grade" },
      { value: "subject_id", label: "Subject" },
      { value: "question_number", label: "Questions" },
      { value: "duration", label: "Duration" }
    ],
    columns: [
      { label: "UUID", render: (row) => renderValue(row.uuid) },
      { label: "Title", key: "title" },
      { label: "Grade", key: "grade" },
      { label: "Subject", key: "subject_id" },
      { label: "Questions", key: "question_number" },
      { label: "Duration", key: "duration" }
    ]
  },
  questions: {
    label: "Questions",
    endpoint: "/questions/",
    defaultSort: "uuid",
    sortOptions: [
      { value: "uuid", label: "UUID" },
      { value: "content", label: "Content" },
      { value: "grade", label: "Grade" },
      { value: "subject_id", label: "Subject" }
    ],
    columns: [
      { label: "UUID", render: (row) => renderValue(row.uuid) },
      { label: "Content", key: "content" },
      { label: "Grade", key: "grade" },
      { label: "Subject", key: "subject_id" }
    ]
  }
};

const tabs = Object.entries(resourceConfig).map(([key, config]) => ({ key, label: config.label }));
const PAGE_SIZE = 10;

function createResourceState(config) {
  return {
    items: [],
    total: 0,
    page: 1,
    keyword: "",
    role: "",
    grade: "",
    subject_id: "",
    sort_by: config.defaultSort,
    sort_order: "desc",
    loading: false,
    loaded: false,
    error: ""
  };
}

function createInitialState() {
  return Object.fromEntries(
    Object.entries(resourceConfig).map(([key, config]) => [key, createResourceState(config)])
  );
}

function normalizePayload(payload) {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, page: 1 };
  }

  return {
    items: payload?.items || [],
    total: payload?.total || 0,
    page: payload?.page || 1
  };
}

function buildQuery(state, resourceKey) {
  const params = new URLSearchParams();
  params.set("page", String(state.page));
  params.set("limit", String(PAGE_SIZE));
  params.set("sort_by", state.sort_by);
  params.set("sort_order", state.sort_order);

  if (state.keyword.trim()) params.set("keyword", state.keyword.trim());
  if (state.grade) params.set("grade", state.grade);
  if (state.subject_id) params.set("subject_id", state.subject_id);
  if (resourceKey === "users" && state.role) params.set("role", state.role);

  return params.toString();
}

export default function Admin() {
  const { apiFetch, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [resources, setResources] = useState(createInitialState);

  const activeConfig = resourceConfig[activeTab];
  const activeState = resources[activeTab];
  const totalPages = Math.max(1, Math.ceil(activeState.total / PAGE_SIZE));

  const updateResource = useCallback((key, patch) => {
    setResources((current) => ({
      ...current,
      [key]: { ...current[key], ...patch }
    }));
  }, []);

  const loadResource = useCallback(async (key, overrides = {}) => {
    if (!isAdmin) return;

    const config = resourceConfig[key];
    const baseState = resources[key] || createResourceState(config);
    const nextState = { ...baseState, ...overrides };
    const query = buildQuery(nextState, key);

    updateResource(key, { ...overrides, loading: true, error: "" });

    try {
      const payload = await apiFetch(`${config.endpoint}?${query}`);
      const normalized = normalizePayload(payload);
      updateResource(key, {
        items: normalized.items,
        total: normalized.total,
        page: normalized.page,
        loading: false,
        loaded: true,
        error: ""
      });
    } catch (error) {
      updateResource(key, {
        loading: false,
        loaded: true,
        error: error.message || "Request failed"
      });
    }
  }, [apiFetch, isAdmin, resources, updateResource]);

  useEffect(() => {
    if (!isAdmin) return;
    tabs.forEach((tab) => loadResource(tab.key));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const current = resources[activeTab];
    if (!current.loading && !current.loaded) {
      loadResource(activeTab);
    }
  }, [activeTab, isAdmin, loadResource, resources]);

  const stats = useMemo(() => ({
    users: resources.users.total || resources.users.items.length,
    news: resources.news.total || resources.news.items.length,
    documents: resources.documents.total || resources.documents.items.length,
    exams: resources.exams.total || resources.exams.items.length
  }), [resources]);

  if (!isAdmin) {
    return (
      <>
        <SectionTitle>🛠️ Admin Dashboard</SectionTitle>
        <div className="content-box"><div className="empty">Bạn cần quyền admin để xem trang này.</div></div>
      </>
    );
  }

  function handleFieldChange(field, value) {
    updateResource(activeTab, { [field]: value, page: field === "page" ? Number(value) : 1 });
  }

  function handleSearch(event) {
    event.preventDefault();
    loadResource(activeTab, { page: 1 });
  }

  function handleReset() {
    const resetState = createResourceState(activeConfig);
    updateResource(activeTab, resetState);
    loadResource(activeTab, resetState);
  }

  function handlePageChange(nextPage) {
    loadResource(activeTab, { page: nextPage });
  }

  return (
    <>
      <SectionTitle>🛠️ Admin Dashboard</SectionTitle>

      <div className="admin-hero">
        <div className="admin-card"><div className="admin-card-label">Users</div><div className="admin-card-value">{stats.users}</div></div>
        <div className="admin-card"><div className="admin-card-label">News</div><div className="admin-card-value">{stats.news}</div></div>
        <div className="admin-card"><div className="admin-card-label">Documents</div><div className="admin-card-value">{stats.documents}</div></div>
        <div className="admin-card"><div className="admin-card-label">Exams</div><div className="admin-card-value">{stats.exams}</div></div>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form className="admin-toolbar" onSubmit={handleSearch}>
        <input
          className="class-selector"
          value={activeState.keyword}
          onChange={(event) => handleFieldChange("keyword", event.target.value)}
          placeholder="Tìm kiếm..."
        />

        {activeTab === "users" && (
          <select className="class-selector" value={activeState.role} onChange={(event) => handleFieldChange("role", event.target.value)}>
            <option value="">Tất cả role</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        )}

        {["users", "documents", "exams", "questions"].includes(activeTab) && (
          <select className="class-selector" value={activeState.grade} onChange={(event) => handleFieldChange("grade", event.target.value)}>
            <option value="">Tất cả lớp</option>
            <option value="10">Lớp 10</option>
            <option value="11">Lớp 11</option>
            <option value="12">Lớp 12</option>
          </select>
        )}

        <select className="class-selector" value={activeState.sort_by} onChange={(event) => handleFieldChange("sort_by", event.target.value)}>
          {activeConfig.sortOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select className="class-selector" value={activeState.sort_order} onChange={(event) => handleFieldChange("sort_order", event.target.value)}>
          <option value="asc">Tăng dần</option>
          <option value="desc">Giảm dần</option>
        </select>

        <button className="btn-primary" type="submit">Tìm kiếm</button>
        <button className="btn-secondary" type="button" onClick={handleReset}>Reset</button>
        <button className="btn-secondary" type="button" onClick={() => loadResource(activeTab)}>Tải lại</button>
      </form>

      <div className="content-box">
        {activeState.loading ? (
          <div className="empty">Đang tải dữ liệu...</div>
        ) : activeState.error ? (
          <div className="empty">{activeConfig.label}: {activeState.error}</div>
        ) : (
          <DataTable columns={activeConfig.columns} rows={activeState.items} emptyText="Chưa có dữ liệu." />
        )}
      </div>

      <div className="admin-toolbar">
        <button
          className="btn-secondary pagination-btn"
          type="button"
          disabled={activeState.page <= 1 || activeState.loading}
          onClick={() => handlePageChange(activeState.page - 1)}
          aria-label="Trang trước"
        >
          &lt;
        </button>
        <span className="status-info pagination-status">{activeState.page}/{totalPages}</span>
        <button
          className="btn-secondary pagination-btn"
          type="button"
          disabled={activeState.loading || activeState.page >= totalPages}
          onClick={() => handlePageChange(activeState.page + 1)}
          aria-label="Trang sau"
        >
          &gt;
        </button>
      </div>
    </>
  );
}
