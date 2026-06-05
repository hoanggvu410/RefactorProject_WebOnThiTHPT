from sqlalchemy import Column, Integer, ForeignKey
from app.base.db import Base


class ExamQuestion(Base):
    __tablename__ = "exam_questions"
    exam_question_id = Column(Integer, primary_key=True, autoincrement=True)
    exam_id = Column(Integer, ForeignKey("exams.exam_id"))
    question_id = Column(Integer, ForeignKey("questions.question_id"))

