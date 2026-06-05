from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.result_model import Result
from app.schemas.exam_schema import SubmitExam
from app.schemas.result_schema import ReviewResultResponse
from app.models.question_option_model import QuestionOption
from app.schemas.question_schema import ReviewQuestionResponse
from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db
from app.models.user_model import User
from app.models.exam_model import Exam
from app.services import result_service

router = APIRouter(prefix="/results", tags=["Results"], dependencies=[Depends(get_current_user)])

@router.post("/submit-exam", response_model=SubmitExam)
def submit_exam(data: SubmitExam, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return result_service.submit_exam(data, db, current_user)

@router.get("/review/{result_uuid}", response_model=ReviewResultResponse)
def review_result(result_uuid: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return result_service.review_result(result_uuid, db, current_user)
