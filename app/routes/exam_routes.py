from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from redis.asyncio import Redis
from sqlalchemy.orm import Session
from app.core.redis import get_redis
from app.models.exam_model import Exam
from app.schemas.exam_schema import CreateExam, ExamResponse
from app.dependencies.auth_dependency import get_current_user, require_roles
from app.dependencies.db_dependency import get_db
from app.schemas.exam_schema import ExamQueryParams
from app.services import exam_service

router = APIRouter(prefix="/exam", tags=["Exam"], dependencies=[Depends(get_current_user)])

@router.get("/")
def get_exams(params: ExamQueryParams = Depends(), db: Session = Depends(get_db)):
    return exam_service.get_exams(params, db)

@router.get("/{exam_uuid}", response_model=ExamResponse)
async def get_exam_by_uuid(exam_uuid: UUID, db: Session = Depends(get_db), redis_client: Redis = Depends(get_redis)):
    return await exam_service.get_public_exam_cached(exam_uuid, db, redis_client)

@router.post("/create_exam")
def create_exam(exam_data: CreateExam, db: Session = Depends(get_db), current_user= Depends(require_roles("giáo viên", "admin"))):
    return exam_service.create_exam(exam_data, db, current_user)
