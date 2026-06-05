from app.models.news_model import News


def get_news(params, db):
    query = db.query(News)

    # filter
    if params.subject_id is not None:
        query = query.filter(News.subject_id == params.subject_id)
    if params.grade is not None:
        query = query.filter(News.grade == params.grade)
    # search
    if params.keyword is not None:
        query = query.filter(
            News.title.ilike(f"%{params.keyword}%")
        )
    # count
    total = query.count()

    # sort
    sort_fields = {
        "uuid": News.uuid,
        "subject_id": News.subject_id,
        "grade": News.grade,
        "published_at": News.published_at
    }
    sort_column = sort_fields.get(params.sort_by, News.uuid)
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