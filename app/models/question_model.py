from sqlalchemy import Integer, Column, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.base.db import Base
from app.models.models import AdminSchemaMixin


class Question(Base, AdminSchemaMixin):
    __tablename__ = 'questions'
    question_id = Column(Integer, primary_key=True, autoincrement=True)
    grade = Column(Integer, default=10)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"))
    content = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    tags = Column(JSONB, default=[], nullable=False)

    subject = relationship("Subject", back_populates="questions")
    question_options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    exams = relationship("Exam", secondary="exam_questions", back_populates="questions")
    user_answers = relationship("UserAnswer", back_populates="question")