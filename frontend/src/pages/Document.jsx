import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { resolveApiUrl } from "../services/api.js";
import { demoDocuments } from "../data.js";

function getDocumentFilters() {
  const [, queryString = ""] = window.location.hash.split("?");
  const params = new URLSearchParams(queryString);
  return {
    subjectId: params.get("subject_id") || "",
    subjectName: params.get("subject_name") || "",
    grade: params.get("grade") || ""
  };
}

export default function Document() {
  const { apiFetch } = useAuth();
  const [documents, setDocuments] = useState([]);
  const { subjectId, subjectName, grade } = getDocumentFilters();

  useEffect(() => {
    async function loadDocuments() {
      try {
        const params = new URLSearchParams();
        if (subjectId) params.set("subject_id", subjectId);
        if (grade) params.set("grade", grade);
        const query = params.toString() ? `?${params.toString()}` : "";
        const payload = await apiFetch(`/documents/${query}`);
        setDocuments(Array.isArray(payload) ? payload : payload?.items || []);
      } catch {
        setDocuments(demoDocuments);
      }
    }
    loadDocuments();
  }, [apiFetch, subjectId, grade]);

  return (
    <>
      <SectionTitle>{subjectName ? `📖 Tài liệu - ${subjectName}${grade ? ` - Lớp ${grade}` : ""}` : "📖 Tài liệu"}</SectionTitle>
      <div className="content-box">
        <DataTable
          columns={[
            { label: "ID", key: "document_id" },
            { label: "Title", key: "title" },
            { label: "Grade", key: "grade" },
            { label: "Link", render: (row) => row.link ? <a href={resolveApiUrl(row.link)} target="_blank" rel="noreferrer">Tải xuống</a> : "" }
          ]}
          rows={documents}
          emptyText="Chưa có tài liệu."
        />
      </div>
    </>
  );
}
