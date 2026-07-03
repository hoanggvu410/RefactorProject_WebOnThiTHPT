import { useEffect, useMemo, useState } from "react";
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

function getQuestionId(question) {
  return question?.questionID ?? question?.question_id ?? question?.question_uuid ?? question?.uuid;
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
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [openExplanations, setOpenExplanations] = useState({});

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

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

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
    setReviewData(null);
    setReviewLoading(false);
    setReviewError("");
    setOpenExplanations({});
  }

  function handleSelectAnswer(optionId) {
    if (submitResult || isReviewMode) return;

    setAnswers((current) => ({
      ...current,
      [currentQuestionIndex]: optionId
    }));
  }

  function handleToggleMark(index) {
    if (isReviewMode) return;

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
    setReviewData(null);
    setReviewLoading(false);
    setReviewError("");
    setOpenExplanations({});
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
    const selectedOptionId = isReviewMode ? getSelectedOptionId(currentQuestion) : answers[currentQuestionIndex];
    const correctOptionId = isReviewMode ? getCorrectOptionId(currentQuestion) : null;
    const correctState = isReviewMode ? getQuestionCorrectState(currentQuestion) : null;
    const displayCorrectOptionId = correctOptionId ?? (correctState === true ? selectedOptionId : null);
    const currentQuestionCount = displayQuestions.length;

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
                <div className={`exam-timer ${remainingSeconds <= 300 ? "danger" : ""}`}>
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
                        className={`btn-secondary btn-small ${markedQuestions[currentQuestionIndex] ? "marked" : ""}`}
                        type="button"
                        onClick={() => handleToggleMark(currentQuestionIndex)}
                      >
                        {markedQuestions[currentQuestionIndex] ? "Bỏ đánh dấu" : "Đánh dấu"}
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
                const answered = Boolean(answers[index]);
                const marked = Boolean(markedQuestions[index]);
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
