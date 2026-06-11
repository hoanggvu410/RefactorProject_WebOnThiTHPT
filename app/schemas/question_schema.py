from uuid import UUID

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.question_option_schema import QuestionOptionResponse


class QuestionResponse(BaseModel):
    question_uuid: UUID = Field(validation_alias="uuid")
    content: str
    questionOptions: list[QuestionOptionResponse] = Field(validation_alias="question_options")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ReviewQuestionResponse(QuestionResponse):
    is_correct: bool
    selectedOptionID: int

class QuestionQueryParams(BaseModel):
    page: int = Query(default=1, ge=1)
    limit: int = Query(default=20, ge=1, le=100)
    subject_id: int | None = Query(default=None)
    grade: int | None = Query(default=None, ge=10, le=12)
    keyword: str | None = Query(default=None, max_length=100)
    sort_by: str = "uuid"
    sort_order: str = "asc"
