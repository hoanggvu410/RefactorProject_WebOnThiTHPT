from uuid import UUID

from fastapi import Query
from pydantic import BaseModel
from app.schemas.question_schema import QuestionResponse
from app.schemas.user_answer_schema import UserAnswers


class ExamResponse(BaseModel):
    exam_uuid: UUID
    title: str
    questionNumber: int
    duration: int
    questions: list[QuestionResponse]

    class Config:
        from_atributes = True

class SubmitExam(BaseModel):
    exam_uuid: UUID
    answers: list[UserAnswers]
    time_spent: int

    class Config:
        from_atributes = True

class ExamQueryParams(BaseModel):
    page: int = Query(1, ge=1)
    limit: int = Query(10, ge=1, le=100)
    subject_id: int | None = Query(None)
    grade: int = Query(10, ge=10, le=12)
    keyword: str | None = Query(None)
    sort_by: str = "uuid"
    sort_order: str = "asc"
