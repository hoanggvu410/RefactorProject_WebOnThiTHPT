from types import SimpleNamespace
from uuid import uuid4

from fastapi import HTTPException
import pytest

from app.routes import user_routes
from app.schemas.user_schema import UpdateUserActiveStatus
from app.tests.conftest import make_db_with_first_result


def test_update_admin_user_is_forbidden():
    admin = SimpleNamespace(role="admin")
    db = make_db_with_first_result(admin)
    payload = SimpleNamespace(
        name="Admin",
        username="admin",
        password="123456",
        email="admin@example.com",
        grade=12,
    )

    with pytest.raises(HTTPException) as exc_info:
        user_routes.update_user(uuid4(), payload, db)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == "ADMIN_USER_PROTECTED"
    db.commit.assert_not_called()


def test_toggle_admin_active_is_forbidden():
    admin = SimpleNamespace(role="admin", is_active=True)
    db = make_db_with_first_result(admin)
    payload = UpdateUserActiveStatus(is_active=False)

    with pytest.raises(HTTPException) as exc_info:
        user_routes.update_user_active_status(uuid4(), payload, db)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == "ADMIN_USER_PROTECTED"
    db.commit.assert_not_called()


def test_delete_admin_user_is_forbidden():
    admin = SimpleNamespace(role="admin", is_deleted=False, is_active=True)
    db = make_db_with_first_result(admin)

    with pytest.raises(HTTPException) as exc_info:
        user_routes.delete_user(uuid4(), db)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == "ADMIN_USER_PROTECTED"
    db.commit.assert_not_called()


def test_delete_regular_user_soft_deletes():
    user = SimpleNamespace(role="student", is_deleted=False, is_active=True)
    db = make_db_with_first_result(user)

    result = user_routes.delete_user(uuid4(), db)

    assert result == {"message": "User deleted successfully"}
    assert user.is_deleted is True
    assert user.is_active is False
    db.delete.assert_not_called()
    db.commit.assert_called_once()
