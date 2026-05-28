from fastapi import APIRouter, HTTPException

from app.models.result_model import Result
from app.base.db import SessionLocal
from app.schemas.exam_schema import SubmitExam
from app.services.result_service import submit_exam_service

router = APIRouter(prefix="/results", tags=["Results"])
db = SessionLocal()
@router.get("/user/{user_id}")
def get_result_by_userID(user_id:int):
    result = db.query(Result).filter(Result.userID == user_id).all()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return result

@router.get("/user/{user_id}/exam/{exam_id}")
def get_result_by_examID(user_id: int, exam_id:int):
    result = db.query(Result).filter(Result.userID == user_id, Result.examID == exam_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    

@router.post("/submit")
def submit_exam(exam: SubmitExam):
    return submit_exam_service(db, exam)
