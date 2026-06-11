from pydantic import BaseModel, ConfigDict, Field


class QuestionOptionResponse(BaseModel):
    questionoptionID: int = Field(validation_alias="question_option_id")
    content: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
