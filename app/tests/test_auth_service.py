
from types import SimpleNamespace

from fastapi import HTTPException
import pytest
from redis import auth

from app.services import auth_service
from app.tests.conftest import make_db_with_first_result

def test_hash_password():
    plain_password = "123456"
    hashed_password = auth_service.hash_password(plain_password)
    assert hashed_password != plain_password

def test_verify_password_return_true():
    plain_password = "123456"
    hashed_password = auth_service.hash_password(plain_password)

    result = auth_service.verify_password(plain_password, hashed_password)

    assert result is True

def test_verify_password_return_false():
    plain_password = "123456"
    hashed_password = auth_service.hash_password(plain_password)

    result = auth_service.verify_password("wrong password", hashed_password)

    assert result is False

def verify_hashed_token():
    token = "my-refresh-token"

    hash_1 = auth_service.hash_token(token)
    hash_2 = auth_service.hash_token(token)

    #cung 1 token phai hash ra cung 1 kqua va khong dc giong token goc
    assert hash_1 == hash_2
    assert hash_1 != token


def test_decode_access_token_success():
    data = {
        "sub": "student1",
        "role": "student",
        "id": 1,
    }

    token = auth_service.create_access_token(data)
    payload = auth_service.decode_access_token(token)

    #kiem tra data dua vao co duoc decode dung kh
    assert payload["sub"] == "student1"
    assert payload["role"] == "user"
    assert payload["id"] == 1
    assert "exp" in payload
    assert "iat" in payload
    assert "jti" in payload

def test_decode_refresh_token_success():
    data = {
        "sub": "student"
    }
    token = auth_service.create_refresh_token(data)
    payload = auth_service.jwt.decode(
        token,
        auth_service.settings.refresh_secret_key,
        algorithms=auth_service.settings.algorithm,
    )
    assert payload["sub"] == "student"
    assert "exp" in payload

def test_decode_token_with_invalid_token():
    invalid_token = "invalid token"
    with pytest.raises(HTTPException) as exc_info:
        auth_service.decode_access_token(invalid_token)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["code"] == "INVALID_TOKEN"

def test_register_with_existed_user():
    existing_user = SimpleNamespace(username="student01")
    db = make_db_with_first_result(existing_user)

    data = SimpleNamespace(
        name= "Student",
        username="student01",
        password="123456",
        email = "student01@gmail.com",
        grade =12,
    )
    with pytest.raises(HTTPException) as exc_info:
        auth_service.register(db, data)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "USER_ALREADY_EXISTS"
    db.add.assert_not_called()
    db.commit.asser_not_call()

def test_register_success():
    db = make_db_with_first_result(None) #chua co user nao trung voi user

    data = SimpleNamespace(
        name= "Student01",
        username="student01",
        password="123456",
        email = "student01@gmail.com",
        grade =11,
    )
    result = auth_service.register(db, data)

    assert result == {"message": "user created successfully"}
    db.add.assert_called_once()
    db.commit.asset_called_once()

def test_login_with_user_not_found():
    db = make_db_with_first_result(None)
    data = SimpleNamespace(
        username = "student01",
        password="123456",
    )

    with pytest.raises(HTTPException) as exc_info:
        auth_service.login(db, data)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["code"] == "USER_NOT_FOUND"

def test_login_with_wrong_password():
    fake_user = SimpleNamespace(
        username = "student1",
        password = "hashed password",
    )
    db = make_db_with_first_result(fake_user)

    data = SimpleNamespace(
        username = "student01",
        password="hashed-password",
    )

    with pytest.raises(HTTPException) as exc_info:
        auth_service.login(db, data)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["code"] == "INCORRECT"

def test_login_success():
    db = make_db_with_first_result(None)
    data = SimpleNamespace(
        username = "student01",
        password="123456",
    )
