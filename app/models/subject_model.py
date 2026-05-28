from sqlalchemy import Integer, Column, String
from sqlalchemy.orm import relationship

from app.base.db import Base

class Subject(Base):
    __tablename__ = "subjects"
    subjectID = Column(Integer, primary_key=True, autoincrement=True)
    subjectName = Column(String, nullable=False)

    exams = relationship("Exam", back_populates="subject")
    documents = relationship("Document", back_populates="subject")
    questions = relationship("Question", back_populates="subject")