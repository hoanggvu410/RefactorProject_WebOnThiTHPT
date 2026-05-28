from fastapi import APIRouter

from app.base.db import SessionLocal
from app.models.subject_model import Subject

router = APIRouter(prefix = "/subjects", tags=["Subjects"])
db = SessionLocal()

@router.get("/")
def get_subjects():
    return db.query(Subject).all()

@router.get("/{subject_id}")
def get_subject(subject_id: int):
    subject = db.query(Subject).filter(Subject.subjectID == subject_id).first()
    if not subject:
        return {"message": "Subject not found"}
    return subject