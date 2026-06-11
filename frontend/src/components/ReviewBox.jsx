export default function ReviewBox({ review }) {
  if (!review || !review.questions || review.questions.length === 0) {
    return <div className="empty">Không có dữ liệu review.</div>;
  }

  return (
    <div>
      <div className="review-item">
        <div className="review-meta">
          <span className="tag">{review.title || "Đề thi"}</span>
          <span className="tag">{review.score ?? "-"} điểm</span>
          <span className="tag">{review.time_spent ?? review.timeSpent ?? "-"} phút</span>
        </div>
      </div>
      {review.questions.map((question, index) => (
        <div className="review-item" key={question.question_uuid || index}>
          <h3>Câu {index + 1}. {question.content}</h3>
          <div className="review-meta">
            <span className="tag">{question.is_correct ? "✓ Đúng" : "✗ Sai"}</span>
            <span className="tag">Selected #{question.selectedOptionID ?? "-"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
