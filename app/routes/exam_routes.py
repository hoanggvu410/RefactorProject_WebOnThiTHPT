from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
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
def get_exam_by_uuid(exam_uuid: UUID, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.uuid == exam_uuid).first()
    if not exam:
        raise HTTPException(404, {"code": "EXAM_NOT_FOUND", "message": "Exam not found"})
    return ExamResponse(
        exam_uuid = exam.uuid,
        title=exam.title,
        questionNumber=exam.question_number,
        duration=exam.duration,
        questions=exam.questions
    )

@router.post("/create_exam")
def create_exam(exam_data: CreateExam, db: Session = Depends(get_db), current_user= Depends(require_roles("giáo viên", "admin"))):
    return exam_service.create_exam(exam_data, db, current_user)
