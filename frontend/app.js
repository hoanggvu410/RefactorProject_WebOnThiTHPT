const state = {
  token: localStorage.getItem("access_token") || "",
};

const demoResults = [
  { resultID: 101, examID: 12, score: 8.5, timeSpent: 42 },
  { resultID: 102, examID: 15, score: 9.0, timeSpent: 38 },
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

const subjects = [
  { name: "Tiếng Anh", icon: "🌍", desc: "Luyện thi THPT môn Tiếng Anh" },
  { name: "Toán", icon: "🔢", desc: "Luyện thi THPT môn Toán" },
  { name: "Vật Lý", icon: "⚛️", desc: "Luyện thi THPT môn Vật Lý" },
  { name: "Hóa Học", icon: "🧪", desc: "Luyện thi THPT môn Hóa Học" },
  { name: "Sinh Học", icon: "🧬", desc: "Luyện thi THPT môn Sinh Học" },
  { name: "Lịch Sử", icon: "📖", desc: "Luyện thi THPT môn Lịch Sử" },
  { name: "Địa Lý", icon: "🌏", desc: "Luyện thi THPT môn Địa Lý" },
  { name: "Ngữ Văn", icon: "📚", desc: "Luyện thi THPT môn Ngữ Văn" },
];

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) throw new Error(typeof payload === "object" ? payload?.error?.message || payload?.message || "Request failed" : payload);
  return payload;
}

function saveToken(token) {
  state.token = token || ""; 

  if (state.token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token"); 
  }
  updateUI();
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function updateUI() {
  const payload = parseJwt(state.token);

  if (state.token && payload) {
    const displayName = payload.name || payload.sub || "Người dùng";
    const displayRole = payload.role || "student";
    
    $("userInfo").textContent = `${displayName} (${displayRole})`;
    
    // Xử lý các nút khi ĐÃ ĐĂNG NHẬP
    $("btnLoginModal").style.display = "none";
    $("btnLogoutNavbar").style.display = "block"; 
    $("btnLogout").style.display = "block";      
  } else {
    state.token = "";
    localStorage.removeItem("access_token");
    
    $("userInfo").textContent = "Chưa đăng nhập";
    
    // Xử lý các nút khi CHƯA ĐĂNG NHẬP
    $("btnLoginModal").style.display = "block";
    $("btnLogoutNavbar").style.display = "none";  
    $("btnLogout").style.display = "none";       
  }
}

function openModal() {
  $("loginModal").classList.remove("hidden");
}

function closeModal() {
  $("loginModal").classList.add("hidden");
}

function renderSubjectsGrid() {
  const grid = $("subjectsGrid");
  grid.innerHTML = subjects.map(subject => `
    <div class="card-subject">
      <div class="card-image">${subject.icon}</div>
      <div class="card-content">
        <h3>${escapeHtml(subject.name)}</h3>
        <p>${escapeHtml(subject.desc)}</p>
      </div>
    </div>
  `).join("");
}

function renderTable(containerId, columns, rows, emptyText) {
  const container = $(containerId);
  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="empty">${escapeHtml(emptyText)}</div>`;
    return;
  }

  const head = columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join("");
  const body = rows.map(row => {
    const cells = columns.map(col => {
      const value = typeof col.render === "function" ? col.render(row) : row[col.key];
      return `<td>${value ?? ""}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  container.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderReview(review) {
  const box = $("reviewBox");
  if (!review || !review.questions || review.questions.length === 0) {
    box.innerHTML = `<div class="empty">Không có dữ liệu review.</div>`;
    return;
  }

  box.innerHTML = `
    <div style="padding: 20px;">
      <div class="review-item">
        <div class="review-meta">
          <span class="tag">${escapeHtml(review.title || "Đề thi")}</span>
          <span class="tag">${escapeHtml(review.score ?? "-")} điểm</span>
          <span class="tag">${escapeHtml(review.timeSpent ?? "-")} phút</span>
        </div>
      </div>
      ${review.questions.map((q, idx) => `
        <div class="review-item">
          <h3>Câu ${idx + 1}. ${escapeHtml(q.content)}</h3>
          <div class="review-meta">
            <span class="tag">${q.is_correct ? "✓ Đúng" : "✗ Sai"}</span>
            <span class="tag">Selected #${escapeHtml(q.selectedOptionID)}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

async function login() {
  const username = $("username").value.trim();
  const password = $("password").value;
  if (!username || !password) {
    alert("Vui lòng nhập username và password");
    return;
  }

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    
    // 1. Lưu token vào máy
    saveToken(data.access_token);
    
    // 2. Đóng cửa sổ đăng nhập
    closeModal();
    
    // 3. Bật pop-up thông báo thành công trong 3 giây
    showToast("Đăng nhập thành công! Chúc bạn luyện đề vui vẻ.");
  } catch (error) {
    alert(`Lỗi đăng nhập: ${error.message}`);
  }
}

function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    saveToken("");
    closeModal();
  }
}
function showToast(message) {
  const toast = $("toastNotification");
  $("toastMessage").textContent = message;
  
  toast.classList.remove("hidden");
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 300);
  }, 3000);
}

