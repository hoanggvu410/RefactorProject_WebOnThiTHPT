import { useEffect, useState } from "react";
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
  const [subjects, setSubjects] = useState([]);
  const { subjectId, subjectName, grade } = getDocumentFilters();
  const [draftFilters, setDraftFilters] = useState({
    keyword: "",
    subjectId,
    grade
  });
  const [appliedFilters, setAppliedFilters] = useState(draftFilters);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const payload = await apiFetch("/subjects/");
        setSubjects(Array.isArray(payload) ? payload : []);
      } catch {
        setSubjects([]);
      }
    }
    loadSubjects();
  }, [apiFetch]);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const params = new URLSearchParams();
        if (appliedFilters.subjectId) params.set("subject_id", appliedFilters.subjectId);
        if (appliedFilters.grade) params.set("grade", appliedFilters.grade);
        if (appliedFilters.keyword.trim()) params.set("keyword", appliedFilters.keyword.trim());
        const query = params.toString() ? `?${params.toString()}` : "";
        const payload = await apiFetch(`/documents/${query}`);
        setDocuments(Array.isArray(payload) ? payload : payload?.items || []);
      } catch {
        setDocuments(demoDocuments);
      }
    }
    loadDocuments();
  }, [apiFetch, appliedFilters]);

  function handleFilterChange(field, value) {
    setDraftFilters((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    setAppliedFilters(draftFilters);
  }

  function getSubjectLabel(document) {
    const subject = subjects.find((item) => String(item.subject_id) === String(document.subject_id));
    return subject?.subject_name || subjectName || "Tổng hợp";
  }

  return (
    <div className="library-page">
      <header className="library-hero">
        <h1>{subjectName ? `Tài liệu ${subjectName}${grade ? ` lớp ${grade}` : ""}` : "Thư viện tài liệu học tập mới nhất"}</h1>
        <p>Tổng hợp tài liệu học tập, đề cương và kiến thức ôn thi theo môn học và khối lớp.</p>
      </header>

      <form className="catalog-filter" onSubmit={handleFilterSubmit}>
        <label className="catalog-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={draftFilters.keyword}
            placeholder="Nhập tên tài liệu bạn cần tìm?"
            onChange={(event) => handleFilterChange("keyword", event.target.value)}
          />
        </label>
        <select
          value={draftFilters.subjectId}
          onChange={(event) => handleFilterChange("subjectId", event.target.value)}
        >
          <option value="">Tất cả các môn</option>
          {subjects.map((subject) => (
            <option key={subject.subject_id} value={subject.subject_id}>
              {subject.subject_name}
            </option>
          ))}
        </select>
        <select
          value={draftFilters.grade}
          onChange={(event) => handleFilterChange("grade", event.target.value)}
        >
          <option value="">Tất cả các lớp</option>
          <option value="10">Lớp 10</option>
          <option value="11">Lớp 11</option>
          <option value="12">Lớp 12</option>
        </select>
        <button className="btn-primary catalog-filter-submit" type="submit">Tìm ngay</button>
      </form>

      <section className="catalog-section">
        <div className="catalog-section-header">
          <h2>Kho tài liệu</h2>
          <span>{documents.length} tài liệu</span>
        </div>

        {documents.length === 0 ? (
          <div className="empty">Chưa có tài liệu.</div>
        ) : (
          <div className="resource-grid">
            {documents.map((document) => {
              const documentUrl = resolveApiUrl(document.link);
              const description = document.description
                || `${getSubjectLabel(document)} - Lớp ${document.grade || "-"} - Tài liệu ôn tập`;
              return (
                <article className="resource-card document-card" key={document.uuid || document.document_id}>
                  <div className="resource-icon" aria-hidden="true">▤</div>
                  <div className="resource-card-body">
                    <h3>{document.title}</h3>
                    <p>{description}</p>
                  </div>
                  <div className="resource-card-details">
                    <span>Môn: {getSubjectLabel(document)}</span>
                    <span>Lớp: {document.grade || "-"}</span>
                    <span>Định dạng: {document.link ? document.link.split(".").pop()?.toUpperCase() : "-"}</span>
                  </div>
                  <div className="resource-actions">
                    <button className="btn-secondary btn-small" type="button">Preview</button>
                    {document.link ? (
                      <a className="btn-primary btn-small" href={documentUrl} target="_blank" rel="noreferrer">
                        Download
                      </a>
                    ) : (
                      <button className="btn-primary btn-small" type="button" disabled>Download</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
