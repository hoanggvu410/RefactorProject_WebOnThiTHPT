from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class StartAttemptRequest(BaseModel):
    exam_uuid: UUID


class SaveAttemptRequest(BaseModel):
    answers: dict[str, int] = Field(default_factory=dict)
    current_question_id: int | None = None


class ExamAttemptResponse(BaseModel):
    attempt_uuid: UUID
    exam_uuid: UUID
    status: str
    answers: dict[str, int]
    current_question_id: int | None = None
    started_at: datetime
    deadline_at: datetime
    remaining_seconds: int
    result_uuid: UUID | None = None
    exam: dict | None = None