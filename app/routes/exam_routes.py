from fastapi import APIRouter, HTTPException
from fastapi.params import Depends

from app.base.db import SessionLocal
from app.models.exam_model import Exam
from app.schemas.exam_schema import ExamResponse, SubmitExam
from app.dependencies.auth_dependency import get_current_user

router = APIRouter(prefix="/exam", tags=["Exam"], dependencies= [Depends(get_current_user)])
db = SessionLocal()
@router.get("/")
def get_exam():
    return db.query(Exam).all()

@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam_by_id(exam_id: int):
    exam = db.query(Exam).filter(Exam.examID == exam_id).first()
    if not exam:
        raise HTTPException(404, {
            "code": "EXAM_NOT_FOUND",
            "message": "Exam not found"
        })
    return ExamResponse(
        examID = exam.examID,
        title = exam.title,
        questionNumber=exam.questionNumber,
        duration = exam.duration,
        questions = exam.questions
    )


