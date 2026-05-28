from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.base.db import Base

class Exam(Base):
    __tablename__ = "exams"
    examID = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    subjectID = Column(Integer, ForeignKey("subjects.subjectID"))
    grade = Column(Integer, default=10)
    questionNumber = Column(Integer, default = 0)
    duration = Column(Integer, default=0)

    subject = relationship("Subject", back_populates="exams")
    results = relationship("Result", back_populates="exam")
    questions = relationship("Question", secondary="exam_questions", back_populates="exams")