async function loadResults() {
  const userId = $("userId").value.trim();
  if (!userId) {
    alert("Vui lòng nhập User ID");
    return;
  }
  try {
    const results = await apiFetch(`/results/user/${userId}`);
    const items = Array.isArray(results) ? results : [results];
    $("resultCount").textContent = `Tổng bài: ${items.length}`;
    $("bestScore").textContent = `Điểm cao nhất: ${items.length ? Math.max(...items.map((i) => Number(i.score || 0))).toFixed(1) : "-"}`;
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
    $("resultStatus").textContent = "Trạng thái: Đã tải kết quả";
  } catch (error) {
    $("resultCount").textContent = `Tổng bài: ${demoResults.length}`;
    $("bestScore").textContent = `Điểm cao nhất: ${Math.max(...demoResults.map((i) => i.score)).toFixed(1)}`;
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
    $("resultStatus").textContent = `Trạng thái: Dùng dữ liệu demo (${error.message})`;
  }
}

async function loadReview() {
  const resultId = $("resultId").value.trim();
  if (!resultId) {
    alert("Vui lòng nhập Result ID");
    return;
  }
  try {
    const review = await apiFetch(`/results/review/${resultId}`);
    renderReview(review);
  } catch (error) {
    renderReview(demoReview);
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
      ],
      [
        { examID: 12, title: "Đề Toán", questionNumber: 50 },
        { examID: 15, title: "Đề Văn", questionNumber: 40 },
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

const routes = {
  "#/": "page-home",
  "#/news": "page-news",
  "#/subjects": "page-subjects",
  "#/exams": "page-exams",
  "#/documents": "page-documents",
  "#/results": "page-results"
};

function navigate() {
  const hash = window.location.hash || "#/";
  const activePageId = routes[hash] || "page-home";

  // Đã bỏ "page-results" ra khỏi danh sách quản lý trang của SPA
  const pages = ["page-home", "page-news", "page-subjects", "page-exams", "page-documents"];
  pages.forEach(pageId => {
    const el = $(pageId);
    if (el) {
      if (pageId === activePageId) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    }
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    const href = link.getAttribute("href");
    if (href === hash) {
      link.style.color = "var(--primary)";
      link.style.fontWeight = "700";
    } else {
      link.style.color = "";
      link.style.fontWeight = "";
    }
  });

  if (activePageId === "page-news") {
    loadNewsFull();
  } else if (activePageId === "page-subjects") {
    renderSubjectsGridFull();
  } else if (activePageId === "page-exams") {
    loadExamsFull();
  } else if (activePageId === "page-documents") {
    loadDocumentsFull();
  }
}

async function loadNewsFull() {
  try {
    const news = await apiFetch("/news/");
    renderTable(
      "newsFullList",
      [
        { label: "ID", key: "newsID" },
        { label: "Title", key: "title" },
        { label: "Content", key: "content" },
        { label: "Date", key: "date" },
      ],
      Array.isArray(news) ? news : [],
      "Chưa có tin tức."
    );
  } catch {
    renderTable(
      "newsFullList",
      [
        { label: "ID", key: "newsID" },
        { label: "Title", key: "title" },
        { label: "Content", key: "content" },
        { label: "Date", key: "date" },
      ],
      [
        { newsID: 1, title: "Lịch thi THPT cập nhật", content: "Lịch thi chính thức...", date: "2026-06-01" },
        { newsID: 2, title: "Mẹo ôn thi hiệu quả", content: "Hãy học tập chăm chỉ...", date: "2026-06-01" },
      ],
      "Demo"
    );
  }
}

function renderSubjectsGridFull() {
  const grid = $("subjectsGridFull");
  grid.innerHTML = subjects.map(subject => `
    <div class="card-subject">
      <div class="card-image">${subject.icon}</div>
      <div class="card-content">
        <h3>${escapeHtml(subject.name)}</h3>
        <p>${escapeHtml(subject.desc)}</p>
      </div>
    </div>
  `).join("");
}

async function loadExamsFull() {
  try {
    const exams = await apiFetch("/exam/");
    const items = Array.isArray(exams) ? exams : (exams?.items || []);
    renderTable(
      "examsFullList",
      [
        { label: "ID", key: "exam_id" },
        { label: "Title", key: "title" },
        { label: "Q", key: "question_number" },
        { label: "Duration", key: "duration" },
      ],
      items,
      "Chưa có đề thi."
    );
  } catch {
    renderTable(
      "examsFullList",
      [
        { label: "ID", key: "examID" },
        { label: "Title", key: "title" },
        { label: "Q", key: "questionNumber" },
        { label: "Duration", key: "duration" },
      ],
      [
        { examID: 12, title: "Đề Toán", questionNumber: 50, duration: 90 },
        { examID: 15, title: "Đề Văn", questionNumber: 40, duration: 120 },
      ],
      "Demo"
    );
  }
}

async function loadDocumentsFull() {
  try {
    const docs = await apiFetch("/documents/");
    renderTable(
      "documentsFullList",
      [
        { label: "ID", key: "document_id" },
        { label: "Title", key: "title" },
        { label: "Grade", key: "grade" },
        { label: "Link", render: (row) => row.link ? `<a href="${row.link}" target="_blank">Tải xuống</a>` : "" }
      ],
      Array.isArray(docs) ? docs : [],
      "Chưa có tài liệu."
    );
  } catch {
    renderTable(
      "documentsFullList",
      [
        { label: "ID", key: "documentID" },
        { label: "Title", key: "title" },
        { label: "Grade", key: "grade" },
        { label: "Link", render: (row) => `<a href="${row.link || '#'}" target="_blank">Tải xuống</a>` },
      ],
      [
        { documentID: 1, title: "Công thức Toán", grade: 12, link: "#" },
        { documentID: 2, title: "Ngữ văn trọng tâm", grade: 12, link: "#" },
      ],
      "Demo"
    );
  }
}

async function loadResultsPage() {
  const userId = $("userIdResults").value.trim();
  if (!userId) {
    $("resultsListPage").innerHTML = `<div class="empty">Hãy nhập User ID để xem kết quả.</div>`;
    $("reviewBoxPage").innerHTML = `<div class="empty">Chọn Result ID để xem chi tiết bài thi.</div>`;
    return;
  }
  try {
    const results = await apiFetch(`/results/user/${userId}`);
    const items = Array.isArray(results) ? results : [results];
    $("resultCountPage").textContent = `Tổng bài: ${items.length}`;
    $("bestScorePage").textContent = `Điểm cao nhất: ${items.length ? Math.max(...items.map((i) => Number(i.score || 0))).toFixed(1) : "-"}`;
    renderTable(
      "resultsListPage",
      [
        { label: "Result ID", key: "result_id" },
        { label: "Exam ID", key: "exam_id" },
        { label: "Score", render: (row) => row.score },
        { label: "Time", render: (row) => `${row.time_spent} phút` },
      ],
      items,
      "Chưa có kết quả."
    );
    $("resultStatusPage").textContent = "Trạng thái: Đã tải kết quả";
  } catch (error) {
    $("resultCountPage").textContent = `Tổng bài: ${demoResults.length}`;
    $("bestScorePage").textContent = `Điểm cao nhất: ${Math.max(...demoResults.map((i) => i.score)).toFixed(1)}`;
    renderTable(
      "resultsListPage",
      [
        { label: "Result ID", key: "resultID" },
        { label: "Exam ID", key: "examID" },
        { label: "Score", render: (row) => row.score },
        { label: "Time", render: (row) => `${row.timeSpent} phút` },
      ],
      demoResults,
      "Demo"
    );
    $("resultStatusPage").textContent = `Trạng thái: Dùng dữ liệu demo (${error.message})`;
  }
}

async function loadReviewPage() {
  const resultId = $("resultIdPage").value.trim();
  if (!resultId) {
    alert("Vui lòng nhập Result ID");
    return;
  }
  try {
    const review = await apiFetch(`/results/review/${resultId}`);
    renderReviewToContainer("reviewBoxPage", review);
  } catch (error) {
    renderReviewToContainer("reviewBoxPage", demoReview);
  }
}

function renderReviewToContainer(containerId, review) {
  const box = $(containerId);
  if (!review || !review.questions || review.questions.length === 0) {
    box.innerHTML = `<div class="empty">Không có dữ liệu review.</div>`;
    return;
  }

  box.innerHTML = `
    <div style="padding: 20px;">
      <div class="review-item">
        <div class="review-meta">
          <span class="tag">${escapeHtml(review.title || "Đề thi")}</span>
          <span class="tag">${escapeHtml(review.score ?? "-")} điểm</span>
          <span class="tag">${escapeHtml(review.timeSpent ?? review.time_spent ?? "-")} phút</span>
        </div>
      </div>
      ${review.questions.map((q, idx) => `
        <div class="review-item">
          <h3>Câu ${idx + 1}. ${escapeHtml(q.content)}</h3>
          <div class="review-meta">
            <span class="tag">${q.is_correct ? "✓ Đúng" : "✗ Sai"}</span>
            <span class="tag">Selected #${escapeHtml(q.selectedOptionID)}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function bindEvents() {
  $("btnLoginModal").addEventListener("click", openModal);
  $("closeModal").addEventListener("click", closeModal);
  $("btnLogin").addEventListener("click", login);
  $("btnLogout").addEventListener("click", logout);
  $("btnLogoutNavbar").addEventListener("click", logout);
  $("btnLoadResults").addEventListener("click", loadResults);
  $("btnLoadResultsPage").addEventListener("click", loadResultsPage);
  $("btnReviewResult").addEventListener("click", loadReview);
  $("btnReviewResultPage").addEventListener("click", loadReviewPage);
  $("btnPracticeToday").addEventListener("click", () => {
    const selectedClass = $("classSelector").value;
    if (!selectedClass) {
      alert("Vui lòng chọn lớp trước");
      return;
    }
    $("practiceStatus").textContent = `✓ Đã chọn luyện tập lớp ${selectedClass}`;
    $("practiceStatus").style.display = "block";
  });
  $("btnPracticeTodaySubjects").addEventListener("click", () => {
    const selectedClass = $("classSelectorSubjects").value;
    if (!selectedClass) {
      alert("Vui lòng chọn lớp trước");
      return;
    }
    $("practiceStatusSubjects").textContent = `✓ Đã chọn luyện tập lớp ${selectedClass}`;
    $("practiceStatusSubjects").style.display = "block";
  });

  $("classSelector").addEventListener("change", () => {
    $("practiceStatus").style.display = "none";
  });
  $("classSelectorSubjects").addEventListener("change", () => {
    $("practiceStatusSubjects").style.display = "none";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  window.addEventListener("hashchange", navigate);
}

async function init() {
  bindEvents();
  saveToken(state.token);
  renderSubjectsGrid();
  $("resultsList").innerHTML = `<div class="empty">Hãy nhập User ID để xem kết quả.</div>`;
  $("reviewBox").innerHTML = `<div class="empty">Chọn Result ID để xem chi tiết bài thi.</div>`;
  navigate();
  await Promise.all([loadExams(), loadDocuments(), loadNews()]);
}

init();
