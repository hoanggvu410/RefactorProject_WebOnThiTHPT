from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class UpdateMeRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    grade: Optional[int] = Field(default=None, ge=10, le=12)


class UserMeResponse(BaseModel):
    uuid: UUID
    name: str
    username: str
    email: str
    role: str
    grade: int
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class HistoryItemResponse(BaseModel):
    result_uuid: UUID
    exam_uuid: UUID
    exam_title: str
    subject_name: str
    score: float
    correct_count: int
    total_question: int
    time_spent: int
    submitted_at: datetime

    class Config:
        from_attributes = True

class HistoryListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[HistoryItemResponse]

class SubjectStat(BaseModel):
    subject_id: int
    subject_name: str
    total_exams: int
    avg_score: float
