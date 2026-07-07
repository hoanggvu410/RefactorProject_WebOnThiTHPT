import os
import uuid

from fastapi import HTTPException, UploadFile
from app.models.document_model import Document

from app.schemas.document_schema import DocumentQueryParams
from app.services.storage_service import upload_public_file
from config import get_settings


def get_documents(params: DocumentQueryParams, db):
    query = db.query(Document).filter(Document.is_deleted.is_(False))

    # filter
    if params.subject_id is not None:
        query = query.filter(Document.subject_id == params.subject_id)
    if params.grade is not None:
        query = query.filter(Document.grade == params.grade)
    # search
    if params.keyword is not None:
        query = query.filter(
            Document.title.ilike(f"%{params.keyword}%")
        )
    # count
    total = query.count()

    # sort
    sort_fields = {
        "uuid": Document.uuid,
        "title": Document.title,
        "subject_id": Document.subject_id,
        "grade": Document.grade,
        "created_at": Document.created_at
    }
    sort_column = sort_fields.get(params.sort_by, Document.uuid)
    if params.sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # pagination
    offset = (params.page - 1) * params.limit
    query = query.offset(offset)
    query = query.limit(params.limit)

    # execute
    items = query.all()

    return {
        "total": total,
        "items": items,
        "page": params.page,
        "limit": params.limit
    }

def upload_document(
    file: UploadFile,
    db,
    title: str,
    grade: int,
    subject_id: int,
    current_user
):
    #validate file
    file_extension = file.filename.split(".")[-1].lower()
    settings = get_settings()
    if file_extension not in settings.DOCUMENT_ALLOWED_EXTENSIONS:
        raise HTTPException(400, {"code": "INVALID_FILE_TYPE", "message": "Invalid file type"})
    if file.content_type not in settings.DOCUMENT_ALLOWED_MIME_TYPES:
        raise HTTPException(400, {"code": "INVALID_FILE_TYPE", "message": "Invalid file type"})
    if file.size is not None and file.size > settings.DOCUMENT_MAX_SIZE:
        raise HTTPException(400, {"code": "FILE_TOO_LARGE", "message": "File size exceeds the maximum limit"})

    #luu vao  supabase storage
    contents = file.file.read()
    if len(contents) > settings.DOCUMENT_MAX_SIZE:
        raise HTTPException(400, {"code": "FILE_TOO_LARGE", "message": "File too large"})
    
    object_path = f"{current_user.user_id}/{uuid.uuid4().hex}.{file_extension}"

    document_url = upload_public_file(
        bucket=settings.supabase_document_bucket,
        object_path=object_path,
        contents=contents,
        content_type=file.content_type
    )

    new_document = Document(
        title=title,
        link=document_url,
        grade=grade,
        subject_id=subject_id,
        created_by=current_user.uuid
    )
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    return new_document
