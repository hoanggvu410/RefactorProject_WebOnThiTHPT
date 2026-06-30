from unittest.mock import MagicMock

def make_db_with_first_result(first_result):
    db = MagicMock()
    query = db.query.return_value
    filtered_query = query.filter.return_value
    filtered_query.first.return_value = first_result
    return db
    