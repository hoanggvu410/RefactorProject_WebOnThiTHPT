import pytest
from unittest.mock import MagicMock

@pytest.fixture
def mock_db():
    db = MagicMock()
    #gia lap khi goi ham find_user thi tra ve mot dict co dinh
    db.find_user.return_value = {
        "id": 1,
        "username": "abc",
        "role": "admin"
    }
    return db

def make_db_with_first_result(first_result):
    db = MagicMock()
    query = db.query.return_value
    filtered_query = query.filter.return_value
    filtered_query.first.return_value = first_result
    return db
    