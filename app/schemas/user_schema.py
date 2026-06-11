from fastapi import Query
from pydantic import BaseModel


class UserQueryParams(BaseModel):
    page: int = Query(1, ge=1)
    limit: int = Query(10, ge=1, le=100)
    username: str | None = Query(None)
    grade: int | None = Query(None, ge=10, le=12)
    is_active: bool | None = Query(None)
    keyword: str | None = Query(None)
    sort_by: str = "user_id"
    sort_order: str = "asc"
