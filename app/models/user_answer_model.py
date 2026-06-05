from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.base.db import Base
from app.models.models import LogSchemaMixin


class UserAnswer(Base, LogSchemaMixin):
    __tablename__ = "user_answers"

    user_answer_id = Column(Integer, primary_key=True, autoincrement=True)
    selected_option_id = Column(Integer, ForeignKey("question_options.question_option_id"))
    question_id = Column(Integer, ForeignKey("questions.question_id"))
    result_id = Column(Integer, ForeignKey("results.result_id"))

    question_option = relationship("QuestionOption", back_populates="user_answers")
    question = relationship("Question", back_populates="user_answers")
    result = relationship("Result", back_populates="user_answers")