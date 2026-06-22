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
      { label: "STT", render: (_, index) => index + 1 },
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
      { label: "STT", render: (_, index) => index + 1 },
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
      { label: "STT", render: (_, index) => index + 1 },
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
      { label: "STT", render: (_, index) => index + 1 },
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
      { label: "STT", render: (_, index) => index + 1 },
      { label: "Content", key: "content" },
      { label: "Grade", key: "grade" },
      { label: "Subject", key: "subject_id" }
    ]
  }
};

const tabs = Object.entries(resourceConfig).map(([key, config]) => ({ key, label: config.label }));
const PAGE_SIZE = 10;
const EXAM_CSV_TEMPLATE = [
  "title,subject_id,grade,duration,question_content,explanation,option_a,option_b,option_c,option_d,correct_option",
  '"De thi Toan lop 10",1,10,60,"2 + 2 = ?","Cong don gian","3","4","5","6",B',
  '"De thi Toan lop 10",1,10,60,"5 x 3 = ?","Nhan co ban","10","15","20","25",B'
].join("\n");

function createQuestionOption() {
  return { content: "", is_correct: false };
}

function createQuestionOptions(count = 4) {
  return Array.from({ length: count }, createQuestionOption);
}

function createExamQuestion() {
  return {
    content: "",
    explanation: "",
    QuestionOptions: createQuestionOptions(4)
  };
}

