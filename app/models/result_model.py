from sqlalchemy import Integer, Column, ForeignKey
from sqlalchemy.orm import relationship

from app.base.db import Base

class Result(Base):
    __tablename__ = "results"
    resultID = Column(Integer, primary_key=True, autoincrement=True)
    score = Column(Integer, default=0)
    userID = Column(Integer, ForeignKey("users.userID"))
    examID = Column(Integer, ForeignKey("exams.examID"))
    timeSpent = Column(Integer, default=0)

    user = relationship("User", back_populates="results")
    exam = relationship("Exam", back_populates="results")
    userAnswers = relationship("UserAnswers", back_populates="result")