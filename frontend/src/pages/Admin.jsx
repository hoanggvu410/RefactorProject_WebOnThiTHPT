import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { resolveApiUrl } from "../services/api.js";

function renderValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return String(value);
  return value;
}

function getRowUuid(row) {
  return row?.uuid || row?.user_uuid || row?.news_uuid || row?.document_uuid || row?.exam_uuid || row?.question_uuid;
}

function getResourcePath(resourceKey, row) {
  const uuid = getRowUuid(row);
  if (!uuid) return "";
  if (resourceKey === "exams") return `/exam/${uuid}`;
  return `${resourceConfig[resourceKey].endpoint}${uuid}`;
}

function isProtectedAdmin(row) {
  return row?.role === "admin";
}

function normalizeDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function createEditFormState(resourceKey, row) {
  if (resourceKey === "users") {
    return {
      name: row?.name || "",
      username: row?.username || "",
      email: row?.email || "",
      grade: row?.grade ? String(row.grade) : "10",
      password: ""
    };
  }

  if (resourceKey === "news") {
    return {
      title: row?.title || "",
      content: row?.content || "",
      date: normalizeDateInput(row?.date),
      link: row?.link || ""
    };
  }

  if (resourceKey === "documents") {
    return {
      title: row?.title || "",
      grade: row?.grade ? String(row.grade) : "10",
      subject_id: row?.subject_id ? String(row.subject_id) : ""
    };
  }

  if (resourceKey === "exams") {
    return {
      title: row?.title || "",
      subject_id: row?.subject_id ? String(row.subject_id) : "",
      grade: row?.grade ? String(row.grade) : "10",
      duration: row?.duration ? String(row.duration) : ""
    };
  }

  if (resourceKey === "questions") {
    const options = row?.questionOptions || row?.QuestionOptions || [];
    return {
      content: row?.content || "",
      subject_id: row?.subject_id ? String(row.subject_id) : "",
      grade: row?.grade ? String(row.grade) : "10",
      explanation: row?.explanation || "",
      QuestionOptions: options.length > 0
        ? options.map((option) => ({
            content: option.content || "",
            is_correct: Boolean(option.is_correct)
          }))
        : [createQuestionOption(), createQuestionOption()]
    };
  }

  return {};
}

function buildEditPayload(resourceKey, form) {
  if (resourceKey === "users") {
    return {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      grade: Number(form.grade),
      password: form.password
    };
  }

  if (resourceKey === "documents") {
    return {
      title: form.title.trim(),
      grade: Number(form.grade),
      subject_id: Number(form.subject_id)
    };
  }

  if (resourceKey === "exams") {
    return {
      title: form.title.trim(),
      subject_id: Number(form.subject_id),
      grade: Number(form.grade),
      duration: Number(form.duration)
    };
  }

  if (resourceKey === "questions") {
    return {
      content: form.content.trim(),
      subject_id: Number(form.subject_id),
      grade: Number(form.grade),
      explanation: form.explanation.trim(),
      QuestionOptions: form.QuestionOptions.map((option) => ({
        content: option.content.trim(),
        is_correct: Boolean(option.is_correct)
      }))
    };
  }

  return {
    title: form.title.trim(),
    content: form.content.trim(),
    date: form.date,
    link: form.link.trim()
  };
}

