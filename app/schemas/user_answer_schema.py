from pydantic import BaseModel


class UserAnswers(BaseModel):
    questionID: int
    selectedOptionID: int
