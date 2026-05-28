from sqlalchemy import Column, Integer, ForeignKey
from app.base.db import Base


class ExamQuestion(Base):
    __tablename__ = "exam_questions"
    examQuestionID = Column(Integer, primary_key=True, autoincrement=True)
    examID = Column(Integer, ForeignKey("exams.examID"))
    questionID = Column(Integer, ForeignKey("questions.questionID"))

