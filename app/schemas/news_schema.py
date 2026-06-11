from datetime import datetime

from fastapi import Query
from pydantic import BaseModel

class CreateNews(BaseModel):
    title: str
    content: str
    link: str
    date: str

class NewsQueryParams(BaseModel):
    page: int = Query(1, ge=1)
    limit: int = Query(10, ge=1, le=100)
    title: str | None = Query(None)
    published_at: datetime | None = Query(None)
    keyword: str | None = Query(None)
    sort_by: str = "uuid"
    sort_order: str = "asc"