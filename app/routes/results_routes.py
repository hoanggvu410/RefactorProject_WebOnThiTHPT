from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.redis import get_redis
from app.schemas.result_schema import ReviewResultResponse
from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db
from app.models.user_model import User
from app.services import result_service

router = APIRouter(prefix="/results", tags=["Results"], dependencies=[Depends(get_current_user)])

@router.get("/user/{user_id}")
def get_results_by_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return result_service.get_results_by_user(user_id, db, current_user)

@router.get("/review/{result_uuid}", response_model=ReviewResultResponse)
def review_result(result_uuid: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return result_service.review_result(result_uuid, db, current_user)
