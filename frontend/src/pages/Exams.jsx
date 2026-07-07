import { useEffect, useMemo, useRef, useState } from "react";
import SectionTitle from "../components/SectionTitle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { demoExams } from "../data.js";

const ACTIVE_ATTEMPT_EXAM_KEY = "active_exam_attempt_exam_uuid";
const EXAM_ATTEMPT_API_PREFIX = "/exam-attempt";

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

function getQuestionId(question) {
  return question?.questionID ?? question?.question_id ?? question?.question_uuid ?? question?.uuid;
}

function getQuestionKey(question) {
  const questionId = getQuestionId(question);
  return questionId == null ? "" : String(questionId);
}

function getExamUuid(exam) {
  return exam?.exam_uuid || exam?.uuid || exam?.exam_id || "";
}

function getOptionId(option) {
  return option?.questionoptionID ?? option?.question_option_id ?? option?.id;
}

function getSelectedOptionId(question) {
  return question?.selectedOptionID ?? question?.selected_option_id ?? null;
}

function getCorrectOptionId(question) {
  const correctOption = (question?.questionOptions || []).find((option) => option.is_correct || option.isCorrect);
  return question?.correctOptionID
    ?? question?.correct_option_id
    ?? question?.correctOptionId
    ?? getOptionId(correctOption)
    ?? null;
}

function getQuestionCorrectState(question) {
  return question?.is_correct ?? question?.isCorrect ?? null;
}

function parseDeadlineMs(deadlineAt) {
  if (!deadlineAt) return NaN;
  if (typeof deadlineAt === "number") return deadlineAt;

  const deadlineText = String(deadlineAt);
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(deadlineText);
  const normalizedDeadline = hasTimezone ? deadlineText : `${deadlineText}Z`;
  return new Date(normalizedDeadline).getTime();
}

