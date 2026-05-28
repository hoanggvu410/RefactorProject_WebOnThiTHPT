from pydantic import BaseModel
from app.schemas.question_schema import QuestionResponse
from app.schemas.user_answer_schema import UserAnswers


class ExamResponse(BaseModel):
    examID: int
    title: str
    questionNumber: int
    duration: int
    questions: list[QuestionResponse]

    class Config:
        from_atributes = True

class SubmitExam(BaseModel):
    userID: int
    examID: int
    answers: list[UserAnswers]
    timeSpent: int

    class Config:
        from_atributes = True
