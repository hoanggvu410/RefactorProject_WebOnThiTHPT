from sqlalchemy import func

from app.models.exam_model import Exam
from app.models.question_model import Question
from app.models.result_model import Result
from app.models.user_model import User


def get_users(params, db):
    query = db.query(User).filter(User.is_deleted.is_(False))

    # filter
    if params.username is not None:
        query = query.filter(User.username.ilike(f"%{params.username}%"))
    if params.grade is not None:
        query = query.filter(User.grade == params.grade)
    if params.is_active is not None:
        query = query.filter(User.is_active == params.is_active)
    # search
    if params.keyword is not None:
        query = query.filter(User.username.ilike(f"%{params.keyword}%"))
    # count
    total = query.count()

    # sort
    sort_fields = {
        "user_id": User.user_id,
        "username": User.username,
        "grade": User.grade,
        "is_active": User.is_active
    }
    sort_column = sort_fields.get(params.sort_by, User.user_id)
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
        "page": params.page
    }

def get_admin_stats(db):
    total_users = db.query(func.count(User.user_id)).filter(User.is_deleted.is_(False)).scalar() or 0
    total_students = db.query(func.count(User.user_id)).filter(User.is_deleted.is_(False), User.role == "student").scalar() or 0
    total_teachers = db.query(func.count(User.user_id)).filter(User.is_deleted.is_(False), User.role == "giáo viên").scalar() or 0
    total_exams = db.query(func.count(Exam.exam_id)).filter(Exam.is_deleted.is_(False)).scalar() or 0
    total_questions = db.query(func.count(Question.question_id)).filter(Question.is_deleted.is_(False)).scalar() or 0
    total_submissions = db.query(func.count(Result.result_id)).scalar() or 0
    avg_score = db.query(func.avg(Result.score)).scalar()

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_exams": total_exams,
        "total_questions": total_questions,
        "total_submissions": total_submissions,
        "avg_score_all_time": round(float(avg_score), 2) if avg_score is not None else 0.0
    }

def update_user_active_status(user_uuid, payload, db):
    user = db.query(User).filter(
        User.uuid == user_uuid,
        User.is_deleted.is_(False),
    ).first()
    if not user:
        return None
    if user.role == "admin":
        return "protected_admin"

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user
