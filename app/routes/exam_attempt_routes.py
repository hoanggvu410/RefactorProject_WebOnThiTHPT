from uuid import UUID

from fastapi import APIRouter, Depends, Query
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core.redis import get_redis
from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db
from app.models.user_model import User
from app.schemas.examp_attempt_schema import ExamAttemptResponse, SaveAttemptRequest, StartAttemptRequest
from app.services import exam_attempt_service


router =APIRouter(prefix="/exam-attempt", tags=["Exam Attempt"], dependencies=[Depends(get_current_user)])

@router.post("/start", response_model=ExamAttemptResponse)
async def start_exam_attempt(
    request: StartAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    return await exam_attempt_service.start_attempt(db, request.exam_uuid, current_user, redis_client)

@router.get("/current", response_model=ExamAttemptResponse | None)
async def get_current_attempt(
    exam_uuid: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    return await exam_attempt_service.get_current_attempt(db, exam_uuid, current_user, redis_client)


@router.patch("/{attempt_uuid}", response_model=ExamAttemptResponse)
def save_attempt(
    attempt_uuid: UUID,
    data: SaveAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return exam_attempt_service.save_attempt(db, attempt_uuid, data, current_user)


@router.post("/{attempt_uuid}/submit")
async def submit_attempt(
    attempt_uuid: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    return await exam_attempt_service.submit_attempt(db, attempt_uuid, current_user, redis_client)
