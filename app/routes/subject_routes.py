from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.subject_model import Subject
from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db

router = APIRouter(prefix="/subjects", tags=["Subjects"], dependencies=[Depends(get_current_user)])

@router.get("/")
def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()

@router.get("/{subject_id}")
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.subject_id == subject_id).first()
    if not subject:
        return {"message": "Subject not found"}
    return subject