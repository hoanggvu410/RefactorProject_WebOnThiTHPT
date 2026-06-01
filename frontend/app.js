const state = {
  token: localStorage.getItem("access_token") || "",
};

const demoResults = [
  { resultID: 101, examID: 12, score: 8.5, timeSpent: 42, submittedAt: "2026-06-01" },
  { resultID: 102, examID: 15, score: 9.0, timeSpent: 38, submittedAt: "2026-06-01" },
];

const demoReview = {
  title: "Đề ôn tập Toán THPT",
  score: 8.5,
  timeSpent: 42,
  questions: [
    {
      content: "1 + 1 bằng bao nhiêu?",
      selectedOptionID: 2,
      is_correct: true,
      questionOptions: [
        { questionoptionID: 1, content: "1" },
        { questionoptionID: 2, content: "2" },
      ],
    },
    {
      content: "2 x 3 bằng bao nhiêu?",
      selectedOptionID: 3,
      is_correct: false,
      questionOptions: [
        { questionoptionID: 3, content: "5" },
        { questionoptionID: 4, content: "6" },
      ],
    },
  ],
};

function $(id) {
  return document.getElementById(id);
}

function setStatus(text) {
  $("resultStatus").textContent = text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(typeof payload === "object" ? payload?.error?.message || payload?.message || "Request failed" : payload || "Request failed");
  }
  return payload;
}

function saveToken(token) {
  state.token = token || "";
  if (token) localStorage.setItem("access_token", token);
  else localStorage.removeItem("access_token");
  $("tokenState").textContent = token ? "Token: đã lưu" : "Token: chưa có";
}

