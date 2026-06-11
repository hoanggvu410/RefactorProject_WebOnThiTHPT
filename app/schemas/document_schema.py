import datetime
from typing import Optional

from uuid import UUID
from fastapi import Query
from pydantic import BaseModel


class CreateDocument(BaseModel):
    title: str
    grade: int
    subject_id: int

class DocumentQueryParams(BaseModel):
    page: int = Query(1, ge=1)
    limit: int = Query(10, ge=1, le=100)
    subject_id: int | None = Query(None)
    grade: int | None = Query(None, ge=10, le=12)
    keyword: str | None = Query(None)
    sort_by: str = "created_at"
    sort_order: str = "desc"

class DocumentResponse(BaseModel):
    document_id: int
    uuid: UUID
    title: str
    link: Optional[str] = None
    grade: int
    subject_id: int
    created_at: Optional[datetime.datetime] = None
