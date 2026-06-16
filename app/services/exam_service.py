import json

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

def build_public_exam_payload(exam):
        return{
            "exam_uuid": str(exam.uuid),
            "title": exam.title,
            "questionNumber": exam.question_number,
            "duration": exam.duration,
            "questions": [
                {
                    "questionID": question.question_id,
                    "question_uuid": str(question.uuid),
                    "content": question.content,
                    "questionOptions": [
                        {
                            "questionoptionID": option.question_option_id,
                            "content": option.content
                        }
                        for option in question.question_options
                    ]
                }
                for question in exam.questions
            ]
        }
    
def build_exam_answer_payload(exam):
        answers = {}

        for question in exam.questions:
            correct_option = next(
                (option for option in question.question_options if option.is_correct),
            None
            )
            if correct_option:
                answers[str(question.question_id)] = correct_option.question_option_id

        return {
            "exam_id": exam.exam_id,
            "total_question": exam.question_number,
            "answers": answers
        }

async def get_cached_exam(exam_uuid, db, redis_client):
    cache_key = f"exam:public:{exam_uuid}"

    #cache hit
    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    #cached miss
    exam = (
        db.query(Exam).filter(Exam.uuid == exam_uuid).first
    )
    if not exam:
        raise HTTPException(404, {"code": "EXAM_NOT_FOUND", "message": "Exam not found"})

    payload = build_public_exam_payload(exam)
    await redis_client.set(
            f"exam:public:{exam_uuid}",
            json.dumps(payload),
            ex=3600
        )

    return payload