function renderTable(containerId, columns, rows, emptyText) {
  const container = $(containerId);
  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="empty">${escapeHtml(emptyText)}</div>`;
    return;
  }

  const head = columns.map((col) => `<th>${escapeHtml(col.label)}</th>`).join("");
  const body = rows.map((row) => {
    const cells = columns.map((col) => {
      const value = typeof col.render === "function" ? col.render(row) : row[col.key];
      return `<td>${value ?? ""}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  container.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderList(containerId, rows, emptyText) {
  const container = $(containerId);
  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="empty">${escapeHtml(emptyText)}</div>`;
    return;
  }
  container.innerHTML = rows.map((row) => `<span class="chip">${escapeHtml(row)}</span>`).join("");
}

function renderReview(review) {
  const box = $("reviewBox");
  if (!review || !review.questions || review.questions.length === 0) {
    box.className = "content-box empty";
    box.textContent = "Không có dữ liệu review.";
    return;
  }

  box.className = "content-box";
  box.innerHTML = `
    <div class="review-item">
      <div class="review-meta">
        <span class="tag">${escapeHtml(review.title || "Đề thi")}</span>
        <span class="tag">${escapeHtml(review.score ?? "-")} điểm</span>
        <span class="tag">${escapeHtml(review.timeSpent ?? "-")} phút</span>
      </div>
    </div>
    ${review.questions.map((q, index) => `
      <div class="review-item">
        <h3>Câu ${index + 1}. ${escapeHtml(q.content)}</h3>
        <div class="review-meta">
          <span class="tag">${q.is_correct ? "Đúng" : "Sai"}</span>
          <span class="tag">Selected #${escapeHtml(q.selectedOptionID)}</span>
        </div>
        ${(q.questionOptions || []).map((opt) => `
          <div class="chip">${escapeHtml(opt.questionoptionID ?? opt.id ?? "-")} · ${escapeHtml(opt.content || "")}</div>
        `).join("")}
      </div>
    `).join("")}
  `;
}

async function loadProfile() {
  if (!state.token) {
    $("profileState").textContent = "Profile: -";
    return;
  }
  try {
    const profile = await apiFetch("/users/profile");
    $("profileState").textContent = `Profile: ${profile.username || "user"} · ${profile.role || "role"}`;
    $("authStatus").textContent = "Đã đăng nhập";
  } catch (error) {
    $("profileState").textContent = `Profile: lỗi (${error.message})`;
  }
}

async function login() {
  const username = $("username").value.trim();
  const password = $("password").value;
  if (!username || !password) {
    setStatus("Nhập username và password");
    return;
  }
  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    saveToken(data.access_token);
    $("authStatus").textContent = "Đã đăng nhập";
    await loadProfile();
    setStatus("Đăng nhập thành công");
  } catch (error) {
    saveToken("");
    $("authStatus").textContent = "Chưa đăng nhập";
    setStatus(`Lỗi đăng nhập: ${error.message}`);
  }
}

function logout() {
  saveToken("");
  $("authStatus").textContent = "Chưa đăng nhập";
  $("profileState").textContent = "Profile: -";
  $("resultsList").innerHTML = `<div class="empty">Hãy đăng nhập để xem kết quả.</div>`;
  $("reviewBox").className = "content-box empty";
  $("reviewBox").textContent = "Chọn Result ID để xem review.";
  setStatus("Đã đăng xuất");
}

async function loadResults() {
  const userId = $("userId").value.trim();
  if (!userId) {
    setStatus("Nhập User ID trước");
    return;
  }
  try {
    const results = await apiFetch(`/results/user/${userId}`);
    const items = Array.isArray(results) ? results : [results];
    $("resultCount").textContent = items.length;
    $("bestScore").textContent = items.length ? Math.max(...items.map((i) => Number(i.score || 0))).toFixed(1) : "-";
    renderTable(
      "resultsList",
      [
        { label: "Result ID", key: "resultID" },
        { label: "Exam ID", key: "examID" },
        { label: "Score", render: (row) => row.score },
        { label: "Time", render: (row) => `${row.timeSpent} phút` },
      ],
      items,
      "Chưa có kết quả."
    );
    setStatus("Đã tải kết quả");
  } catch (error) {
    $("resultCount").textContent = demoResults.length;
    $("bestScore").textContent = Math.max(...demoResults.map((i) => i.score)).toFixed(1);
    renderTable(
      "resultsList",
      [
        { label: "Result ID", key: "resultID" },
        { label: "Exam ID", key: "examID" },
        { label: "Score", render: (row) => row.score },
        { label: "Time", render: (row) => `${row.timeSpent} phút` },
      ],
      demoResults,
      "Demo"
    );
    setStatus(`Dùng dữ liệu demo: ${error.message}`);
  }
}

async function loadReview() {
  const resultId = $("resultId").value.trim();
  if (!resultId) {
    setStatus("Nhập Result ID trước");
    return;
  }
  try {
    const review = await apiFetch(`/results/review/${resultId}`);
    renderReview(review);
    setStatus("Đã tải review");
  } catch (error) {
    renderReview(demoReview);
    setStatus(`Dùng review demo: ${error.message}`);
  }
}

async function loadSubjects() {
  try {
    const subjects = await apiFetch("/subjects/");
    renderList(
      "subjectsList",
      (Array.isArray(subjects) ? subjects : []).map((item) => item.subjectName || item.name || item.title || `Subject ${item.subjectID}`),
      "Chưa có môn học."
    );
  } catch {
    renderList("subjectsList", ["Toán", "Ngữ văn", "Tiếng Anh"], "Demo");
  }
}

async function loadExams() {
  try {
    const exams = await apiFetch("/exam/");
    renderTable(
      "examsList",
      [
        { label: "ID", key: "examID" },
        { label: "Title", key: "title" },
        { label: "Q", key: "questionNumber" },
        { label: "Min", render: (row) => row.duration },
      ],
      Array.isArray(exams) ? exams : [],
      "Chưa có đề thi."
    );
  } catch {
    renderTable(
      "examsList",
      [
        { label: "ID", key: "examID" },
        { label: "Title", key: "title" },
        { label: "Q", key: "questionNumber" },
        { label: "Min", render: (row) => row.duration },
      ],
      [
        { examID: 12, title: "Đề Toán", questionNumber: 50, duration: 90 },
        { examID: 15, title: "Đề Văn", questionNumber: 40, duration: 120 },
      ],
      "Demo"
    );
  }
}

async function loadDocuments() {
  try {
    const docs = await apiFetch("/documents/");
    renderTable(
      "documentsList",
      [
        { label: "ID", key: "documentID" },
        { label: "Title", key: "title" },
        { label: "Grade", key: "grade" },
      ],
      Array.isArray(docs) ? docs : [],
      "Chưa có tài liệu."
    );
  } catch {
    renderTable(
      "documentsList",
      [
        { label: "ID", key: "documentID" },
        { label: "Title", key: "title" },
        { label: "Grade", key: "grade" },
      ],
      [
        { documentID: 1, title: "Công thức Toán", grade: 12 },
        { documentID: 2, title: "Ngữ văn trọng tâm", grade: 12 },
      ],
      "Demo"
    );
  }
}

async function loadNews() {
  try {
    const news = await apiFetch("/news/");
    renderTable(
      "newsList",
      [
        { label: "ID", key: "newsID" },
        { label: "Title", key: "title" },
        { label: "Date", key: "date" },
      ],
      Array.isArray(news) ? news : [],
      "Chưa có tin tức."
    );
  } catch {
    renderTable(
      "newsList",
      [
        { label: "ID", key: "newsID" },
        { label: "Title", key: "title" },
        { label: "Date", key: "date" },
      ],
      [
        { newsID: 1, title: "Lịch thi THPT cập nhật", date: "2026-06-01" },
        { newsID: 2, title: "Mẹo ôn thi hiệu quả", date: "2026-06-01" },
      ],
      "Demo"
    );
  }
}

function bindEvents() {
  $("btnLogin").addEventListener("click", login);
  $("btnLogout").addEventListener("click", logout);
  $("btnLoadProfile").addEventListener("click", loadProfile);
  $("btnLoadResults").addEventListener("click", loadResults);
  $("btnReviewResult").addEventListener("click", loadReview);
  $("btnLoadSubjects").addEventListener("click", loadSubjects);
  $("btnLoadExams").addEventListener("click", loadExams);
  $("btnLoadDocuments").addEventListener("click", loadDocuments);
  $("btnLoadNews").addEventListener("click", loadNews);
}

async function init() {
  bindEvents();
  saveToken(state.token);
  $("resultsList").innerHTML = `<div class="empty">Hãy đăng nhập để xem dữ liệu.</div>`;
  if (state.token) {
    await loadProfile();
  }
  await Promise.all([loadSubjects(), loadExams(), loadDocuments(), loadNews()]);
}

init();
