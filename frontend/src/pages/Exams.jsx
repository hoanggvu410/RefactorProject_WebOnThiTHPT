import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { demoExams } from "../data.js";

function normalizeExamDetail(row, payload) {
  const detail = payload || {};
  return {
    ...row,
    ...detail,
    uuid: row.uuid || detail.exam_uuid || detail.uuid,
    title: detail.title || row.title,
    question_number: detail.questionNumber ?? row.question_number,
    duration: detail.duration ?? row.duration,
    questions: detail.questions || row.questions || []
  };
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Exams() {
  const { apiFetch, isLoggedIn } = useAuth();
  const [exams, setExams] = useState([]);
  const [detailExam, setDetailExam] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  const questions = activeExam?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  useEffect(() => {
    async function loadExams() {
      try {
        const payload = await apiFetch("/exam/");
        setExams(Array.isArray(payload) ? payload : payload?.items || []);
      } catch {
        setExams(demoExams);
      }
    }
    loadExams();
  }, [apiFetch]);

  useEffect(() => {
    if (!activeExam || remainingSeconds <= 0) return undefined;

    const timerId = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [activeExam, remainingSeconds]);

  async function loadExamDetail(row) {
    setDetailExam(normalizeExamDetail(row));
    setDetailError("");

    if (!row.uuid) return normalizeExamDetail(row);

    setDetailLoading(true);
    try {
      const payload = await apiFetch(`/exam/${row.uuid}`);
      const normalized = normalizeExamDetail(row, payload);
      setDetailExam(normalized);
      return normalized;
    } catch (error) {
      setDetailError(error.message || "Không tải được thông tin đề thi.");
      return normalizeExamDetail(row);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleCloseDetail() {
    setDetailExam(null);
    setDetailError("");
  }

  function handleStartPractice() {
    if (!detailExam) return;

    setActiveExam(detailExam);
    setDetailExam(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setMarkedQuestions({});
    setRemainingSeconds((Number(detailExam.duration) || 0) * 60);
    setSubmitLoading(false);
    setSubmitError("");
    setSubmitResult(null);
    setResultModalOpen(false);
  }

  function handleSelectAnswer(optionId) {
    setAnswers((current) => ({
      ...current,
      [currentQuestionIndex]: optionId
    }));
  }

  function handleToggleMark(index) {
    setMarkedQuestions((current) => ({
      ...current,
      [index]: !current[index]
    }));
  }

  function handleExitPractice() {
    setActiveExam(null);
    setAnswers({});
    setMarkedQuestions({});
    setCurrentQuestionIndex(0);
    setRemainingSeconds(0);
    setSubmitLoading(false);
    setSubmitError("");
    setSubmitResult(null);
    setResultModalOpen(false);
  }

  async function handleSubmitExam() {
    if (!activeExam || submitLoading || submitResult) return;

    const unansweredCount = Math.max(0, questions.length - answeredCount);
    if (unansweredCount > 0) {
      const confirmed = window.confirm(`Bạn còn ${unansweredCount} câu chưa trả lời. Bạn vẫn muốn nộp bài?`);
      if (!confirmed) return;
    }

    const submittedAnswers = [];
    for (const [indexText, selectedOptionID] of Object.entries(answers)) {
      if (!selectedOptionID) continue;

      const question = questions[Number(indexText)];
      const questionID = question?.questionID ?? question?.question_id;
      if (!questionID) {
        setSubmitError("Đề thi thiếu questionID, không thể nộp bài. Vui lòng tải lại đề.");
        return;
      }

      submittedAnswers.push({
        questionID,
        selectedOptionID
      });
    }

    const durationSeconds = (Number(activeExam.duration) || 0) * 60;
    const elapsedSeconds = durationSeconds > 0
      ? Math.max(0, durationSeconds - remainingSeconds)
      : 0;
    const timeSpent = Math.ceil(elapsedSeconds / 60);

    setSubmitLoading(true);
    setSubmitError("");

    try {
      const result = await apiFetch("/results/submit-exam", {
        method: "POST",
        body: JSON.stringify({
          exam_uuid: activeExam.exam_uuid || activeExam.uuid,
          answers: submittedAnswers,
          time_spent: timeSpent
        })
      });
      setSubmitResult(result);
      setResultModalOpen(true);
      setRemainingSeconds(0);
    } catch (error) {
      setSubmitError(error.message || "Không thể nộp bài.");
    } finally {
      setSubmitLoading(false);
    }
  }

  if (activeExam) {
    return (
      <>
        <SectionTitle>✏️ Làm bài thi</SectionTitle>
        <div className="exam-workspace">
          <section className="content-box exam-main-panel">
            <div className="exam-workspace-header">
              <div>
                <h3>{activeExam.title}</h3>
                <div className="review-meta">
                  <span className="tag">Câu {currentQuestionIndex + 1}/{questions.length}</span>
                  <span className="tag">Đã làm {answeredCount}/{questions.length}</span>
                </div>
              </div>
              <div className={`exam-timer ${remainingSeconds <= 300 ? "danger" : ""}`}>
                {formatTime(remainingSeconds)}
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="empty">Đề thi này chưa có câu hỏi.</div>
            ) : (
              <>
                <div className="question-card">
                  <div className="question-card-header">
                    <strong>Câu {currentQuestionIndex + 1}</strong>
                    <button
                      className={`btn-secondary btn-small ${markedQuestions[currentQuestionIndex] ? "marked" : ""}`}
                      type="button"
                      onClick={() => handleToggleMark(currentQuestionIndex)}
                    >
                      {markedQuestions[currentQuestionIndex] ? "Bỏ đánh dấu" : "Đánh dấu"}
                    </button>
                  </div>
                  <p>{currentQuestion.content}</p>
                  <div className="option-list">
                    {(currentQuestion.questionOptions || []).map((option) => (
                      <label className="option-row" key={option.questionoptionID || option.content}>
                        <input
                          checked={answers[currentQuestionIndex] === option.questionoptionID}
                          name={`question-${currentQuestionIndex}`}
                          type="radio"
                          onChange={() => handleSelectAnswer(option.questionoptionID)}
                        />
                        <span>{option.content}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="exam-actions">
                  <button
                    className="btn-secondary"
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                  >
                    Câu trước
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    disabled={currentQuestionIndex >= questions.length - 1}
                    onClick={() => setCurrentQuestionIndex((index) => Math.min(questions.length - 1, index + 1))}
                  >
                    Câu sau
                  </button>
                  <button
                    className="btn-primary"
                    type="button"
                    disabled={submitLoading || Boolean(submitResult)}
                    onClick={handleSubmitExam}
                  >
                    {submitLoading ? "Đang nộp..." : submitResult ? "Đã nộp bài" : "Nộp bài"}
                  </button>
                  <button className="btn-secondary" type="button" onClick={handleExitPractice}>
                    Thoát
                  </button>
                </div>
                {submitError && <div className="form-error">{submitError}</div>}
              </>
            )}
          </section>

          <aside className="content-box question-navigator">
            <h3>Danh sách câu hỏi</h3>
            <div className="navigator-legend">
              <span><i className="legend-dot answered" /> Đã làm</span>
              <span><i className="legend-dot unanswered" /> Chưa làm</span>
              <span><i className="legend-dot marked" /> Xem lại</span>
            </div>
            <div className="question-grid">
              {questions.map((question, index) => {
                const answered = Boolean(answers[index]);s
                const marked = Boolean(markedQuestions[index]);
                return (
                  <button
                    key={question.question_uuid || question.uuid || index}
                    className={[
                      "question-chip",
                      currentQuestionIndex === index ? "active" : "",
                      answered ? "answered" : "unanswered",
                      marked ? "marked" : ""
                    ].filter(Boolean).join(" ")}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
        {submitResult && resultModalOpen && (
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-content exam-modal">
              <div className="modal-header">
                <h2>Kết quả bài thi</h2>
              </div>
              <div className="modal-body">
                <div className="exam-info-grid">
                  <div>
                    <span>Điểm</span>
                    <strong>{submitResult.score ?? 0}</strong>
                  </div>
                  <div>
                    <span>Số câu đúng</span>
                    <strong>{submitResult.correct_count ?? 0}/{submitResult.total_question ?? questions.length}</strong>
                  </div>
                  <div>
                    <span>Thời gian</span>
                    <strong>{submitResult.time_spent ?? 0} phút</strong>
                  </div>
                </div>
                {submitResult.result_uuid && (
                  <p className="status-info">Result UUID: {submitResult.result_uuid}</p>
                )}
                <div className="modal-actions">
                  <button className="btn-secondary" type="button" onClick={() => setResultModalOpen(false)}>
                    Ở lại xem bài
                  </button>
                  <button className="btn-primary" type="button" onClick={handleExitPractice}>
                    Thoát đề thi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <SectionTitle>✏️ Đề thi</SectionTitle>
      <div className="content-box">
        <DataTable
          columns={[
            { label: "ID", key: "exam_id" },
            { label: "Title", key: "title" },
            { label: "Questions", key: "question_number" },
            { label: "Duration", render: (row) => `${row.duration || 0} phút` },
            {
              label: "Action",
              render: (row) => (
                <button
                  className="btn-secondary btn-small"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    loadExamDetail(row);
                  }}
                >
                  Chi tiết
                </button>
              )
            }
          ]}
          rows={exams}
          emptyText="Chưa có đề thi."
          onRowClick={loadExamDetail}
        />
      </div>

      {detailExam && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content exam-modal">
            <div className="modal-header">
              <h2>{detailExam.title}</h2>
              <button className="close-btn" type="button" onClick={handleCloseDetail}>×</button>
            </div>
            <div className="modal-body">
              <div className="exam-info-grid">
                <div>
                  <span>Số câu</span>
                  <strong>{detailExam.question_number || 0}</strong>
                </div>
                <div>
                  <span>Thời gian</span>
                  <strong>{detailExam.duration || 0} phút</strong>
                </div>
                <div>
                  <span>Lớp</span>
                  <strong>{detailExam.grade || "-"}</strong>
                </div>
              </div>

              {detailLoading && <div className="empty">Đang tải thông tin đề thi...</div>}
              {detailError && <div className="empty">{detailError}</div>}

              <div className="modal-actions">
                <button className="btn-primary" type="button" disabled={!isLoggedIn} onClick={handleStartPractice}>
                  Làm bài
                </button>
                <button className="btn-secondary" type="button" onClick={handleCloseDetail}>
                  Đóng
                </button>
              </div>
              {!isLoggedIn && <div className="empty">Bạn cần đăng nhập để làm bài.</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
