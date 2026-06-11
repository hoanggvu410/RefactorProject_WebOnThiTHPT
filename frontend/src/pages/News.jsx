import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { demoNews } from "../data.js";

export default function News() {
  const { apiFetch } = useAuth();
  const [news, setNews] = useState([]);

  useEffect(() => {
    async function loadNews() {
      try {
        const payload = await apiFetch("/news/");
        setNews(Array.isArray(payload) ? payload : payload?.items || []);
      } catch {
        setNews(demoNews);
      }
    }
    loadNews();
  }, [apiFetch]);

  return (
    <>
      <SectionTitle>📰 Tin tức</SectionTitle>
      <div className="content-box">
        <DataTable
          columns={[
            { label: "ID", key: "news_id" },
            { label: "Title", key: "title" },
            { label: "Content", key: "content" },
            { label: "Date", key: "date" }
          ]}
          rows={news}
          emptyText="Chưa có tin tức."
        />
      </div>
    </>
  );
}
