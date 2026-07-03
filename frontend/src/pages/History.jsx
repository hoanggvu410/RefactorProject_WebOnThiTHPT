import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function History() {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");
      try {
        const payload = await apiFetch(`/me/history?page=${page}&limit=${PAGE_SIZE}`);
        setItems(payload?.items || []);
        setTotal(payload?.total || 0);
      } catch (loadError) {
        setItems([]);
        setTotal(0);
        setError(loadError.message || "Không tải được lịch sử thi.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [apiFetch, page]);

  const subjectOptions = useMemo(() => (
    Array.from(new Set(items.map((item) => item.subject_name).filter(Boolean))).sort()
  ), [items]);

  const filteredItems = subjectName
    ? items.filter((item) => item.subject_name === subjectName)
    : items;

  const canGoNext = page * PAGE_SIZE < total;

  return (
    <>
      <SectionTitle>Lịch sử thi</SectionTitle>

      <form className="admin-toolbar" onSubmit={(event) => event.preventDefault()}>
        <select
          className="class-selector"
          value={subjectName}
          onChange={(event) => setSubjectName(event.target.value)}
        >
          <option value="">Tất cả môn học</option>
          {subjectOptions.map((subject) => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
        <button className="btn-secondary" type="button" disabled={loading} onClick={() => setPage(1)}>
          Tải lại
        </button>
      </form>

      <div className="content-box">
        {loading ? (
          <div className="empty">Đang tải lịch sử thi...</div>
        ) : error ? (
          <div className="empty">{error}</div>
        ) : (
          <DataTable
            columns={[
              { label: "STT", render: (_, index) => index + 1 },
              { label: "Đề thi", key: "exam_title" },
              { label: "Môn học", key: "subject_name" },
              { label: "Điểm", key: "score" },
              { label: "Đúng/Tổng", render: (row) => `${row.correct_count}/${row.total_question}` },
              { label: "Thời gian", render: (row) => `${row.time_spent} phút` },
              { label: "Ngày nộp", render: (row) => formatDate(row.submitted_at) },
            ]}
            rows={filteredItems}
            emptyText="Chưa có lịch sử thi."
          />
        )}
      </div>

      <div className="admin-toolbar">
        <button
          className="btn-secondary"
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Trang trước
        </button>
        <span className="status-info">Trang {page} • Tổng {total}</span>
        <button
          className="btn-secondary"
          type="button"
          disabled={!canGoNext || loading}
          onClick={() => setPage((current) => current + 1)}
        >
          Trang sau
        </button>
      </div>
    </>
  );
}
