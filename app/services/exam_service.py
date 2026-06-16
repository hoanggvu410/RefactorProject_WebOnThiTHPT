from fastapi import HTTPException
from sqlalchemy import or_

from app.models.exam_model import Exam
from app.models.subject_model import Subject
from app.routes.question_routes import create_question
from app.schemas.exam_schema import ExamQueryParams
from app.schemas.question_schema import CreateQuestion
from app.services.question_service import get_creator_uuid


def get_exams(params: ExamQueryParams, db):
    query = db.query(Exam)

    #filter
    if params.subject_id is not None:
        query = query.filter(Exam.subject_id == params.subject_id)
    if params.grade is not None:
        query = query.filter(Exam.grade == params.grade)

    #search
    if params.keyword is not None:
        query = query.filter(
            Exam.title.ilike(f"%{params.keyword}%")
        )

    #count
    total = query.count()

    #sort
    sort_fields = {
        "uuid": Exam.uuid,
        "title": Exam.title,
        "subject_id": Exam.subject_id,
        "grade": Exam.grade,
        "question_number": Exam.question_number,
        "duration": Exam.duration,
    }
    sort_column = sort_fields.get(params.sort_by, Exam.uuid)
    if params.sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    #pagination
    offset = (params.page - 1) * params.limit
    query = query.offset(offset)
    query = query.limit(params.limit)

    items = query.all()

    return {
        "total": total,
        "items": items,
        "page": params.page,
        "limit": params.limit
    }

def create_exam(exam_data, db, current_user):
    subject = db.query(Subject).filter(Subject.subject_id == exam_data.subject_id).first()
    if not subject:
        raise HTTPException(404, {"code": "SUBJECT_NOT_FOUND", "message": "Subject not found"})

    exam = Exam(
        title=exam_data.title,
        subject_id=exam_data.subject_id,
        grade=exam_data.grade,
        duration=exam_data.duration,
        question_number=len(exam_data.questions),
        created_by=get_creator_uuid(db, current_user)
    )

    try:
        db.add(exam)
        db.flush()

        for question_data in exam_data.questions:
            create_question_data = CreateQuestion(
                content=question_data.content,
                grade=exam_data.grade,
                subject_id=exam_data.subject_id,
                explanation=question_data.explanation,
                questionOptions=question_data.questionOptions
            )
            question = create_question(create_question_data, db, current_user=current_user, commit=False)
            exam.questions.append(question)

        db.commit()
        db.refresh(exam)
        return {
        "exam_uuid": exam.uuid,
        "title": exam.title,
        "questionNumber": exam.question_number,
        "duration": exam.duration,
        "questions": exam.questions
    }
    except Exception:
        db.rollback()
        raise