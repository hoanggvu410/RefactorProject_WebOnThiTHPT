from sqlalchemy import Integer, Column, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.base.db import Base


class Question(Base):
    __tablename__ = 'questions'
    questionID = Column(Integer, primary_key=True, autoincrement=True)
    grade = Column(Integer, default=10)
    subjectID = Column(Integer, ForeignKey("subjects.subjectID"))
    content = Column(Text, nullable=False)

    subject = relationship("Subject", back_populates="questions")
    questionOptions = relationship("QuestionOption", back_populates="question")
    exams = relationship("Exam", secondary="exam_questions", back_populates="questions")
    userAnswers = relationship("UserAnswers", back_populates="question")