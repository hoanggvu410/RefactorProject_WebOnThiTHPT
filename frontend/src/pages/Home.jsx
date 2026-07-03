import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import SubjectGrid from "../components/SubjectGrid.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { demoExams, demoNews } from "../data.js";

export default function Home() {
  const { apiFetch } = useAuth();
  const [news, setNews] = useState([]);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const payload = await apiFetch("/news/");
        setNews(Array.isArray(payload) ? payload : payload?.items || []);
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
      <SubjectGrid expandable limit={8} />

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
