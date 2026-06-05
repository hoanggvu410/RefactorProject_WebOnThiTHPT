from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.document_model import Document
from app.schemas.document_schema import CreateDocument
from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db

router = APIRouter(prefix="/documents", tags=["Documents"], dependencies=[Depends(get_current_user)])

@router.get("/")
def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()

@router.get("/{document_uuid}")
def get_document(document_uuid: UUID, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.uuid == document_uuid).first()
    if not document:
        raise HTTPException(404, {"code": "DOCUMENT_NOT_FOUND", "message": "Document not found"})
    return document

@router.post("/")
def create_document(document: CreateDocument, db: Session = Depends(get_db)):
    new_document = Document(
        title=document.title,
        link=document.link,
        grade=document.grade,
        subject_id=document.subject_id
    )
    db.add(new_document)
    db.commit()
    return CreateDocument(
        title=new_document.title,
        link=new_document.link,
        grade=new_document.grade,
        subject_id=new_document.subject_id
    )

@router.put("/{document_uuid}")
def update_document(document_uuid: UUID, document: CreateDocument, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.uuid == document_uuid).first()
    if not document:
        raise HTTPException(404, {"code": "DOCUMENT_NOT_FOUND", "message": "Document not found"})
    document.title = document.title
    document.link = document.link
    document.grade = document.grade
    document.subject_id = document.subject_id
    db.commit()
    return {"message": "Document updated successfully"}

@router.delete("/{document_uuid}")
def delete_document(document_uuid: UUID, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.uuid == document_uuid).first()
    if not document:
        raise HTTPException(404, {"code": "DOCUMENT_NOT_FOUND", "message": "Document not found"})
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

