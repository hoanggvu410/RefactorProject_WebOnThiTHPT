from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String, func
from sqlalchemy.orm import relationship

from app.base.db import Base
from app.models.models import LogSchemaMixin


class ExamAttempt(Base, LogSchemaMixin):
    __tablename__ = "exam_attempts"
    __table_args__ = (
        Index("ix_exam_attempts_user_id", "user_id"),
        Index("ix_exam_attempts_exam_id", "exam_id"),
        Index("ix_exam_attempts_status", "status"),
        Index("ix_exam_attempts_user_exam_status", "user_id", "exam_id", "status"),
    )

    attempt_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.exam_id"), nullable=False)
    result_id = Column(Integer, ForeignKey("results.result_id"), nullable=True)
    status = Column(String(20), default="in_progress", nullable=False)
    answers_json = Column(JSON, default=dict, nullable=False)
    current_question_id = Column(Integer, ForeignKey("questions.question_id"), nullable=True)
    started_at = Column(DateTime, server_default=func.now(), nullable=False)
    deadline_at = Column(DateTime, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    user = relationship("User")
    exam = relationship("Exam")
    result = relationship("Result")
    current_question = relationship("Question")
