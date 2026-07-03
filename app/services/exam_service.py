import csv
import io
import json

from fastapi import HTTPException
from sqlalchemy import or_

from app.models.exam_model import Exam
from app.models.subject_model import Subject
from app.routes.question_routes import create_question
from app.schemas.exam_schema import CreateExam, ExamQueryParams
from app.schemas.question_option_schema import CreateQuestionOption
from app.schemas.question_schema import CreateQuestion, CreateQuestionForExam
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
                QuestionOptions=question_data.QuestionOptions
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

def update_exam(exam_uuid, exam_data, db):
    exam = db.query(Exam).filter(Exam.uuid == exam_uuid).first()
    if not exam:
        raise HTTPException(404, {"code": "EXAM_NOT_FOUND", "message": "Exam not found"})

    update_data = exam_data.model_dump(exclude_unset=True)

    if "subject_id" in update_data:
        subject = db.query(Subject).filter(Subject.subject_id == update_data["subject_id"]).first()
        if not subject:
            raise HTTPException(404, {"code": "SUBJECT_NOT_FOUND", "message": "Subject not found"})

    for field, value in update_data.items():
        setattr(exam, field, value)

    db.commit()
    db.refresh(exam)
    return {"message": "Exam updated successfully"}

def delete_exam(exam_uuid, db):
    exam = db.query(Exam).filter(Exam.uuid == exam_uuid).first()
    if not exam:
        raise HTTPException(404, {"code": "EXAM_NOT_FOUND", "message": "Exam not found"})

    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}

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

async def get_public_exam_cached(exam_uuid, db, redis_client):
    cache_key = f"exam:public:{exam_uuid}"

    #cache hit
    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    #cached miss
    exam = (
        db.query(Exam).filter(Exam.uuid == exam_uuid).first()
    )
    if not exam:
        raise HTTPException(404, {"code": "EXAM_NOT_FOUND", "message": "Exam not found"})

    payload = build_public_exam_payload(exam)
    await redis_client.set(
            f"exam:public:{exam_uuid}",
            json.dumps(payload),
            ex=3600 #1h
        )

    return payload

async def get_exam_answers_cached(exam_uuid, db, redis_client):
    cache_key = f"exam:anwers:{exam_uuid}"
    cached = await redis_client.get(cache_key)

    #cache hit
    if cached:
        return json.loads(cached)
    
    #cache miss
    exam = db.query(Exam).filter(Exam.uuid == exam_uuid).first()

    if not exam:
        raise HTTPException(404, {
            "code": "EXAM_NOT_FOUND",
            "message": "Exam not found"
        })
    payload = build_exam_answer_payload(exam)

    await redis_client.set(
        cache_key,
        json.dumps(payload),
        ex = 3600 
    )
    return payload

CSV_REQUIRED_COLUMNS = {
    "title",
    "subject_id",
    "grade",
    "duration",
    "question_content",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct_option",
}

OPTION_COLUMNS = {
    "A": "option_a",
    "B": "option_b",
    "C": "option_c",
    "D": "option_d",
}

async def import_exam_csv(file, db, current_user):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, {
            "code": "INVALID_FILE_TYPE",
            "message": "Chi upload file CSV"
        })
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(400, {"code": "INVALID_CSV_ENCODING", "message": "CSV phải dùng UTF-8"})

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(400, {"code": "INVALID_CSV_FORMAT", "message": "CSV thiếu header"})

    missing = CSV_REQUIRED_COLUMNS - set(reader.fieldnames)
    if missing:
        raise HTTPException(400, {
            "code": "INVALID_CSV_FORMAT",
            "message": f"CSV thiếu cột: {', '.join(sorted(missing))}"
        })

    rows = list(reader)
    if not rows:
        raise HTTPException(400, {"code": "INVALID_CSV_FORMAT", "message": "CSV chưa có câu hỏi"})

    first = rows[0]
    title = first["title"].strip()
    subject_id = int(first["subject_id"])
    grade = int(first["grade"])
    duration = int(first["duration"])

    questions = []

    for index, row in enumerate(rows, start=2):
        if row["title"].strip() != title:
            raise HTTPException(400, {"code": "INVALID_CSV_FORMAT", "message": f"Dòng {index}: title không khớp"})

        correct = row["correct_option"].strip().upper()
        if correct not in OPTION_COLUMNS:
            raise HTTPException(400, {"code": "INVALID_CSV_FORMAT", "message": f"Dòng {index}: correct_option không hợp lệ"})

        options = []
        for key, column in OPTION_COLUMNS.items():
            content = (row.get(column) or "").strip()
            if content:
                options.append(CreateQuestionOption(
                    content=content,
                    is_correct=(key == correct)
                ))

        if len(options) < 2:
            raise HTTPException(400, {"code": "INVALID_CSV_FORMAT", "message": f"Dòng {index}: cần ít nhất 2 đáp án"})

        if not any(option.is_correct for option in options):
            raise HTTPException(400, {"code": "INVALID_CSV_FORMAT", "message": f"Dòng {index}: đáp án đúng bị trống"})

        questions.append(CreateQuestionForExam(
            content=row["question_content"].strip(),
            explanation=(row.get("explanation") or "").strip() or None,
            QuestionOptions=options
        ))

    exam_data = CreateExam(
        title=title,
        subject_id=subject_id,
        grade=grade,
        duration=duration,
        questions=questions
    )

    exam = create_exam(exam_data, db, current_user)

    return {
        "message": "Import đề thi thành công",
        "exam_uuid": exam["exam_uuid"],
        "title": exam["title"],
        "question_number": exam["questionNumber"]
    }
