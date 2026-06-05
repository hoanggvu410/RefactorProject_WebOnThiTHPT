from sqlalchemy import Integer, Column, ForeignKey, func, DateTime
from sqlalchemy.orm import relationship

from app.base.db import Base
from app.models.models import LogSchemaMixin


class Result(Base, LogSchemaMixin):
    __tablename__ = "results"
    result_id = Column(Integer, primary_key=True, autoincrement=True)
    score = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    exam_id = Column(Integer, ForeignKey("exams.exam_id"))
    time_spent = Column(Integer, default=0)
    submitted_at = Column(DateTime, default= func.now(), nullable=False)

    user = relationship("User", back_populates="results")
    exam = relationship("Exam", back_populates="results")
    user_answers = relationship("UserAnswer", back_populates="result")