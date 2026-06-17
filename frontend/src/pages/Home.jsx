import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import PracticeFilter from "../components/PracticeFilter.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import SubjectGrid from "../components/SubjectGrid.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { demoExams, demoNews, demoResults } from "../data.js";

export default function Home() {
  const { apiFetch, isLoggedIn } = useAuth();
  const [news, setNews] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [grade, setGrade] = useState("");

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

  useEffect(() => {
    if (!isLoggedIn) {
      setResults([]);
      return;
    }

    async function loadResults() {
      try {
        const payload = await apiFetch("/v1/me/history?page=1&limit=10");
        setResults(Array.isArray(payload) ? payload : payload?.items || []);
      } catch {
        setResults(demoResults);
      }
    }

    loadResults();
  }, [apiFetch, isLoggedIn]);

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
      <PracticeFilter grade={grade} onGradeChange={setGrade} />
      <SubjectGrid expandable limit={8} grade={grade} />

      {isLoggedIn && (
        <section className="logged-in-only">
          <SectionTitle>📊 Kết quả của bạn</SectionTitle>
          <div className="content-box">
            <DataTable
              columns={[
                { label: "STT", render: (_, index) => index + 1 },
                { label: "Đề thi", render: (row) => row.exam_title || row.exam_id || "-" },
                { label: "Môn", render: (row) => row.subject_name || "-" },
                { label: "Điểm", key: "score" },
                { label: "Thời gian", render: (row) => `${row.time_spent ?? row.timeSpent ?? "-"} phút` }
              ]}
              rows={results}
              emptyText="Chưa có kết quả thi."
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
            { label: "Questions", key: "question_number" }
          ]}
          rows={exams}
          emptyText="Chưa có đề thi."
        />
      </div>
    </>
  );
}
