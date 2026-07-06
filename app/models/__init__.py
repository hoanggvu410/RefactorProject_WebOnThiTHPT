# Import all models to resolve relationships
from app.models.user_model import User
from app.models.subject_model import Subject
from app.models.exam_model import Exam
from app.models.question_model import Question
from app.models.question_option_model import QuestionOption
from app.models.exam_question_model import ExamQuestion
from app.models.result_model import Result
from app.models.document_model import Document
from app.models.news_model import News
from app.models.user_answer_model import UserAnswer
from app.models.refresh_token_model import RefreshToken
from app.models.exam_attempt_model import ExamAttempt

__all__ = [
    "User",
    "Subject",
    "Exam",
    "Question",
    "QuestionOption",
    "ExamQuestion",
    "Result",
    "Document",
    "News",
    "UserAnswer",
    "RefreshToken",
    "ExamAttempt",
]
