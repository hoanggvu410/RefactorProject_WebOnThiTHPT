import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { subjects as fallbackSubjects } from "../data.js";

const subjectVisuals = [
  { match: "anh", icon: "🌍", desc: "Tài liệu luyện thi môn Tiếng Anh" },
  { match: "tiếng anh", icon: "🌍", desc: "Tài liệu luyện thi môn Tiếng Anh" },
  { match: "toán", icon: "🔢", desc: "Tài liệu luyện thi môn Toán" },
  { match: "văn", icon: "📚", desc: "Tài liệu luyện thi môn Ngữ Văn" },
  { match: "lý", icon: "⚛️", desc: "Tài liệu luyện thi môn Vật Lý" },
  { match: "hóa", icon: "🧪", desc: "Tài liệu luyện thi môn Hóa Học" },
  { match: "sinh", icon: "🧬", desc: "Tài liệu luyện thi môn Sinh Học" },
  { match: "sử", icon: "📖", desc: "Tài liệu luyện thi môn Lịch Sử" },
  { match: "địa", icon: "🌏", desc: "Tài liệu luyện thi môn Địa Lý" }
];

function getSubjectVisual(name) {
  const normalizedName = String(name || "").toLowerCase();
  return subjectVisuals.find((visual) => normalizedName.includes(visual.match)) || {
    icon: "📘",
    desc: "Tài liệu ôn thi THPT"
  };
}

function normalizeSubject(subject) {
  const name = subject.subject_name || subject.name || "Môn học";
  const visual = getSubjectVisual(name);
  return {
    id: subject.subject_id,
    name,
    icon: subject.icon || visual.icon,
    desc: subject.desc || visual.desc
  };
}

export default function SubjectGrid({ expandable = false, limit }) {
  const { apiFetch } = useAuth();
  const [subjects, setSubjects] = useState(() => fallbackSubjects.map(normalizeSubject));
  const [expanded, setExpanded] = useState(false);
  const canToggle = Boolean(expandable && limit && subjects.length > limit);
  const visibleSubjects = canToggle && !expanded ? subjects.slice(0, limit) : subjects;

  useEffect(() => {
    async function loadSubjects() {
      try {
        const payload = await apiFetch("/subjects/");
        const items = Array.isArray(payload) ? payload : payload?.items || [];
        if (items.length) {
          setSubjects(items.map(normalizeSubject));
        }
      } catch {
        setSubjects(fallbackSubjects.map(normalizeSubject));
      }
    }

    loadSubjects();
  }, [apiFetch]);

  function handleSubjectClick(subject) {
    if (!subject.id) {
      window.location.hash = "#/documents";
      return;
    }

    const params = new URLSearchParams({
      subject_id: String(subject.id),
      subject_name: subject.name
    });
    window.location.hash = `#/documents?${params.toString()}`;
  }

  return (
    <>
      <section className="grid-cards">
        {visibleSubjects.map((subject) => (
          <article
            className="card-subject"
            key={subject.id || subject.name}
            role="button"
            tabIndex={0}
            onClick={() => handleSubjectClick(subject)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleSubjectClick(subject);
              }
            }}
          >
            <div className="card-image">{subject.icon}</div>
            <div className="card-content">
              <h3>{subject.name}</h3>
              <p>{subject.desc}</p>
            </div>
          </article>
        ))}
      </section>
      {canToggle && (
        <div className="subject-toggle">
          <button className="btn-secondary" type="button" onClick={() => setExpanded((current) => !current)}>
            {expanded ? "Thu gọn" : "Hiển thị thêm"}
          </button>
        </div>
      )}
    </>
  );
}
