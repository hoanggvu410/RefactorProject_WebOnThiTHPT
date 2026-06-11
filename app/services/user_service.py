from app.models.user_model import User


def get_users(params, db):
    query = db.query(User)

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