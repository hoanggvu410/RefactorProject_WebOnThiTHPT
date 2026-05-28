from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.base.db import Base


class UserAnswers(Base):
    __tablename__ = "user_answers"

    userAnswerID = Column(Integer, primary_key=True, autoincrement=True)
    selectedOptionID = Column(Integer, ForeignKey("question_options.questionoptionID"))
    questionID = Column(Integer, ForeignKey("questions.questionID"))
    resultID = Column(Integer, ForeignKey("results.resultID"))

    questionOption = relationship("QuestionOption", back_populates="userAnswers")
    question = relationship("Question", back_populates="userAnswers")
    result = relationship("Result", back_populates="userAnswers")