from uuid import UUID

from fastapi import Query
from pydantic import BaseModel

from app.schemas.question_schema import ReviewQuestionResponse


class ReviewResultResponse(BaseModel):
    title: str
    score: float
    time_spent: int
    questions: list[ReviewQuestionResponse]

    class Config:
        from_attributes = True

class ResultQueryParams(BaseModel):
    page: int = Query(1, ge=1)
    limit: int = Query(10, ge=1, le=100)
    subject_id: int | None = Query(None)
    grade: int = Query(10, ge=10, le=12)
    keyword: str | None = Query(None)
    sort_by: str = "uuid"
    sort_order: str = "asc"

class SubmitExamResponse(BaseModel):
    message: str
    result_uuid: UUID
    score: float
    correct_count: int
    total_question: int
    time_spent: int