from uuid import UUID

from fastapi import Query
from pydantic import BaseModel, Field
from app.schemas.question_schema import CreateQuestionForExam, QuestionResponse
from app.schemas.user_answer_schema import UserAnswers


class ExamResponse(BaseModel):
    exam_uuid: UUID
    title: str
    questionNumber: int
    duration: int
    questions: list[QuestionResponse]

    class Config:
        from_attributes = True

class SubmitExam(BaseModel):
    exam_uuid: UUID
    answers: list[UserAnswers]
    time_spent: int

    class Config:
        from_attributes = True

class ExamQueryParams(BaseModel):
    page: int = Query(1, ge=1)
    limit: int = Query(10, ge=1, le=100)
    subject_id: int | None = Query(None)
    grade: int | None = Query(None, ge=10, le=12)
    keyword: str | None = Query(None)  
    sort_by: str = "uuid"
    sort_order: str = "asc"

class CreateExam(BaseModel):
    title: str
    subject_id: int
    grade: int = Field(...,ge=10, le=12)
    duration: int
    questions: list[CreateQuestionForExam] = Field(...,min_length=1) #moi de co it nhat 1 cau hoi   

class CreateExamResponse(BaseModel):
    exam_uuid: UUID
    title: str
    questionNumber: int
    duration: int
    questions: list[QuestionResponse]


class ImportExamCSVResponse(BaseModel):
    message: str
    exam_uuid: UUID
    title: str
    question_number: int