from sqlalchemy import Integer, Column, String
from sqlalchemy.orm import relationship

from app.base.db import Base
from app.models.models import LogSchemaMixin


class Subject(Base, LogSchemaMixin):
    __tablename__ = "subjects"
    subject_id = Column(Integer, primary_key=True, autoincrement=True)
    subject_name = Column(String, nullable=False)

    exams = relationship("Exam", back_populates="subject")
    documents = relationship("Document", back_populates="subject")
    questions = relationship("Question", back_populates="subject")