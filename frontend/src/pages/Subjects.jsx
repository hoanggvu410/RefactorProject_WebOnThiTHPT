import { useState } from "react";
import PracticeFilter from "../components/PracticeFilter.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import SubjectGrid from "../components/SubjectGrid.jsx";

export default function Subjects() {
  const [grade, setGrade] = useState("");

  return (
    <>
      <SectionTitle>📚 Môn học</SectionTitle>
      <PracticeFilter grade={grade} onGradeChange={setGrade} />
      <SubjectGrid grade={grade} />
    </>
  );
}
