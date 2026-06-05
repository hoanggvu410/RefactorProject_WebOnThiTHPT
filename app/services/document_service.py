from xml.dom.minidom import Document

from app.schemas.document_schema import DocumentQueryParams


def get_documents(params: DocumentQueryParams, db):
    query = db.query(Document)

    # filter
    if params.subject_id is not None:
        query = query.filter(Document.subject_id == params.subject_id)
    if params.grade is not None:
        query = query.filter(Document.grade == params.grade)
    # search
    if params.keyword is not None:
        query = query.filter(
            Document.title.ilike(f"%{params.keyword}%")
        )
    # count
    total = query.count()

    # sort
    sort_fields = {
        "uuid": Document.uuid,
        "subject_id": Document.subject_id,
        "grade": Document.grade,
        "created_at": Document.created_at
    }
    sort_column = sort_fields.get(params.sort_by, Document.uuid)
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