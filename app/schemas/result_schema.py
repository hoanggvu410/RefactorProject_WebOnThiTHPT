from pydantic import BaseModel

from app.schemas.question_schema import ReviewQuestionResponse


class ReviewResultResponse(BaseModel):
    title: str
    score: float
    timeSpent: int
    questions: list[ReviewQuestionResponse]

    class Config:
        from_attributes = True
