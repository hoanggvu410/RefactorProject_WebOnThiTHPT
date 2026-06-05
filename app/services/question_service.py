
from sqlalchemy import or_

from app.models.question_model import Question
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
                Question.question_options.ilike(f"%{params.keyword}%")
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