function getEditMethod(resourceKey) {
  return resourceKey === "exams" || resourceKey === "questions" ? "PATCH" : "PUT";
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
      { label: "Grade", key: "grade" },
      { label: "Status", render: (row) => row.is_active === false ? "Khóa" : "Hoạt động" }
    ]
  },
  news: {
    label: "News",
    endpoint: "/news/",
    defaultSort: "date",
    sortOptions: [
      { value: "date", label: "Date" },
      { value: "title", label: "Title" },
      { value: "published_at", label: "Published At" }
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
      { value: "subject_id", label: "Subject" }
    ],
    columns: [
      { label: "STT", render: (_, index) => index + 1 },
      { label: "Title", key: "title" },
      { label: "Grade", key: "grade" },
      { label: "Subject", key: "subject_id" },
      { label: "Link", render: (row) => row.link ? <a href={resolveApiUrl(row.link)} target="_blank" rel="noreferrer">Tải xuống</a> : "" }
    ]
  },
  exams: {
    label: "Exams",
    endpoint: "/exam/",
    defaultSort: "title",
    sortOptions: [
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
    defaultSort: "content",
    sortOptions: [
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
  const [subjects, setSubjects] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(createCreateFormState("questions"));
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);
  const [documentUploadForm, setDocumentUploadForm] = useState({
    title: "",
    subject_id: "",
    grade: "10",
    file: null
  });
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState("");
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [adminStats, setAdminStats] = useState(null);
  const [adminStatsError, setAdminStatsError] = useState("");
  const [detailModal, setDetailModal] = useState({
    open: false,
    loading: false,
    error: "",
    resourceKey: "",
    item: null
  });
  const [editModal, setEditModal] = useState({
    open: false,
    loading: false,
    error: "",
    resourceKey: "",
    item: null,
    form: {}
  });
  const [actionLoading, setActionLoading] = useState("");

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

  const loadAdminStats = useCallback(async () => {
    if (!isAdmin) return;
    setAdminStatsError("");
    try {
      const payload = await apiFetch("/users/stats");
      setAdminStats(payload);
    } catch (error) {
      setAdminStatsError(error.message || "Không tải được thống kê admin.");
      setAdminStats(null);
    }
  }, [apiFetch, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    tabs.forEach((tab) => loadResource(tab.key));
    loadAdminStats();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    async function loadSubjects() {
      try {
        const payload = await apiFetch("/subjects/");
        setSubjects(Array.isArray(payload) ? payload : []);
      } catch {
        setSubjects([]);
      }
    }
    loadSubjects();
  }, [apiFetch, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const current = resources[activeTab];
    if (!current.loading && !current.loaded) {
      loadResource(activeTab);
    }
  }, [activeTab, isAdmin, loadResource, resources]);

  const stats = useMemo(() => ({
    users: adminStats?.total_users ?? resources.users.total ?? resources.users.items.length,
    exams: adminStats?.total_exams ?? resources.exams.total ?? resources.exams.items.length,
    questions: adminStats?.total_questions ?? resources.questions.total ?? resources.questions.items.length,
    submissions: adminStats?.total_submissions ?? 0,
    avgScore: adminStats?.avg_score_all_time ?? 0
  }), [adminStats, resources]);

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

  function handleOpenDocumentUpload() {
    setDocumentUploadForm({
      title: "",
      subject_id: subjects[0]?.subject_id ? String(subjects[0].subject_id) : "",
      grade: "10",
      file: null
    });
    setDocumentUploadError("");
    setDocumentUploadOpen(true);
  }

  function handleCloseDocumentUpload() {
    if (documentUploading) return;
    setDocumentUploadOpen(false);
    setDocumentUploadError("");
  }

  function closeDetailModal() {
    setDetailModal({
      open: false,
      loading: false,
      error: "",
      resourceKey: "",
      item: null
    });
  }

  function closeEditModal() {
    if (editModal.loading) return;
    setEditModal({
      open: false,
      loading: false,
      error: "",
      resourceKey: "",
      item: null,
      form: {}
    });
  }

  async function handleViewUser(row) {
    setDetailModal({
      open: true,
      loading: true,
      error: "",
      resourceKey: "users",
      item: row
    });

    try {
      const payload = await apiFetch(getResourcePath("users", row));
      setDetailModal({
        open: true,
        loading: false,
        error: "",
        resourceKey: "users",
        item: payload
      });
    } catch (error) {
      setDetailModal((current) => ({
        ...current,
        loading: false,
        error: error.message || "Không tải được chi tiết user."
      }));
    }
  }

  async function handleOpenEditModal(resourceKey, row) {
    if (resourceKey === "users" && isProtectedAdmin(row)) {
      showToast("Tài khoản admin hệ thống không thể sửa tại bảng quản trị.", "error");
      return;
    }

    setEditModal({
      open: true,
      loading: resourceKey === "questions",
      error: "",
      resourceKey,
      item: row,
      form: createEditFormState(resourceKey, row)
    });

    if (resourceKey !== "questions") return;

    try {
      const payload = await apiFetch(getResourcePath(resourceKey, row));
      const merged = { ...row, ...payload };
      setEditModal({
        open: true,
        loading: false,
        error: "",
        resourceKey,
        item: merged,
        form: createEditFormState(resourceKey, merged)
      });
    } catch (error) {
      setEditModal((current) => ({
        ...current,
        loading: false,
        error: error.message || "Không tải được chi tiết câu hỏi."
      }));
    }
  }

  function updateEditForm(patch) {
    setEditModal((current) => ({
      ...current,
      form: { ...current.form, ...patch }
    }));
  }

  function updateEditQuestionOption(optionIndex, patch) {
    setEditModal((current) => ({
      ...current,
      form: {
        ...current.form,
        QuestionOptions: (current.form.QuestionOptions || []).map((option, index) => (
          index === optionIndex ? { ...option, ...patch } : option
        ))
      }
    }));
  }

  function addEditQuestionOption() {
    setEditModal((current) => ({
      ...current,
      form: {
        ...current.form,
        QuestionOptions: [...(current.form.QuestionOptions || []), createQuestionOption()]
      }
    }));
  }

  function removeEditQuestionOption(optionIndex) {
    setEditModal((current) => ({
      ...current,
      form: {
        ...current.form,
        QuestionOptions: (current.form.QuestionOptions || []).filter((_, index) => index !== optionIndex)
      }
    }));
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    if (!editModal.resourceKey || !editModal.item) return;

    const { resourceKey, item, form } = editModal;
    setEditModal((current) => ({ ...current, loading: true, error: "" }));

    try {
      await apiFetch(getResourcePath(resourceKey, item), {
        method: getEditMethod(resourceKey),
        body: JSON.stringify(buildEditPayload(resourceKey, form))
      });
      setEditModal({
        open: false,
        loading: false,
        error: "",
        resourceKey: "",
        item: null,
        form: {}
      });
      await loadResource(resourceKey);
      if (resourceKey === "users" || resourceKey === "questions") await loadAdminStats();
      showToast("Đã cập nhật dữ liệu.");
    } catch (error) {
      setEditModal((current) => ({
        ...current,
        loading: false,
        error: error.message || "Không thể cập nhật dữ liệu."
      }));
    }
  }

  async function handleToggleUserActive(row) {
    if (isProtectedAdmin(row)) {
      showToast("Tài khoản admin hệ thống không thể khóa.", "error");
      return;
    }

    const uuid = getRowUuid(row);
    if (!uuid) return;

    const nextActive = row.is_active === false;
    const label = `${uuid}:active`;
    setActionLoading(label);

    try {
      await apiFetch(`/users/${uuid}/is-active`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextActive })
      });
      await loadResource("users");
      await loadAdminStats();
      showToast(nextActive ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.");
    } catch (error) {
      showToast(error.message || "Không thể cập nhật trạng thái tài khoản.", "error");
    } finally {
      setActionLoading("");
    }
  }

  async function handleDeleteResource(resourceKey, row) {
    if (resourceKey === "users" && isProtectedAdmin(row)) {
      showToast("Tài khoản admin hệ thống không thể xóa.", "error");
      return;
    }

    const uuid = getRowUuid(row);
    if (!uuid) return;

    const confirmed = window.confirm("Bạn chắc chắn muốn xóa mục này?");
    if (!confirmed) return;

    const label = `${resourceKey}:${uuid}:delete`;
    setActionLoading(label);

    try {
      await apiFetch(getResourcePath(resourceKey, row), { method: "DELETE" });
      await loadResource(resourceKey);
      if (resourceKey === "users" || resourceKey === "exams" || resourceKey === "questions") await loadAdminStats();
      showToast("Đã xóa dữ liệu.");
    } catch (error) {
      showToast(error.message || "Không thể xóa dữ liệu.", "error");
    } finally {
      setActionLoading("");
    }
  }

  async function handleDocumentUploadSubmit(event) {
    event.preventDefault();
    if (!documentUploadForm.file) {
      setDocumentUploadError("Vui lòng chọn file tài liệu.");
      return;
    }

    const formData = new FormData();
    formData.append("title", documentUploadForm.title);
    formData.append("grade", documentUploadForm.grade);
    formData.append("subject_id", documentUploadForm.subject_id);
    formData.append("file", documentUploadForm.file);

    setDocumentUploading(true);
    setDocumentUploadError("");

    try {
      await apiFetch("/documents/create_document", {
        method: "POST",
        body: formData
      });
      setDocumentUploadOpen(false);
      await loadResource("documents", { page: 1 });
      showToast("Đã upload tài liệu.");
    } catch (error) {
      setDocumentUploadError(error.message || "Không thể upload tài liệu.");
    } finally {
      setDocumentUploading(false);
    }
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

  function renderRowActions(resourceKey, row) {
    const uuid = getRowUuid(row);
    const deleteLoading = actionLoading === `${resourceKey}:${uuid}:delete`;
    const activeLoading = actionLoading === `${uuid}:active`;
    const protectedAdmin = resourceKey === "users" && isProtectedAdmin(row);

    return (
      <div className="admin-row-actions">
        {resourceKey === "users" && (
          <>
            <button className="btn-secondary btn-small" type="button" onClick={() => handleViewUser(row)}>
              Xem
            </button>
            <button
              className="btn-secondary btn-small"
              type="button"
              disabled={activeLoading}
              onClick={() => handleToggleUserActive(row)}
              hidden={protectedAdmin}
            >
              {row.is_active === false ? "Mở khóa" : "Khóa"}
            </button>
          </>
        )}
        {!protectedAdmin && (
          <>
            <button className="btn-secondary btn-small" type="button" onClick={() => handleOpenEditModal(resourceKey, row)}>
              Sửa
            </button>
            <button
              className="btn-secondary btn-small danger"
              type="button"
              disabled={deleteLoading}
              onClick={() => handleDeleteResource(resourceKey, row)}
            >
              Xóa
            </button>
          </>
        )}
      </div>
    );
  }

  function renderEditFields() {
    const { resourceKey, form } = editModal;

    if (resourceKey === "users") {
      return (
        <>
          <label>
            <span>Họ tên</span>
            <input required value={form.name || ""} onChange={(event) => updateEditForm({ name: event.target.value })} />
          </label>
          <label>
            <span>Username</span>
            <input required value={form.username || ""} onChange={(event) => updateEditForm({ username: event.target.value })} />
          </label>
          <label>
            <span>Email</span>
            <input required type="email" value={form.email || ""} onChange={(event) => updateEditForm({ email: event.target.value })} />
          </label>
          <label>
            <span>Lớp</span>
            <select className="class-selector" value={form.grade || "10"} onChange={(event) => updateEditForm({ grade: event.target.value })}>
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </label>
          <label>
            <span>Mật khẩu mới</span>
            <input required minLength={6} type="password" value={form.password || ""} onChange={(event) => updateEditForm({ password: event.target.value })} />
          </label>
        </>
      );
    }

    if (resourceKey === "news") {
      return (
        <>
          <label>
            <span>Tiêu đề</span>
            <input required value={form.title || ""} onChange={(event) => updateEditForm({ title: event.target.value })} />
          </label>
          <label>
            <span>Nội dung</span>
            <textarea required value={form.content || ""} onChange={(event) => updateEditForm({ content: event.target.value })} />
          </label>
          <label>
            <span>Ngày</span>
            <input required type="date" value={form.date || ""} onChange={(event) => updateEditForm({ date: event.target.value })} />
          </label>
          <label>
            <span>Link</span>
            <input required value={form.link || ""} onChange={(event) => updateEditForm({ link: event.target.value })} />
          </label>
        </>
      );
    }

    if (resourceKey === "documents") {
      return (
        <>
          <label>
            <span>Tiêu đề</span>
            <input required value={form.title || ""} onChange={(event) => updateEditForm({ title: event.target.value })} />
          </label>
          <label>
            <span>Môn học</span>
            <select className="class-selector" required value={form.subject_id || ""} onChange={(event) => updateEditForm({ subject_id: event.target.value })}>
              <option value="">Chọn môn học</option>
              {subjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>{subject.subject_name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Lớp</span>
            <select className="class-selector" value={form.grade || "10"} onChange={(event) => updateEditForm({ grade: event.target.value })}>
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </label>
        </>
      );
    }

    if (resourceKey === "exams") {
      return (
        <>
          <label>
            <span>Tiêu đề</span>
            <input required value={form.title || ""} onChange={(event) => updateEditForm({ title: event.target.value })} />
          </label>
          <label>
            <span>Môn học</span>
            <select className="class-selector" required value={form.subject_id || ""} onChange={(event) => updateEditForm({ subject_id: event.target.value })}>
              <option value="">Chọn môn học</option>
              {subjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>{subject.subject_name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Lớp</span>
            <select className="class-selector" value={form.grade || "10"} onChange={(event) => updateEditForm({ grade: event.target.value })}>
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </label>
          <label>
            <span>Thời gian (phút)</span>
            <input required min="1" type="number" value={form.duration || ""} onChange={(event) => updateEditForm({ duration: event.target.value })} />
          </label>
        </>
      );
    }

    if (resourceKey === "questions") {
      return (
        <>
          <label>
            <span>Nội dung câu hỏi</span>
            <textarea required value={form.content || ""} onChange={(event) => updateEditForm({ content: event.target.value })} />
          </label>
          <label>
            <span>Môn học</span>
            <select className="class-selector" required value={form.subject_id || ""} onChange={(event) => updateEditForm({ subject_id: event.target.value })}>
              <option value="">Chọn môn học</option>
              {subjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>{subject.subject_name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Lớp</span>
            <select className="class-selector" value={form.grade || "10"} onChange={(event) => updateEditForm({ grade: event.target.value })}>
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </label>
          <label>
            <span>Giải thích</span>
            <input value={form.explanation || ""} onChange={(event) => updateEditForm({ explanation: event.target.value })} />
          </label>
          <div className="create-section">
            <strong>Đáp án</strong>
            {(form.QuestionOptions || []).map((option, optionIndex) => (
              <div key={optionIndex} className="create-option-row">
                <input
                  required
                  placeholder={`Đáp án ${optionIndex + 1}`}
                  value={option.content || ""}
                  onChange={(event) => updateEditQuestionOption(optionIndex, { content: event.target.value })}
                />
                <label className="create-checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(option.is_correct)}
                    onChange={(event) => updateEditQuestionOption(optionIndex, { is_correct: event.target.checked })}
                  /> Đúng
                </label>
                {(form.QuestionOptions || []).length > 2 && (
                  <button className="btn-secondary btn-small danger" type="button" onClick={() => removeEditQuestionOption(optionIndex)}>
                    Xóa đáp án
                  </button>
                )}
              </div>
            ))}
            <button className="btn-secondary" type="button" onClick={addEditQuestionOption}>Thêm đáp án</button>
          </div>
        </>
      );
    }

    return null;
  }

  const activeColumns = [
    ...activeConfig.columns,
    { label: "Actions", render: (row) => renderRowActions(activeTab, row) }
  ];

  return (
    <>
      <SectionTitle>🛠️ Admin Dashboard</SectionTitle>

      <div className="admin-hero">
        <div className="admin-card"><div className="admin-card-label">Users</div><div className="admin-card-value">{stats.users}</div></div>
        <div className="admin-card"><div className="admin-card-label">Exams</div><div className="admin-card-value">{stats.exams}</div></div>
        <div className="admin-card"><div className="admin-card-label">Questions</div><div className="admin-card-value">{stats.questions}</div></div>
        <div className="admin-card"><div className="admin-card-label">Submissions</div><div className="admin-card-value">{stats.submissions}</div></div>
        <div className="admin-card"><div className="admin-card-label">Avg Score</div><div className="admin-card-value">{Number(stats.avgScore || 0).toFixed(1)}</div></div>
      </div>
      {adminStatsError && <div className="status-info">Đang dùng thống kê tạm từ bảng vì không tải được `/users/stats`.</div>}

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

      {(activeTab === "documents" || activeTab === "exams" || activeTab === "questions") && (
        <div className="admin-toolbar admin-toolbar-actions">
          {activeTab === "documents" ? (
            <button className="btn-primary" type="button" onClick={handleOpenDocumentUpload}>
              Upload tài liệu
            </button>
          ) : (
            <button className="btn-primary" type="button" onClick={handleOpenCreateModal}>
              Tạo mới {activeConfig.label.slice(0, -1).toLowerCase()}
            </button>
          )}
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
        <input
          aria-label="Tìm kiếm nhanh"
          className="class-selector admin-search-input"
          value={activeState.keyword}
          onChange={(event) => handleFieldChange("keyword", event.target.value)}
          placeholder={
            activeTab === "users"
              ? "Tên, username, email..."
              : activeTab === "news"
              ? "Tiêu đề tin..."
              : activeTab === "documents"
              ? "Tiêu đề tài liệu..."
              : activeTab === "exams"
              ? "Tiêu đề đề thi..."
              : "Nội dung câu hỏi..."
          }
        />

        {["users", "documents", "exams", "questions"].includes(activeTab) && (
          <select
            aria-label="Lọc theo lớp"
            className="class-selector admin-filter-control"
            value={activeState.grade}
            onChange={(event) => handleFieldChange("grade", event.target.value)}
          >
            <option value="">Tất cả lớp</option>
            <option value="10">Lớp 10</option>
            <option value="11">Lớp 11</option>
            <option value="12">Lớp 12</option>
          </select>
        )}

        {["documents", "exams", "questions"].includes(activeTab) && (
          <select
            aria-label="Lọc theo môn học"
            className="class-selector admin-filter-control"
            value={activeState.subject_id}
            onChange={(event) => handleFieldChange("subject_id", event.target.value)}
          >
            <option value="">Tất cả môn</option>
            {subjects.map((subject) => (
              <option key={subject.subject_id} value={subject.subject_id}>
                {subject.subject_name}
              </option>
            ))}
          </select>
        )}

        <select
          aria-label="Sắp xếp theo"
          className="class-selector admin-filter-control"
          value={activeState.sort_by}
          onChange={(event) => handleFieldChange("sort_by", event.target.value)}
        >
          {activeConfig.sortOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          aria-label="Thứ tự sắp xếp"
          className="class-selector admin-filter-control"
          value={activeState.sort_order}
          onChange={(event) => handleFieldChange("sort_order", event.target.value)}
        >
          <option value="asc">Tăng dần</option>
          <option value="desc">Giảm dần</option>
        </select>

        <div className="admin-filter-actions">
          <button className="btn-primary" type="submit">Áp dụng</button>
          <button className="btn-secondary" type="button" onClick={clearFilters}>Xóa lọc</button>
        </div>
      </form>

      <div className="content-box">
        {activeState.loading ? (
          <div className="empty">Đang tải dữ liệu...</div>
        ) : activeState.error ? (
          <div className="empty">{activeConfig.label}: {activeState.error}</div>
        ) : (
          <DataTable columns={activeColumns} rows={activeState.items} emptyText="Chưa có dữ liệu." />
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

      {detailModal.open && (
        <div className="modal-backdrop" role="presentation" onClick={closeDetailModal}>
          <div className="modal-card admin-create-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết user</h3>
              <button className="btn-secondary" type="button" onClick={closeDetailModal}>Đóng</button>
            </div>
            <div className="modal-body">
              {detailModal.loading ? (
                <div className="empty">Đang tải chi tiết user...</div>
              ) : detailModal.error ? (
                <div className="form-error">{detailModal.error}</div>
              ) : (
                <div className="profile-info-grid">
                  {Object.entries(detailModal.item || {}).map(([key, value]) => (
                    <div className="profile-info-row" key={key}>
                      <span>{key}</span>
                      <strong>{renderValue(value)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editModal.open && (
        <div className="modal-backdrop" role="presentation" onClick={closeEditModal}>
          <div className="modal-card admin-create-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Sửa {resourceConfig[editModal.resourceKey]?.label || "dữ liệu"}</h3>
              <button className="btn-secondary" type="button" onClick={closeEditModal}>Đóng</button>
            </div>
            <form className="modal-body" onSubmit={handleEditSubmit}>
              {renderEditFields()}
              {editModal.resourceKey === "exams" && (
                <div className="status-info">Phần chỉnh sửa câu hỏi trong đề thi sẽ làm sau.</div>
              )}
              {editModal.resourceKey === "documents" && (
                <div className="status-info">Form này chỉ sửa thông tin tài liệu, không thay file đã upload.</div>
              )}
              {editModal.resourceKey === "questions" && (
                <div className="status-info">Cần ít nhất 2 đáp án và ít nhất 1 đáp án đúng.</div>
              )}
              {editModal.error && <div className="form-error">{editModal.error}</div>}
              <button className="btn-primary" type="submit" disabled={editModal.loading}>
                {editModal.loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          </div>
        </div>
      )}

      {documentUploadOpen && (
        <div className="modal-backdrop" role="presentation" onClick={handleCloseDocumentUpload}>
          <div className="modal-card admin-create-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload tài liệu mới</h3>
              <button className="btn-secondary" type="button" onClick={handleCloseDocumentUpload}>Đóng</button>
            </div>

            <form className="modal-body" onSubmit={handleDocumentUploadSubmit}>
              <label>
                <span>Tiêu đề</span>
                <input
                  required
                  placeholder="Nhập tiêu đề tài liệu"
                  value={documentUploadForm.title}
                  onChange={(event) => setDocumentUploadForm((current) => ({ ...current, title: event.target.value }))}
                />
              </label>

              <label>
                <span>Môn học</span>
                <select
                  className="class-selector"
                  required
                  value={documentUploadForm.subject_id}
                  onChange={(event) => setDocumentUploadForm((current) => ({ ...current, subject_id: event.target.value }))}
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Lớp</span>
                <select
                  className="class-selector"
                  value={documentUploadForm.grade}
                  onChange={(event) => setDocumentUploadForm((current) => ({ ...current, grade: event.target.value }))}
                >
                  <option value="10">Lớp 10</option>
                  <option value="11">Lớp 11</option>
                  <option value="12">Lớp 12</option>
                </select>
              </label>

              <label>
                <span>File tài liệu</span>
                <input
                  required
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  type="file"
                  onChange={(event) => setDocumentUploadForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                />
              </label>

              {documentUploadError && <div className="form-error">{documentUploadError}</div>}
              <button className="btn-primary" type="submit" disabled={documentUploading}>
                {documentUploading ? "Đang upload..." : "Upload tài liệu"}
              </button>
            </form>
          </div>
        </div>
      )}

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
                  <select className="class-selector" value={createForm.subject_id} onChange={(e) => updateCreateForm({ subject_id: e.target.value })}>
                    <option value="">Chọn môn học</option>
                    {subjects.map((subject) => (
                      <option key={subject.subject_id} value={subject.subject_id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
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
                  <select className="class-selector" value={createForm.subject_id} onChange={(e) => updateCreateForm({ subject_id: e.target.value })}>
                    <option value="">Chọn môn học</option>
                    {subjects.map((subject) => (
                      <option key={subject.subject_id} value={subject.subject_id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
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
