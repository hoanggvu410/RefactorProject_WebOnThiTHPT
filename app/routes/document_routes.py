from fastapi import APIRouter, HTTPException

from app.base.db import SessionLocal
from app.models.document_model import Document
from app.schemas.document_schema import CreateDocument

router = APIRouter(prefix="/documents")
db = SessionLocal()

@router.get("/")
def get_documents():

    return db.query(Document).all()

@router.get("/{document_id}")
def get_document(document_id: int):

    d = db.query(Document).filter(Document.documentID == document_id).first()
    if not d:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )
    return d

@router.post("/")
def create_document(document: CreateDocument):

    new_document = Document(

        title=document.title,
        link=document.link,
        grade=document.grade,
        subjectID=document.subjectID
    )

    db.add(new_document)
    db.commit()
    return {
        "message": "Document created successfully"
    }

@router.put("/{document_id}")
def update_document(document_id: int, document: CreateDocument):

    d = db.query(Document).filter(Document.documentID == document_id).first()
    if not d:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )
    d.title = document.title
    d.link = document.link
    d.grade = document.grade
    d.subjectID = document.subjectID

    db.commit()

    return {
        "message": "Document updated successfully"
    }




@router.delete("/{document_id}")
def delete_document(document_id: int):

    d = db.query(Document).filter(Document.documentID == document_id).first()
    if not d:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    db.delete(d)
    db.commit()
    return {
        "message": "Document deleted successfully"
    }

