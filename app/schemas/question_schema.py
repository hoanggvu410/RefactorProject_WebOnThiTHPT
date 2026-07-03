from uuid import UUID

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.question_option_schema import CreateQuestionOption, QuestionOptionResponse


class QuestionResponse(BaseModel):
    questionID: int = Field(validation_alias="question_id")
    question_uuid: UUID = Field(validation_alias="uuid")
    content: str
    questionOptions: list[QuestionOptionResponse] = Field(validation_alias="question_options")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ReviewQuestionResponse(QuestionResponse):
    is_correct: bool | None = None
    selectedOptionID: int | None = None
    correctOptionID: int 
    explanation: str | None = None

class QuestionQueryParams(BaseModel):
    page: int = Query(default=1, ge=1)
    limit: int = Query(default=20, ge=1, le=100)
    subject_id: int | None = Query(default=None)
    grade: int | None = Query(default=None, ge=10, le=12)
    keyword: str | None = Query(default=None, max_length=100)
    sort_by: str = "uuid"
    sort_order: str = "asc"

class CreateQuestion(BaseModel):
    content: str
    grade: int = Field(..., ge = 10, le =12)
    subject_id: int
    explanation: str | None = None
    QuestionOptions: list[CreateQuestionOption] = Field(...,min_length=2) #moi cau hoi co it nhat 2 dap an

    class config:
        from_attributes = True

class CreateQuestionForExam(BaseModel):
    content: str
    explanation: str | None = None
    QuestionOptions: list[CreateQuestionOption] = Field(...,min_length=2)

    class config:
        from_attributes = True