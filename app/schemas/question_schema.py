from pydantic import BaseModel

from app.schemas.question_option_schema import QuestionOptionResponse


class QuestionResponse(BaseModel):
    questionID: int
    content: str
    questionOptions: list[QuestionOptionResponse] #4 cau trl

    class Config:
        from_attributes = True

class ReviewQuestionResponse(QuestionResponse):
    is_correct: bool
    selectedOptionID: int

