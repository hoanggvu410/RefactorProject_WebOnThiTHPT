
from fastapi import HTTPException
from sqlalchemy import or_

from app.models.question_model import Question
from app.models.question_option_model import QuestionOption
from app.models.subject_model import Subject
from app.models.user_model import User
from app.schemas.question_schema import QuestionQueryParams


def get_questions(params: QuestionQueryParams, db):
    query = db.query(Question)

    # filter
    if params.subject_id is not None:
        query = query.filter(Question.subject_id == params.subject_id)
    if params.grade is not None:
        query = query.filter(Question.grade == params.grade)
    # search
    if params.keyword is not None:
        query = query.filter(
            or_(
                Question.content.ilike(f"%{params.keyword}%"),
                Question.question_options.content.ilike(f"%{params.keyword}%")
            )
        )
    # count
    total = query.count()

    # sort
    sort_fields = {
        "uuid": Question.uuid,
        "subject_id": Question.subject_id,
        "grade": Question.grade
    }
    sort_column = sort_fields.get(params.sort_by, Question.uuid)
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

def get_creator_uuid(db, current_user):
    if getattr(current_user, "uuid", None):
        return current_user.uuid

    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(404, {"code": "USER_NOT_FOUND", "message": "User not found"})
    return user.uuid

def create_question(question_data, db, current_user, commit : bool = True):
    subject = db.query(Subject).filter(Subject.subject_id == question_data.subject_id).first()
    if not subject:
        raise HTTPException(404, {"code": "SUBJECT_NOT_FOUND", "message": "Subject not found"})
    question = Question(
        content=question_data.content,
        grade=question_data.grade,
        subject_id=question_data.subject_id,
        explanation=question_data.explanation,
        created_by=get_creator_uuid(db, current_user),
    )

    try:
        db.add(question)
        db.flush()
        for option in question_data.QuestionOptions:
            db.add(QuestionOption(
                question_id=question.question_id,
                content=option.content,
                is_correct=option.is_correct,
            ))

        db.flush()

        if commit:
            db.commit()
            db.refresh(question)

        return question

    except Exception:
        if commit:
            db.rollback()
        raise 