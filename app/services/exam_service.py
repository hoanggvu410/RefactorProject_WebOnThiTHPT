from sqlalchemy import or_

from app.models.exam_model import Exam
from app.schemas.exam_schema import ExamQueryParams


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
        "subject_id": Exam.subject_id,
        "grade": Exam.grade
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
        "page": params.page
    }