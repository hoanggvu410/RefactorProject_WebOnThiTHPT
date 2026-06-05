from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class UpdateMeRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserMeResponse(BaseModel):
    user_uuid: UUID
    name: str
    username: str
    email: str
    role: str
    grade: int

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
