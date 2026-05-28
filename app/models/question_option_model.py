from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.base.db import Base


class QuestionOption(Base):
    __tablename__ = "question_options"
    questionoptionID = Column(Integer, primary_key=True, autoincrement=True)
    questionID = Column(Integer, ForeignKey("questions.questionID"))
    content = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)

    question = relationship("Question", back_populates="questionOptions")
    userAnswers = relationship("UserAnswers", back_populates="questionOption")