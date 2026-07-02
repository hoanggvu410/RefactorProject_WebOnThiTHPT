import os
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import func, update
from fastapi import HTTPException, status
from typing import Optional
from app.services.storage_service import upload_public_file
from config import get_settings

from app.models.exam_model import Exam
from app.models.result_model import Result
from app.models.subject_model import Subject
from app.models.user_model import User
from app.schemas.me_schema import UpdateMeRequest

def update_profile(db: Session, user_id: int, payload: UpdateMeRequest) -> User:
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check trùng email nếu user muốn đổi email mới
    if payload.email and payload.email != user.email:
        email_exists = db.query(User).filter(User.email == payload.email).first()
        if email_exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "AUTH_EMAIL_EXISTS", "message": "Email đã tồn tại"}
            )
        user.email = payload.email

    if payload.name:
        user.name = payload.name

    if payload.grade is not None:
        user.grade = payload.grade
        
    db.commit()
    db.refresh(user)
    return user

def get_history(db: Session, user_id: int, subject_id: Optional[int], page: int, limit: int):
    query = db.query(Result).join(Exam, Result.exam_id == Exam.exam_id)\
                            .join(Subject, Exam.subject_id == Subject.subject_id)\
                            .filter(Result.user_id == user_id)
    
    # Lọc theo môn học nếu có truyền subject_id
    if subject_id:
        query = query.filter(Exam.subject_id == subject_id)
        
    total = query.count()
    
    # Phân trang và sắp xếp bài thi mới nộp lên đầu tiên
    offset = (page - 1) * limit
    results = query.order_by(Result.submitted_at.desc()).offset(offset).limit(limit).all()
    
    # Map dữ liệu thô sang cấu trúc Schema yêu cầu
    items = []
    for r in results:
        items.append({
            "result_uuid": r.uuid,
            "exam_uuid": r.exam.uuid,
            "exam_title": r.exam.title,
            "subject_name": r.exam.subject.subject_name,
            "score": r.score,
            "correct_count": sum(1 for answer in r.user_answers if answer.question_option and answer.question_option.is_correct),
            "total_question": r.exam.question_number,
            "time_spent": r.time_spent,
            "submitted_at": r.submitted_at
        })
        
    return {"total": total, "page": page, "limit": limit, "items": items}

def get_user_statistics(db: Session, user_id: int):
    # 1. Tính toán các chỉ số tổng quan (Tổng số đề, Điểm TB, Điểm cao nhất)
    general_stats = db.query(
        func.count(Result.result_id),
        func.avg(Result.score),
        func.max(Result.score)
    ).filter(Result.user_id == user_id).first()
    
    total_exams = general_stats[0] or 0
    avg_score = round(float(general_stats[1]), 2) if general_stats[1] else 0.0
    best_score = round(float(general_stats[2]), 2) if general_stats[2] else 0.0

    # 2. Tính toán chi tiết hiệu suất theo từng môn học
    subject_query = db.query(
        Subject.subject_id,
        Subject.subject_name,
        func.count(Result.result_id),
        func.avg(Result.score)
    ).join(Exam, Exam.subject_id == Subject.subject_id)\
        .join(Result, Result.exam_id == Exam.exam_id)\
        .filter(Result.user_id == user_id)\
        .group_by(Subject.subject_id, Subject.subject_name).all()
        
    by_subject = []
    for sq in subject_query:
        by_subject.append({
            "subject_id": sq[0],
            "subject_name": sq[1],
            "total_exams": sq[2],
            "avg_score": round(float(sq[3]), 2) if sq[3] else 0.0
        })
        
    return {
        "total_exams": total_exams,
        "avg_score": avg_score,
        "best_score": best_score,
        "by_subject": by_subject
    }

def upload_avatar(file, db, current_user):
    settings = get_settings()
    # Validate anh
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in settings.AVATAR_ALLOWED_EXTENSIONS:
        raise HTTPException(400, {"code": "INVALID_FILE_TYPE", "message": "Invalid file type"})
    if file.content_type not in settings.AVATAR_ALLOWED_MIME_TYPES:
        raise HTTPException(400, {"code": "INVALID_FILE_TYPE", "message": "Invalid file type"})
    if file.size is not None and file.size > settings.AVATAR_MAX_SIZE:
        raise HTTPException(400, {"code": "FILE_TOO_LARGE", "message": "File too large"})

    #luu vao storage
    contents = file.file.read()
    if len(contents) > settings.AVATAR_MAX_SIZE:
        raise HTTPException(400, {"code": "FILE_TOO_LARGE", "message": "File too large"})
    object_path = f"{current_user.user_id}/{uuid.uuid4().hex}.{file_extension}"
    
    # cap nhat duong dan avatar vao db
    avatar_url = upload_public_file(
        bucket=settings.supabase_avatar_bucket,
        object_path=object_path,
        contents=contents,
        content_type=file.content_type,
    )
    db.execute(
        update(User)
        .where(User.user_id == current_user.user_id)
        .values(avatar_url=avatar_url)
    )
    db.commit()
    return {"message": "Avatar uploaded successfully", "avatar_url": avatar_url}

def get_scoreboard(db, user_id: int, subject_id: Optional[int], page:int, limit:int):
    query = db.query(Result).join(Exam, Result.exam_id == Exam.exam_id)\
                            .join(Subject, Exam.subject_id == Subject.subject_id)\
                            .filter(Result.user_id == user_id)
    
    #neu insert subject_id thi loc them subject_id
    if subject_id is not None:
        query = query.filter(Subject.subject_id == subject_id)

    total = query.count()
    offset = (page - 1) * limit
    results = query.order_by(Result.score.desc(), Result.submitted_at.desc()).offset(offset).limit(limit).all()

    items = []
    for index, r in enumerate(results): #enumerate de lay index cua tung phan tu trong list results
        items.append({
            "rank": offset + index + 1,
            "result_uuid": r.uuid,
            "exam_uuid": r.exam.uuid,
            "exam_title": r.exam.title,
            "subject_name": r.exam.subject.subject_name,
            "score": r.score,
            "total_question": r.exam.question_number,
            "time_spent": r.time_spent,
            "submitted_at": r.submitted_at
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items
    }