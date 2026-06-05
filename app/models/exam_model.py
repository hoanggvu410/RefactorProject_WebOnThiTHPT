from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.base.db import Base
from app.models.models import AdminSchemaMixin


class Exam(Base, AdminSchemaMixin):
    __tablename__ = "exams"
    exam_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"))
    grade = Column(Integer, default=10)
    question_number = Column(Integer, default = 0)
    duration = Column(Integer, default=0)

    subject = relationship("Subject", back_populates="exams")
    results = relationship("Result", back_populates="exam")
    questions = relationship("Question", secondary="exam_questions", back_populates="exams")
