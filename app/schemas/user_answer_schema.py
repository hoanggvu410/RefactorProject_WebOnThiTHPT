from pydantic import BaseModel, ConfigDict, Field


class UserAnswers(BaseModel):
    question_id: int = Field(alias="questionID")
    selected_option_id: int = Field(alias="selectedOptionID")

    model_config = ConfigDict(populate_by_name=True)
