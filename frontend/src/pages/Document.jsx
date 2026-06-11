import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { demoDocuments } from "../data.js";

export default function Document() {
  const { apiFetch } = useAuth();
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const payload = await apiFetch("/documents/");
        setDocuments(Array.isArray(payload) ? payload : payload?.items || []);
      } catch {
        setDocuments(demoDocuments);
      }
    }
    loadDocuments();
  }, [apiFetch]);

  return (
    <>
      <SectionTitle>📖 Tài liệu</SectionTitle>
      <div className="content-box">
        <DataTable
          columns={[
            { label: "ID", key: "document_id" },
            { label: "Title", key: "title" },
            { label: "Grade", key: "grade" },
            { label: "Link", render: (row) => row.link ? <a href={row.link} target="_blank" rel="noreferrer">Tải xuống</a> : "" }
          ]}
          rows={documents}
          emptyText="Chưa có tài liệu."
        />
      </div>
    </>
  );
}
