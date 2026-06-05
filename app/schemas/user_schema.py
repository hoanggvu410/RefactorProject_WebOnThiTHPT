from fastapi import Query
from pydantic import BaseModel


class UserQueryParams(BaseModel):
    page: int = Query(1, ge=1)
    limit: int = Query(10, ge=1, le=100)
    username: str
    grade: int = Query(10, ge=10, le=12)
    keyword: str | None = Query(None)
    sort_by: str = "exam_id"
    sort_order: str = "asc"
