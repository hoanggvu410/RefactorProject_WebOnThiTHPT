import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function formatScore(value) {
  return Number(value || 0).toFixed(1);
}

function formatMinutes(value) {
  return `${Math.round(Number(value || 0))} phút`;
}

export default function Dashboard() {
  const { apiFetch } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const payload = await apiFetch("/v1/me/history?page=1&limit=100");
        setHistory(payload?.items || []);
      } catch (loadError) {
        setError(loadError.message || "Không tải được dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [apiFetch]);

  const stats = useMemo(() => {
    const total = history.length;
    const scores = history.map((item) => Number(item.score || 0));
    const best = total ? Math.max(...scores) : 0;
    const average = total ? scores.reduce((sum, score) => sum + score, 0) / total : 0;
    const averageTime = total
      ? history.reduce((sum, item) => sum + Number(item.time_spent || 0), 0) / total
      : 0;

    const bySubject = Object.values(history.reduce((subjects, item) => {
      const key = item.subject_name || "Khác";
      if (!subjects[key]) {
        subjects[key] = { subject_name: key, total_exams: 0, total_score: 0, best_score: 0 };
      }
      subjects[key].total_exams += 1;
      subjects[key].total_score += Number(item.score || 0);
      subjects[key].best_score = Math.max(subjects[key].best_score, Number(item.score || 0));
      return subjects;
    }, {})).map((subject) => ({
      ...subject,
      avg_score: subject.total_exams ? subject.total_score / subject.total_exams : 0
    }));

    return { total, best, average, averageTime, bySubject };
  }, [history]);

  const recentHistory = history.slice(0, 5);

  return (
    <>
      <SectionTitle>Dashboard</SectionTitle>

      <div className="admin-hero">
        <div className="admin-card"><div className="admin-card-label">Tổng bài thi</div><div className="admin-card-value">{stats.total}</div></div>
        <div className="admin-card"><div className="admin-card-label">Điểm cao nhất</div><div className="admin-card-value">{formatScore(stats.best)}</div></div>
        <div className="admin-card"><div className="admin-card-label">Điểm trung bình</div><div className="admin-card-value">{formatScore(stats.average)}</div></div>
        <div className="admin-card"><div className="admin-card-label">Thời gian TB</div><div className="admin-card-value">{formatMinutes(stats.averageTime)}</div></div>
      </div>

      {loading ? (
        <div className="content-box"><div className="empty">Đang tải dashboard...</div></div>
      ) : error ? (
        <div className="content-box"><div className="empty">{error}</div></div>
      ) : history.length === 0 ? (
        <div className="content-box">
          <div className="empty">
            Bạn chưa có lịch sử thi. <a href="#/exams">Bắt đầu làm đề</a> để tạo thống kê đầu tiên.
          </div>
        </div>
      ) : (
        <>
          <SectionTitle>Hiệu suất theo môn</SectionTitle>
          <div className="content-box">
            <DataTable
              columns={[
                { label: "Môn học", key: "subject_name" },
                { label: "Số bài", key: "total_exams" },
                { label: "Điểm TB", render: (row) => formatScore(row.avg_score) },
                { label: "Điểm cao nhất", render: (row) => formatScore(row.best_score) }
              ]}
              rows={stats.bySubject}
              emptyText="Chưa có dữ liệu theo môn."
            />
          </div>

          <SectionTitle>Bài thi gần đây</SectionTitle>
          <div className="content-box">
            <DataTable
              columns={[
                { label: "Đề thi", key: "exam_title" },
                { label: "Môn học", key: "subject_name" },
                { label: "Điểm", render: (row) => formatScore(row.score) },
                { label: "Đúng/Tổng", render: (row) => `${row.correct_count}/${row.total_question}` },
                { label: "Thời gian", render: (row) => formatMinutes(row.time_spent) }
              ]}
              rows={recentHistory}
              emptyText="Chưa có bài thi gần đây."
            />
          </div>
        </>
      )}
    </>
  );
}
