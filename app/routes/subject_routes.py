from fastapi import APIRouter
from fastapi.params import Depends

from app.base.db import SessionLocal
from app.models.subject_model import Subject
from app.dependencies.auth_dependency import get_current_user

router = APIRouter(prefix = "/subjects", tags=["Subjects"], dependencies=[Depends(get_current_user)])
db = SessionLocal()

@router.get("/")
def get_subjects():
    return db.query(Subject).all()

@router.get("/{subject_id}")
def get_subject(
        subject_id: int
):
    subject = db.query(Subject).filter(Subject.subjectID == subject_id).first()
    if not subject:
        return {"message": "Subject not found"}
    return subject