from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.base.db import Base


class QuestionOption(Base):
    __tablename__ = "question_options"
    question_option_id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("questions.question_id"))
    content = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)

    question = relationship("Question", back_populates="question_options")
    user_answers = relationship("UserAnswer", back_populates="question_option")