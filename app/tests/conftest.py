from unittest.mock import MagicMock

from fastapi.testclient import TestClient
import pytest

from main import app

def make_db_with_first_result(first_result):
    db = MagicMock()
    query = db.query.return_value
    filtered_query = query.filter.return_value
    filtered_query.first.return_value = first_result
    return db
    
@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()