function createCreateFormState(tab) {
  if (tab === "exams") {
    return {
      title: "",
      subject_id: "",
      grade: "10",
      duration: "60",
      questions: [createExamQuestion()]
    };
  }

  return {
    content: "",
    subject_id: "",
    grade: "10",
    explanation: "",
    QuestionOptions: [createQuestionOption(), createQuestionOption()]
  };
}

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
  const { apiFetch, isAdmin, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [resources, setResources] = useState(createInitialState);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(createCreateFormState("questions"));
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvError, setCsvError] = useState("");

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

  function clearFilters() {
    updateResource(activeTab, {
      keyword: "",
      role: "",
      grade: "",
      subject_id: "",
      sort_by: activeConfig.defaultSort,
      sort_order: "desc",
      page: 1
    });
    loadResource(activeTab, {
      keyword: "",
      role: "",
      grade: "",
      subject_id: "",
      sort_by: activeConfig.defaultSort,
      sort_order: "desc",
      page: 1
    });
  }

  function handleReset() {
    const resetState = createResourceState(activeConfig);
    updateResource(activeTab, resetState);
    loadResource(activeTab, resetState);
  }

  function handleOpenCreateModal() {
    const nextForm = createCreateFormState(activeTab);
    setCreateForm(nextForm);
    setCreateError("");
    setCreateModalOpen(true);
  }

  function handleCloseCreateModal() {
    if (createSubmitting) return;
    setCreateModalOpen(false);
    setCreateError("");
  }

  function updateCreateForm(patch) {
    setCreateForm((current) => ({ ...current, ...patch }));
  }

  function updateQuestionOption(questionIndex, optionIndex, patch) {
    setCreateForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) => {
        if (index !== questionIndex) return question;
        return {
          ...question,
          QuestionOptions: question.QuestionOptions.map((option, optIndex) => (
            optIndex === optionIndex ? { ...option, ...patch } : option
          ))
        };
      })
    }));
  }

  function addExamQuestion() {
    setCreateForm((current) => ({
      ...current,
      questions: [...current.questions, createExamQuestion()]
    }));
  }

  function updateRootQuestionOption(optionIndex, patch) {
    setCreateForm((current) => ({
      ...current,
      QuestionOptions: current.QuestionOptions.map((option, index) => (
        index === optionIndex ? { ...option, ...patch } : option
      ))
    }));
  }

  function handleDownloadExamCsvTemplate() {
    const blob = new Blob([EXAM_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau-de-thi.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleExamCsvUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setCsvUploading(true);
    setCsvError("");

    try {
      await apiFetch("/exam/import_csv", {
        method: "POST",
        body: formData
      });
      await loadResource("exams", { page: 1 });
      showToast("Đã upload CSV đề thi.");
    } catch (error) {
      setCsvError(error.message || "Không thể upload CSV đề thi.");
    } finally {
      setCsvUploading(false);
      event.target.value = "";
    }
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();
    setCreateSubmitting(true);
    setCreateError("");

    try {
      if (activeTab === "exams") {
        const payload = {
          ...createForm,
          subject_id: Number(createForm.subject_id),
          grade: Number(createForm.grade),
          duration: Number(createForm.duration),
          questions: createForm.questions.map((question) => ({
            ...question,
            QuestionOptions: question.QuestionOptions.map((option) => ({
              ...option,
              is_correct: Boolean(option.is_correct)
            }))
          }))
        };
        await apiFetch("/exam/create_exam", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } else if (activeTab === "questions") {
        const payload = {
          ...createForm,
          subject_id: Number(createForm.subject_id),
          grade: Number(createForm.grade),
          QuestionOptions: createForm.QuestionOptions.map((option) => ({
            ...option,
            is_correct: Boolean(option.is_correct)
          }))
        };
        await apiFetch("/questions/create_question", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setCreateModalOpen(false);
      await loadResource(activeTab, { page: 1 });
    } catch (error) {
      setCreateError(error.message || "Không thể tạo mới.");
    } finally {
      setCreateSubmitting(false);
    }
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

      {(activeTab === "exams" || activeTab === "questions") && (
        <div className="admin-toolbar admin-toolbar-actions">
          <button className="btn-primary" type="button" onClick={handleOpenCreateModal}>
            Tạo mới {activeConfig.label.slice(0, -1).toLowerCase()}
          </button>
          {activeTab === "exams" && (
            <>
              <button className="btn-secondary" type="button" onClick={handleDownloadExamCsvTemplate}>
                Tải mẫu CSV
              </button>
              <label className={`btn-secondary ${csvUploading ? "disabled" : ""}`}>
                {csvUploading ? "Đang upload..." : "Upload CSV"}
                <input
                  accept=".csv,text/csv"
                  disabled={csvUploading}
                  onChange={handleExamCsvUpload}
                  style={{ display: "none" }}
                  type="file"
                />
              </label>
            </>
          )}
        </div>
      )}
      {activeTab === "exams" && csvError && <div className="form-error">{csvError}</div>}

      <form className="admin-filters" onSubmit={handleSearch}>
        <div className="admin-filter-block">
          <div className="admin-filter-label">Tìm kiếm nhanh</div>
          <input
            className="class-selector admin-search-input"
            value={activeState.keyword}
            onChange={(event) => handleFieldChange("keyword", event.target.value)}
            placeholder={
              activeTab === "users"
                ? "Tìm theo tên, username, email..."
                : activeTab === "news"
                ? "Tìm theo tiêu đề tin..."
                : activeTab === "documents"
                ? "Tìm theo tiêu đề tài liệu..."
                : activeTab === "exams"
                ? "Tìm theo tiêu đề đề thi..."
                : "Tìm theo nội dung câu hỏi..."
            }
          />
        </div>

        <div className="admin-filter-grid">
          {activeTab === "users" && (
            <label className="admin-field">
              <span>Vai trò</span>
              <select className="class-selector" value={activeState.role} onChange={(event) => handleFieldChange("role", event.target.value)}>
                <option value="">Tất cả role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          )}

          {["users", "documents", "exams", "questions"].includes(activeTab) && (
            <label className="admin-field">
              <span>Lớp</span>
              <select className="class-selector" value={activeState.grade} onChange={(event) => handleFieldChange("grade", event.target.value)}>
                <option value="">Tất cả lớp</option>
                <option value="10">Lớp 10</option>
                <option value="11">Lớp 11</option>
                <option value="12">Lớp 12</option>
              </select>
            </label>
          )}

          {["documents", "exams", "questions"].includes(activeTab) && (
            <label className="admin-field">
              <span>Môn học</span>
              <select className="class-selector" value={activeState.subject_id} onChange={(event) => handleFieldChange("subject_id", event.target.value)}>
                <option value="">Tất cả môn</option>
                <option value="1">Môn 1</option>
                <option value="2">Môn 2</option>
                <option value="3">Môn 3</option>
              </select>
            </label>
          )}

          <label className="admin-field">
            <span>Sắp xếp theo</span>
            <select className="class-selector" value={activeState.sort_by} onChange={(event) => handleFieldChange("sort_by", event.target.value)}>
              {activeConfig.sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>Thứ tự</span>
            <select className="class-selector" value={activeState.sort_order} onChange={(event) => handleFieldChange("sort_order", event.target.value)}>
              <option value="asc">Tăng dần</option>
              <option value="desc">Giảm dần</option>
            </select>
          </label>
        </div>

        <div className="admin-filter-actions">
          <button className="btn-primary" type="submit">Áp dụng</button>
          <button className="btn-secondary" type="button" onClick={clearFilters}>Xóa lọc</button>
          <button className="btn-secondary" type="button" onClick={() => loadResource(activeTab)}>Tải lại</button>
        </div>
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

      {createModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={handleCloseCreateModal}>
          <div className="modal-card admin-create-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{activeTab === "exams" ? "Tạo đề thi mới" : "Tạo câu hỏi mới"}</h3>
              <button className="btn-secondary" type="button" onClick={handleCloseCreateModal}>Đóng</button>
            </div>

            <form className="modal-body" onSubmit={handleCreateSubmit}>
              {activeTab === "exams" ? (
                <>
                  <input placeholder="Tiêu đề" value={createForm.title} onChange={(e) => updateCreateForm({ title: e.target.value })} />
                  <input placeholder="Subject ID" value={createForm.subject_id} onChange={(e) => updateCreateForm({ subject_id: e.target.value })} />
                  <select className="class-selector" value={createForm.grade} onChange={(e) => updateCreateForm({ grade: e.target.value })}>
                    <option value="10">Lớp 10</option>
                    <option value="11">Lớp 11</option>
                    <option value="12">Lớp 12</option>
                  </select>
                  <input type="number" min="1" placeholder="Thời gian (phút)" value={createForm.duration} onChange={(e) => updateCreateForm({ duration: e.target.value })} />
                  {createForm.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="create-section">
                      <strong>Câu hỏi {questionIndex + 1}</strong>
                      <input placeholder="Nội dung câu hỏi" value={question.content} onChange={(e) => setCreateForm((current) => ({
                        ...current,
                        questions: current.questions.map((item, index) => index === questionIndex ? { ...item, content: e.target.value } : item)
                      }))} />
                      <input placeholder="Giải thích" value={question.explanation} onChange={(e) => setCreateForm((current) => ({
                        ...current,
                        questions: current.questions.map((item, index) => index === questionIndex ? { ...item, explanation: e.target.value } : item)
                      }))} />
                      {question.QuestionOptions.map((option, optionIndex) => (
                        <div key={optionIndex} className="create-option-row">
                          <input placeholder={`Đáp án ${optionIndex + 1}`} value={option.content} onChange={(e) => updateQuestionOption(questionIndex, optionIndex, { content: e.target.value })} />
                          <label className="create-checkbox"><input type="checkbox" checked={option.is_correct} onChange={(e) => updateQuestionOption(questionIndex, optionIndex, { is_correct: e.target.checked })} /> Đúng</label>
                        </div>
                      ))}
                    </div>
                  ))}
                  <button className="btn-secondary" type="button" onClick={addExamQuestion}>Thêm câu hỏi</button>
                </>
              ) : (
                <>
                  <input placeholder="Nội dung câu hỏi" value={createForm.content} onChange={(e) => updateCreateForm({ content: e.target.value })} />
                  <input placeholder="Subject ID" value={createForm.subject_id} onChange={(e) => updateCreateForm({ subject_id: e.target.value })} />
                  <input placeholder="Grade" value={createForm.grade} onChange={(e) => updateCreateForm({ grade: e.target.value })} />
                  <input placeholder="Giải thích" value={createForm.explanation} onChange={(e) => updateCreateForm({ explanation: e.target.value })} />
                  {createForm.QuestionOptions.map((option, optionIndex) => (
                    <div key={optionIndex} className="create-option-row">
                      <input placeholder={`Đáp án ${optionIndex + 1}`} value={option.content} onChange={(e) => updateRootQuestionOption(optionIndex, { content: e.target.value })} />
                      <label className="create-checkbox"><input type="checkbox" checked={option.is_correct} onChange={(e) => updateRootQuestionOption(optionIndex, { is_correct: e.target.checked })} /> Đúng</label>
                    </div>
                  ))}
                </>
              )}

              {createError && <div className="empty">{createError}</div>}
              <button className="btn-primary" type="submit" disabled={createSubmitting}>
                {createSubmitting ? "Đang tạo..." : "Lưu"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
