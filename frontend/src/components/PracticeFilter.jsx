export default function PracticeFilter({ grade = "", onGradeChange }) {
  function handleGradeChange(event) {
    onGradeChange?.(event.target.value);
  }

  return (
    <div className="subjects-filter">
      <select
        className="class-selector"
        value={grade}
        onChange={handleGradeChange}
      >
        <option value="">Tất cả lớp</option>
        <option value="10">Lớp 10</option>
        <option value="11">Lớp 11</option>
        <option value="12">Lớp 12</option>
      </select>
      {grade && <span style={{ color: "#666" }}>Đang lọc tài liệu lớp {grade}</span>}
    </div>
  );
}
