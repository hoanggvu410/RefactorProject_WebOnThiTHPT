from sqlalchemy.orm import Session
from sqlalchemy import Result, func
from fastapi import HTTPException, status
from typing import Optional

from app.models.exam_model import Exam
from app.models.subject_model import Subject
from app.models.user_model import User
from app.schemas.me_schema import UpdateMeRequest

class MeService:
    def update_profile(self, db: Session, user_id: int, payload: UpdateMeRequest) -> User:
        user = db.query(User).filter(User.id == user_id).first() # Giả định ông đổi sang User.id số
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
            
        db.commit()
        db.refresh(user)
        return user

    def get_history(self, db: Session, user_id: int, subject_id: Optional[int], page: int, limit: int):
        # Thiết lập query cơ bản kết nối chéo bảng bằng ID số
        query = db.query(Result).join(Exam, Result.exam_id == Exam.id)\
                                .join(Subject, Exam.subject_id == Subject.id)\
                                .filter(Result.user_id == user_id)
        
        # Lọc theo môn học nếu có truyền subject_id
        if subject_id:
            query = query.filter(Exam.subject_id == subject_id)
            
        total = query.count()
        
        # Phân trang và sắp xếp bài thi mới nộp lên đầu tiên
        offset = (page - 1) * limit
        results = query.order_by(Result.created_at.desc()).offset(offset).limit(limit).all()
        
        # Map dữ liệu thô sang cấu trúc Schema yêu cầu
        items = []
        for r in results:
            items.append({
                "result_uuid": r.uuid,
                "exam_uuid": r.exam.uuid,
                "exam_title": r.exam.title,
                "subject_name": r.exam.subject.name,
                "score": r.score,
                "correct_count": r.correct_count,
                "total_question": r.total_question,
                "time_spent": r.time_spent,
                "submitted_at": r.created_at # Ăn theo LogSchemaMixin
            })
            
        return {"total": total, "page": page, "limit": limit, "items": items}

    def get_user_statistics(self, db: Session, user_id: int):
        # 1. Tính toán các chỉ số tổng quan (Tổng số đề, Điểm TB, Điểm cao nhất)
        general_stats = db.query(
            func.count(Result.id),
            func.avg(Result.score),
            func.max(Result.score)
        ).filter(Result.user_id == user_id).first()
        
        total_exams = general_stats[0] or 0
        avg_score = round(float(general_stats[1]), 2) if general_stats[1] else 0.0
        best_score = round(float(general_stats[2]), 2) if general_stats[2] else 0.0

        # 2. Tính toán chi tiết hiệu suất theo từng môn học
        subject_query = db.query(
            Subject.id,
            Subject.name,
            func.count(Result.id),
            func.avg(Result.score)
        ).join(Exam, Exam.subject_id == Subject.id)\
         .join(Result, Result.exam_id == Exam.id)\
         .filter(Result.user_id == user_id)\
         .group_by(Subject.id, Subject.name).all()
         
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

me_service = MeService()