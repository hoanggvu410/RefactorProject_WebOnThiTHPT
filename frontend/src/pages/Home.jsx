import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import PracticeFilter from "../components/PracticeFilter.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import SubjectGrid from "../components/SubjectGrid.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { demoExams, demoNews, demoResults } from "../data.js";

export default function Home() {
  const { apiFetch, isLoggedIn, tokenPayload } = useAuth();
  const [news, setNews] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("Trạng thái: Sẵn sàng");

  useEffect(() => {
    async function loadHomeData() {
      try {
        const payload = await apiFetch("/news/");
        setNews(Array.isArray(payload) ? payload : []);
      } catch {
        setNews(demoNews);
      }

      try {
        const payload = await apiFetch("/exam/");
        setExams(Array.isArray(payload) ? payload : payload?.items || []);
      } catch {
        setExams(demoExams);
      }
    }

    loadHomeData();
  }, [apiFetch]);

  const resultStats = useMemo(() => {
    const best = results.length ? Math.max(...results.map((item) => Number(item.score || 0))).toFixed(1) : "-";
    return { count: results.length, best };
  }, [results]);

  async function loadResults() {
    const userId = tokenPayload?.user_id;
    if (!userId) {
      setStatus("Trạng thái: Không tìm thấy User ID trong token");
      return;
    }

    try {
      const payload = await apiFetch(`/results/user/${userId}`);
      setResults(Array.isArray(payload) ? payload : [payload]);
      setStatus("Trạng thái: Đã tải kết quả");
    } catch (error) {
      setResults(demoResults);
      setStatus(`Trạng thái: Dùng dữ liệu demo (${error.message})`);
    }
  }

  return (
    <>
      <SectionTitle>📰 Tin tức nổi bật</SectionTitle>
      <div className="content-box">
        <DataTable
          columns={[
            { label: "ID", key: "news_id" },
            { label: "Title", key: "title" },
            { label: "Date", key: "date" }
          ]}
          rows={news}
          emptyText="Chưa có tin tức."
        />
      </div>

      <SectionTitle>📚 Các môn học</SectionTitle>
      <PracticeFilter />
      <SubjectGrid expandable limit={8} />

      {isLoggedIn && (
        <section className="logged-in-only">
          <SectionTitle>📊 Kết quả của bạn</SectionTitle>
          <div className="search-section">
            <div className="search-box">
              <input value={tokenPayload?.user_id || ""} readOnly placeholder="User ID từ token" />
              <button className="btn-primary" type="button" onClick={loadResults}>Xem kết quả</button>
            </div>
            <div className="status-info">
              <span>{status}</span>
              <span>Tổng bài: {resultStats.count}</span>
              <span>Điểm cao nhất: {resultStats.best}</span>
            </div>
          </div>
          <div className="content-box">
            <DataTable
              columns={[
                { label: "Result UUID", key: "result_uuid" },
                { label: "Exam ID", key: "exam_id" },
                { label: "Score", key: "score" },
                { label: "Time", render: (row) => `${row.time_spent ?? row.timeSpent ?? "-"} phút` }
              ]}
              rows={results}
              emptyText="Hãy bấm Xem kết quả để tải dữ liệu."
            />
          </div>
        </section>
      )}

      <SectionTitle>✏️ Đề thi</SectionTitle>
      <div className="content-box">
        <DataTable
          columns={[
            { label: "ID", key: "exam_id" },
            { label: "Title", key: "title" },
            { label: "Q", key: "question_number" }
          ]}
          rows={exams}
          emptyText="Chưa có đề thi."
        />
      </div>
    </>
  );
}
