import { useState } from "react";

export default function PracticeFilter() {
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("");

  function handlePractice() {
    if (!grade) {
      window.alert("Vui lòng chọn lớp trước");
      return;
    }
    setStatus(`✓ Đã chọn luyện tập lớp ${grade}`);
  }

  return (
    <div className="subjects-filter">
      <select
        className="class-selector"
        value={grade}
        onChange={(event) => {
          setGrade(event.target.value);
          setStatus("");
        }}
      >
        <option value="">-- Chọn lớp --</option>
        <option value="10">Lớp 10</option>
        <option value="11">Lớp 11</option>
        <option value="12">Lớp 12</option>
      </select>
      <button className="btn-primary" type="button" onClick={handlePractice}>Luyện tập hôm nay</button>
      {status && <span style={{ color: "#666" }}>{status}</span>}
    </div>
  );
}
