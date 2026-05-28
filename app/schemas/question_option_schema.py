from pydantic import BaseModel


class QuestionOptionResponse(BaseModel):
    questionoptionID: int
    content: str

    class Config:
        from_attributes = True
