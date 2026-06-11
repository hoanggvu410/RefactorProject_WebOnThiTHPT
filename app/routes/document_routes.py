from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, Depends, UploadFile
from sqlalchemy.orm import Session
from app.models.document_model import Document
from app.models.user_model import User
from app.schemas.document_schema import CreateDocument, DocumentQueryParams, DocumentResponse
from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db
from app.services import document_service

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/")
def get_documents(params: DocumentQueryParams = Depends(), db: Session = Depends(get_db)):
    return document_service.get_documents(params, db)

@router.get("/{document_uuid}")
def get_document(document_uuid: UUID, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.uuid == document_uuid).first()
    if not document:
        raise HTTPException(404, {"code": "DOCUMENT_NOT_FOUND", "message": "Document not found"})
    return document

@router.put("/{document_uuid}")
def update_document(document_uuid: UUID, payload: CreateDocument, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    document = db.query(Document).filter(Document.uuid == document_uuid).first()
    if not document:
        raise HTTPException(404, {"code": "DOCUMENT_NOT_FOUND", "message": "Document not found"})
    document.title = payload.title
    document.grade = payload.grade
    document.subject_id = payload.subject_id
    db.commit()
    return {"message": "Document updated successfully"}

@router.delete("/{document_uuid}")
def delete_document(document_uuid: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    document = db.query(Document).filter(Document.uuid == document_uuid).first()
    if not document:
        raise HTTPException(404, {"code": "DOCUMENT_NOT_FOUND", "message": "Document not found"})
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

@router.post("/create_document", response_model=DocumentResponse)
def create_document(
    title: str = Form(...),
    grade: int = Form(...),
    subject_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return document_service.upload_document(file=file, db=db, title=title, grade=grade, subject_id=subject_id, current_user=current_user)