function calculateRemainingSeconds(deadlineAt) {
  if (!deadlineAt) return 0;
  const deadlineMs = parseDeadlineMs(deadlineAt);
  if (!Number.isFinite(deadlineMs)) return 0;
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

export default function Exams() {
  const { apiFetch, isLoggedIn } = useAuth();
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [draftFilters, setDraftFilters] = useState({
    keyword: "",
    subjectId: "",
    grade: ""
  });
  const [appliedFilters, setAppliedFilters] = useState(draftFilters);
  const [detailExam, setDetailExam] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [draftMeta, setDraftMeta] = useState(null);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [openExplanations, setOpenExplanations] = useState({});
  const timerReadyRef = useRef(false);

  const questions = activeExam?.questions || [];
  const isReviewMode = Boolean(reviewData);
  const displayQuestions = useMemo(() => {
    if (!reviewData) return questions;

    const reviewQuestions = reviewData.questions || [];
    const reviewByQuestionId = new Map(
      reviewQuestions.map((question) => [String(getQuestionId(question)), question])
    );
    const mergedQuestions = questions.map((question) => {
      const reviewQuestion = reviewByQuestionId.get(String(getQuestionId(question)));
      if (!reviewQuestion) return question;

      return {
        ...question,
        ...reviewQuestion,
        questionOptions: reviewQuestion.questionOptions || question.questionOptions || []
      };
    });
    const knownQuestionIds = new Set(mergedQuestions.map((question) => String(getQuestionId(question))));
    const extraReviewQuestions = reviewQuestions.filter((question) => !knownQuestionIds.has(String(getQuestionId(question))));

    return [...mergedQuestions, ...extraReviewQuestions];
  }, [questions, reviewData]);
  const currentQuestion = displayQuestions[currentQuestionIndex];

  const answeredCount = useMemo(() => (
    questions.filter((question) => Boolean(answers[getQuestionKey(question)])).length
  ), [answers, questions]);

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
    async function loadExams() {
      try {
        const params = new URLSearchParams();
        if (appliedFilters.subjectId) params.set("subject_id", appliedFilters.subjectId);
        if (appliedFilters.grade) params.set("grade", appliedFilters.grade);
        if (appliedFilters.keyword.trim()) params.set("keyword", appliedFilters.keyword.trim());
        const query = params.toString() ? `?${params.toString()}` : "";
        const payload = await apiFetch(`/exam/${query}`);
        setExams(Array.isArray(payload) ? payload : payload?.items || []);
      } catch {
        setExams(demoExams);
      }
    }
    loadExams();
  }, [apiFetch, appliedFilters]);

  useEffect(() => {
    async function restoreActiveAttempt() {
      if (!isLoggedIn) return;

      const examUuid = window.localStorage.getItem(ACTIVE_ATTEMPT_EXAM_KEY);
      if (!examUuid) return;

      try {
        const attempt = await apiFetch(`${EXAM_ATTEMPT_API_PREFIX}/current?exam_uuid=${encodeURIComponent(examUuid)}`);
        if (attempt?.status === "in_progress") {
          restoreAttempt(attempt);
          return;
        }
        window.localStorage.removeItem(ACTIVE_ATTEMPT_EXAM_KEY);
      } catch {
        // Keep normal exam listing available if restoring the attempt fails.
      }
    }

    restoreActiveAttempt();
  }, [apiFetch, isLoggedIn]);

  useEffect(() => {
    if (!activeExam || isReviewMode || submitResult || !draftMeta) return undefined;

    async function saveAttempt() {
      if (!draftMeta.attemptUuid) return;

      try {
        await apiFetch(`${EXAM_ATTEMPT_API_PREFIX}/${draftMeta.attemptUuid}`, {
          method: "PATCH",
          body: JSON.stringify({
            answers,
            current_question_id: getQuestionId(questions[currentQuestionIndex]) || null
          })
        });
      } catch {
        // Autosave failures should not block answering. The next change will retry.
      }
    }

    saveAttempt();
  }, [
    activeExam,
    apiFetch,
    answers,
    currentQuestionIndex,
    draftMeta,
    isReviewMode,
    markedQuestions,
    questions,
    submitResult
  ]);

  useEffect(() => {
    if (!activeExam || !draftMeta || isReviewMode || submitResult) return undefined;

    const initialRemainingSeconds = calculateRemainingSeconds(draftMeta.deadlineAt);
    timerReadyRef.current = initialRemainingSeconds > 0;
    setRemainingSeconds(initialRemainingSeconds);

    const timerId = window.setInterval(() => {
      const nextRemainingSeconds = calculateRemainingSeconds(draftMeta.deadlineAt);
      if (nextRemainingSeconds > 0) {
        timerReadyRef.current = true;
      }
      setRemainingSeconds(nextRemainingSeconds);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [activeExam, draftMeta, isReviewMode, submitResult]);

  useEffect(() => {
    if (
      !activeExam
      || !draftMeta
      || isReviewMode
      || submitLoading
      || submitResult
      || remainingSeconds > 0
      || !timerReadyRef.current
    ) {
      return;
    }

    submitCurrentAttempt({ confirmUnanswered: false });
  }, [activeExam, draftMeta, isReviewMode, remainingSeconds, submitLoading, submitResult]);

  async function loadExamDetail(row) {
    setDetailExam(normalizeExamDetail(row));
    setDetailError("");

    const examUuid = getExamUuid(row);
    if (!examUuid) return normalizeExamDetail(row);

    setDetailLoading(true);
    try {
      const payload = await apiFetch(`/exam/${examUuid}`);
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

  function getSubjectLabel(row) {
    const subject = subjects.find((item) => String(item.subject_id) === String(row.subject_id));
    return subject?.subject_name || "Tổng hợp";
  }

  function resetPracticeState() {
    setActiveExam(null);
    setAnswers({});
    setMarkedQuestions({});
    setCurrentQuestionIndex(0);
    setRemainingSeconds(0);
    setDraftMeta(null);
    timerReadyRef.current = false;
    setExitPromptOpen(false);
    setSubmitLoading(false);
    setSubmitError("");
    setSubmitResult(null);
    setResultModalOpen(false);
    setReviewData(null);
    setReviewLoading(false);
    setReviewError("");
    setOpenExplanations({});
  }

  function restoreAttempt(attempt) {
    if (!attempt?.exam) return false;

    const restoredExam = normalizeExamDetail(attempt.exam);
    const questionCount = restoredExam.questions?.length || 0;
    const currentQuestionId = attempt.current_question_id == null ? "" : String(attempt.current_question_id);
    const currentQuestionFromAttempt = restoredExam.questions?.findIndex(
      (question) => getQuestionKey(question) === currentQuestionId
    );
    const restoredIndex = Math.min(
      Math.max(0, currentQuestionFromAttempt >= 0 ? currentQuestionFromAttempt : 0),
      Math.max(0, questionCount - 1)
    );

    setActiveExam(restoredExam);
    setDetailExam(null);
    setCurrentQuestionIndex(restoredIndex);
    setAnswers(attempt.answers || {});
    setMarkedQuestions({});
    const restoredRemainingSeconds = Number.isFinite(Number(attempt.remaining_seconds))
      ? Number(attempt.remaining_seconds)
      : calculateRemainingSeconds(attempt.deadline_at);
    setRemainingSeconds(restoredRemainingSeconds);
    timerReadyRef.current = restoredRemainingSeconds > 0;
    setDraftMeta({
      attemptUuid: attempt.attempt_uuid,
      examUuid: attempt.exam_uuid || getExamUuid(restoredExam),
      startedAt: attempt.started_at,
      deadlineAt: attempt.deadline_at
    });
    window.localStorage.setItem(ACTIVE_ATTEMPT_EXAM_KEY, attempt.exam_uuid || getExamUuid(restoredExam));
    setSubmitLoading(false);
    setSubmitError("");
    setSubmitResult(null);
    setResultModalOpen(false);
    setReviewData(null);
    setReviewLoading(false);
    setReviewError("");
    setOpenExplanations({});
    setExitPromptOpen(false);
    return true;
  }

  async function handleStartPractice() {
    if (!detailExam) return;

    const examUuid = getExamUuid(detailExam);
    if (!examUuid) {
      setDetailError("Đề thi thiếu exam_uuid, không thể bắt đầu làm bài.");
      return;
    }

    setDetailLoading(true);
    setDetailError("");

    try {
      const attempt = await apiFetch(`${EXAM_ATTEMPT_API_PREFIX}/start`, {
        method: "POST",
        body: JSON.stringify({ exam_uuid: examUuid })
      });
      restoreAttempt({
        ...attempt,
        exam: attempt.exam || detailExam
      });
    } catch (error) {
      setDetailError(error.message || "Không thể bắt đầu bài thi.");
    } finally {
      setDetailLoading(false);
    }
  }

  function handleSelectAnswer(optionId) {
    if (submitResult || isReviewMode || !currentQuestion) return;

    const questionKey = getQuestionKey(currentQuestion);
    if (!questionKey) return;

    setAnswers((current) => ({
      ...current,
      [questionKey]: optionId
    }));
  }

  function handleToggleMark(index) {
    if (isReviewMode) return;

    const questionKey = getQuestionKey(displayQuestions[index]);
    if (!questionKey) return;

    setMarkedQuestions((current) => ({
      ...current,
      [questionKey]: !current[questionKey]
    }));
  }

  function handleExitPractice() {
    if (isReviewMode || submitResult) {
      resetPracticeState();
      return;
    }

    setExitPromptOpen(true);
  }

  function handleSaveAndExitPractice() {
    resetPracticeState();
  }

  function handleDeleteDraftAndExitPractice() {
    window.localStorage.removeItem(ACTIVE_ATTEMPT_EXAM_KEY);
    resetPracticeState();
  }

  async function submitCurrentAttempt({ confirmUnanswered = true } = {}) {
    if (!activeExam || submitLoading || submitResult) return;

    const unansweredCount = Math.max(0, questions.length - answeredCount);
    if (confirmUnanswered && unansweredCount > 0) {
      const confirmed = window.confirm(`Bạn còn ${unansweredCount} câu chưa trả lời. Bạn vẫn muốn nộp bài?`);
      if (!confirmed) return;
    }

    if (!draftMeta?.attemptUuid) {
      setSubmitError("Bài thi thiếu attempt_uuid, không thể nộp bài. Vui lòng tải lại đề.");
      return;
    }

    setSubmitLoading(true);
    setSubmitError("");

    try {
      await apiFetch(`${EXAM_ATTEMPT_API_PREFIX}/${draftMeta.attemptUuid}`, {
        method: "PATCH",
        body: JSON.stringify({
          answers,
          current_question_id: getQuestionId(questions[currentQuestionIndex]) || null
        })
      });
      const result = await apiFetch(`${EXAM_ATTEMPT_API_PREFIX}/${draftMeta.attemptUuid}/submit`, {
        method: "POST"
      });
      setSubmitResult(result);
      setResultModalOpen(true);
      window.localStorage.removeItem(ACTIVE_ATTEMPT_EXAM_KEY);
      setDraftMeta(null);
      setRemainingSeconds(0);
    } catch (error) {
      setSubmitError(error.message || "Không thể nộp bài.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleSubmitExam() {
    await submitCurrentAttempt();
  }

  async function handleStayReview() {
    if (!submitResult?.result_uuid || reviewLoading) {
      setResultModalOpen(false);
      return;
    }

    setReviewLoading(true);
    setReviewError("");

    try {
      const payload = await apiFetch(`/results/review/${submitResult.result_uuid}`);
      setReviewData(payload);
      setCurrentQuestionIndex(0);
      setResultModalOpen(false);
    } catch (error) {
      setReviewError(error.message || "Không tải được dữ liệu xem lại bài.");
    } finally {
      setReviewLoading(false);
    }
  }

  function toggleExplanation(index) {
    setOpenExplanations((current) => ({
      ...current,
      [index]: !current[index]
    }));
  }

  if (activeExam) {
    const currentQuestionKey = getQuestionKey(currentQuestion);
    const selectedOptionId = isReviewMode ? getSelectedOptionId(currentQuestion) : answers[currentQuestionKey];
    const correctOptionId = isReviewMode ? getCorrectOptionId(currentQuestion) : null;
    const correctState = isReviewMode ? getQuestionCorrectState(currentQuestion) : null;
    const displayCorrectOptionId = correctOptionId ?? (correctState === true ? selectedOptionId : null);
    const currentQuestionCount = displayQuestions.length;
    const timerClass = remainingSeconds <= 300
      ? "danger"
      : remainingSeconds <= 600
        ? "warning"
        : "normal";

    return (
      <>
        <SectionTitle>{isReviewMode ? "Xem kết quả" : "Làm bài thi"}</SectionTitle>
        <div className="exam-workspace">
          <section className="content-box exam-main-panel">
            <div className="exam-workspace-header">
              <div>
                <h3>{activeExam.title}</h3>
                <div className="review-meta">
                  <span className="tag">Câu {currentQuestionIndex + 1}/{currentQuestionCount}</span>
                  <span className="tag">Đã làm {answeredCount}/{questions.length}</span>
                  {isReviewMode && <span className="tag">Đang xem kết quả</span>}
                </div>
              </div>
              {isReviewMode ? (
                <div className="exam-timer review">Đã nộp</div>
              ) : (
                <div className={`exam-timer ${timerClass}`}>
                  {formatTime(remainingSeconds)}
                </div>
              )}
            </div>

            {currentQuestionCount === 0 ? (
              <div className="empty">Đề thi này chưa có câu hỏi.</div>
            ) : (
              <>
                <div className="question-card">
                  <div className="question-card-header">
                    <strong>Câu {currentQuestionIndex + 1}</strong>
                    {!isReviewMode && (
                      <button
                        className={`btn-secondary btn-small ${markedQuestions[currentQuestionKey] ? "marked" : ""}`}
                        type="button"
                        onClick={() => handleToggleMark(currentQuestionIndex)}
                      >
                        {markedQuestions[currentQuestionKey] ? "Bỏ đánh dấu" : "Đánh dấu"}
                      </button>
                    )}
                  </div>
                  <p>{currentQuestion.content}</p>
                  <div className="option-list">
                    {(currentQuestion.questionOptions || []).map((option) => {
                      const optionId = getOptionId(option);
                      const isSelected = selectedOptionId === optionId;
                      const isCorrectOption = isReviewMode && displayCorrectOptionId === optionId;
                      const isWrongSelected = isReviewMode && isSelected && !isCorrectOption;

                      return (
                        <label
                          className={[
                            "option-row",
                            isCorrectOption ? "correct" : "",
                            isWrongSelected ? "wrong" : ""
                          ].filter(Boolean).join(" ")}
                          key={optionId || option.content}
                        >
                          <input
                            checked={isSelected}
                            disabled={isReviewMode || Boolean(submitResult)}
                            name={`question-${currentQuestionIndex}`}
                            type="radio"
                            onChange={() => handleSelectAnswer(optionId)}
                          />
                          <span>{option.content}</span>
                        </label>
                      );
                    })}
                  </div>
                  {isReviewMode && (
                    <div className="explanation-panel">
                      <button
                        className="explanation-toggle"
                        type="button"
                        onClick={() => toggleExplanation(currentQuestionIndex)}
                      >
                        {openExplanations[currentQuestionIndex] ? "Ẩn Giải thích" : "Giải thích"}
                      </button>
                      {openExplanations[currentQuestionIndex] && (
                        <div className="explanation-content">
                          {currentQuestion.explanation || "Chưa có giải thích cho câu hỏi này."}
                        </div>
                      )}
                    </div>
                  )}
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
                    disabled={currentQuestionIndex >= currentQuestionCount - 1}
                    onClick={() => setCurrentQuestionIndex((index) => Math.min(currentQuestionCount - 1, index + 1))}
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
              {isReviewMode ? (
                <>
                  <span><i className="legend-dot answered" /> Đúng</span>
                  <span><i className="legend-dot wrong" /> Sai</span>
                </>
              ) : (
                <span><i className="legend-dot answered" /> Đã làm</span>
              )}
              <span><i className="legend-dot unanswered" /> Chưa làm</span>
              {!isReviewMode && <span><i className="legend-dot marked" /> Xem lại</span>}
            </div>
            <div className="question-grid">
              {displayQuestions.map((question, index) => {
                const questionKey = getQuestionKey(question);
                const answered = Boolean(answers[questionKey]);
                const marked = Boolean(markedQuestions[questionKey]);
                const selected = getSelectedOptionId(question);
                const correctState = getQuestionCorrectState(question);
                const correctOption = getCorrectOptionId(question);
                const reviewClass = !selected
                  ? "unanswered"
                  : correctState === true || (correctState === null && correctOption && selected === correctOption)
                    ? "correct"
                    : "wrong";

                return (
                  <button
                    key={question.question_uuid || question.uuid || index}
                    className={[
                      "question-chip",
                      currentQuestionIndex === index ? "active" : "",
                      isReviewMode ? reviewClass : answered ? "answered" : "unanswered",
                      !isReviewMode && marked ? "marked" : ""
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
                {reviewError && <div className="form-error">{reviewError}</div>}
                <div className="modal-actions">
                  <button className="btn-secondary" type="button" disabled={reviewLoading} onClick={handleStayReview}>
                    {reviewLoading ? "Đang tải..." : "Ở lại xem kết quả"}
                  </button>
                  <button className="btn-primary" type="button" onClick={handleExitPractice}>
                    Thoát đề thi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {exitPromptOpen && (
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-content exam-modal">
              <div className="modal-header">
                <h2>Thoát bài làm?</h2>
              </div>
              <div className="modal-body">
                <p className="status-info">Bạn có thể lưu tiến trình để tiếp tục sau, hoặc xóa bài làm đang lưu.</p>
                <div className="modal-actions">
                  <button className="btn-secondary" type="button" onClick={handleSaveAndExitPractice}>
                    Lưu lại và thoát
                  </button>
                  <button className="btn-secondary" type="button" onClick={handleDeleteDraftAndExitPractice}>
                    Thoát và xóa bài làm
                  </button>
                  <button className="btn-primary" type="button" onClick={() => setExitPromptOpen(false)}>
                    Hủy
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
      <div className="library-page">
        <header className="library-hero">
          <h1>Thư viện đề thi luyện tập mới nhất</h1>
          <p>Tổng hợp đề thi theo môn học, khối lớp, số câu và thời lượng để luyện tập nhanh hơn.</p>
        </header>

        <form className="catalog-filter" onSubmit={handleFilterSubmit}>
          <label className="catalog-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={draftFilters.keyword}
              placeholder="Nhập tên đề thi bạn cần tìm?"
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
            <h2>Đề thi nổi bật</h2>
            <span>{exams.length} đề thi</span>
          </div>

          {exams.length === 0 ? (
            <div className="empty">Chưa có đề thi.</div>
          ) : (
            <div className="resource-grid">
              {exams.map((exam) => (
                <article
                  className="resource-card exam-card"
                  key={exam.uuid || exam.exam_uuid || exam.exam_id}
                  tabIndex={0}
                  onClick={() => loadExamDetail(exam)}
                >
                  <div className="resource-card-body">
                    <h3>{exam.title}</h3>
                    <p>{getSubjectLabel(exam)} - Lớp {exam.grade || "-"} - {exam.question_number || exam.questionNumber || 0} câu</p>
                  </div>
                  <div className="resource-card-details">
                    <span>Thời gian: {exam.duration || 0} phút</span>
                    <span>Môn: {getSubjectLabel(exam)}</span>
                    <span>Lớp: {exam.grade || "-"}</span>
                  </div>
                  <div className="resource-actions">
                    <button
                      className="btn-secondary btn-small"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        loadExamDetail(exam);
                      }}
                    >
                      Chi tiết
                    </button>
                    <button
                      className="btn-primary btn-small"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        loadExamDetail(exam);
                      }}
                    >
                      Làm bài
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
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
