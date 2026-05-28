from fastapi import APIRouter, HTTPException

from app.base.db import SessionLocal
from app.models.exam_model import Exam
from app.schemas.exam_schema import ExamResponse, SubmitExam

router = APIRouter(prefix="/exam", tags=["Exam"])
db = SessionLocal()
@router.get("/")
def get_exam():
    return db.query(Exam).all()

@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam_by_id(exam_id: int):
    exam = db.query(Exam).filter(Exam.examID == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


