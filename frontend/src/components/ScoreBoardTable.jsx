import { useEffect, useState } from "react";
import DataTable from "./DataTable.jsx";
import { demoResults } from "../data.js";

function formatScore(value) {
  return Number(value || 0).toFixed(2);
}

function formatMinutes(value) {
  return `${Math.round(Number(value || 0))} phút`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function normalizeScoreBoardItems(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.items || [];
}

export default function ScoreBoardTable({ apiFetch, limit = 10, fallback = false }) {
  const [scoreboard, setScoreboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadScoreBoard() {
      setLoading(true);
      setError("");

      try {
        const payload = await apiFetch(`/v1/me/scoreboard?page=1&limit=${limit}`);
        setScoreboard(normalizeScoreBoardItems(payload));
      } catch (loadError) {
        if (fallback) {
          setScoreboard(demoResults);
        } else {
          setError(loadError.message || "Không tải được bảng xếp hạng.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadScoreBoard();
  }, [apiFetch, fallback, limit]);

  if (loading) {
    return <div className="empty">Đang tải bảng xếp hạng...</div>;
  }

  if (error) {
    return <div className="empty">{error}</div>;
  }

  return (
    <DataTable
      columns={[
        { label: "Hạng", render: (row, index) => row.rank || index + 1 },
        { label: "Đề thi", render: (row) => row.exam_title || row.exam_id || "-" },
        { label: "Môn", render: (row) => row.subject_name || "-" },
        { label: "Điểm", render: (row) => formatScore(row.score) },
        { label: "Số câu", render: (row) => row.total_question ?? "-" },
        { label: "Thời gian", render: (row) => formatMinutes(row.time_spent ?? row.timeSpent) },
        { label: "Ngày nộp", render: (row) => formatDate(row.submitted_at) }
      ]}
      rows={scoreboard}
      emptyText="Chưa có kết quả thi."
    />
  );
}
