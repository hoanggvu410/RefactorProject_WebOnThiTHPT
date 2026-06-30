from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch, AsyncMock

from fastapi import HTTPException
import pytest
from redis import credentials

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

def test_hash_token():
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
    assert payload["role"] == "student"
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
    db.commit.assert_not_called()

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
    db.commit.assert_called_once()

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
    user = SimpleNamespace(
        username = "student01",
        password = "hashed password",
    )
    db = make_db_with_first_result(user) #gia lap 1 user trong db

    input_data = SimpleNamespace(
        username = "student01",
        password="wrong-password",
    )

    with patch("app.services.auth_service.verify_password", return_value = False): #gia lap ham
        with pytest.raises(HTTPException) as exc_info:
            auth_service.login(db, input_data)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["code"] == "INCORRECT_PASSWORD"

def test_login_success():
    user = SimpleNamespace(
      username = "student01",
        password="hashed-password",
    )
    db = make_db_with_first_result(user)

    input_data = SimpleNamespace(
        username = "student01",
        password="correct-password",
    )

    tokens = {
        "access token": "access token",
        "refresh token": "refresh token",
    }

    with patch("app.services.auth_service.verify_password", return_value = True): #gia lap ham
        with patch("app.services.auth_service.create_token", return_value = tokens):
            result = auth_service.login(db, input_data)

    assert result == {
        "message": "Login successfully",
        "access token": "access token",
        "refresh token": "refresh token",
    }

#change password
def test_change_password_with_wrong_current_password():
    user = SimpleNamespace(
        user_id = 1,
        password = "hashed password",
    )
    db = make_db_with_first_result(user)

    current_user = SimpleNamespace(
        user_id = 1,
    )

    input_data = SimpleNamespace(
        current_password = "wrong password",
        new_password = "new password",
    )
    with patch("app.services.auth_service.verify_password", return_value = False):
        with pytest.raises(HTTPException) as exc_info:
            auth_service.change_password(db, current_user, input_data)
    
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["code"] == "INCORRECT_CURRENT_PASSWORD"
    db.commit.assert_not_called()

def test_change_password_success():
    user = SimpleNamespace(
        user_id = 1,
        password = "hashed password",
    )
    db = make_db_with_first_result(user)

    current_user = SimpleNamespace(
        user_id = 1,
    )

    input_data = SimpleNamespace(
        current_password = "current password",
        new_password = "new password",
    )

    with patch("app.services.auth_service.verify_password", return_value = True):
        with patch("app.services.auth_service.hash_password", return_value = "new_hashed_password"):
            result = auth_service.change_password(db, current_user, input_data)

    assert result == {"message": "Password changed successfully"}
    assert user.password == "new_hashed_password"
    db.commit.assert_called_once()

#refresh access token (parametrize)
#INVALID refresh token
#refresh token revoked
#refresh token expired
@pytest.mark.parametrize(
    "token_record, expected_code",
    [
        (
            None,
            "INVALID_REFRESH_TOKEN"
        ),
        (
            SimpleNamespace(
                is_revoked = True,
                expires_at = datetime.utcnow() + timedelta(days = 1) ,
            ),
            "REFRESH_TOKEN_REVOKED",
        ),
        (
            SimpleNamespace(
                is_revoked= False,
                expires_at = datetime.utcnow() - timedelta(days=1),
            ),
            "REFRESH_TOKEN_EXPIRED",
        ),
    ],
)
def test_refresh_access_token_error(token_record, expected_code):
    db =make_db_with_first_result(token_record)
    data = SimpleNamespace(refresh_token = "refresh_token")

    with pytest.raises(HTTPException) as exc_info:
        auth_service.refresh_access_token(db, data)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["code"] == expected_code

def test_refresh_access_token_success():
    user = SimpleNamespace(
        username = "student01",
        role="student",
        user_id= 1,
        uuid ="user-uuid",
    )

    token_record = SimpleNamespace(
        is_revoked = False,
        expires_at = datetime.utcnow() + timedelta(days = 1),
        user = user,
    )
    db = make_db_with_first_result(token_record)
    data = SimpleNamespace(
        refresh_token = "valid-refresh-token"
    )
    
    with patch("app.services.auth_service.create_access_token", return_value = "new-access-token"):
        result = auth_service.refresh_access_token(db, data)

    assert result == {
        "access_token": "new-access-token",
        "token_type": "bearer",
    }

#logout (parametrize async)
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "token_record, expected_code",
    [
        (
            None,
            "INVALID_REFRESH_TOKEN",
        ),
        (
            SimpleNamespace(
                is_revoked=True
            ),
            "REFRESH_TOKEN_REVOKED"
        ),
    ],
)
async def test_logout_error(token_record, expected_code):
    db = make_db_with_first_result(token_record)

    data = SimpleNamespace(refresh_token = "refresh-token")
    credentials = SimpleNamespace(credentials = "credentials from fake access token")
    redis_client = AsyncMock()

    payload ={
        "jti" : "access-token-jti",
        "exp" : int((datetime.utcnow() + timedelta(minutes=15)).timestamp()), 
    }

    with patch("app.services.auth_service.decode_access_token", return_value = payload):
        with patch ("app.services.auth_service.add_to_blacklist", new_callable= AsyncMock):
            with pytest.raises(HTTPException) as exc_info:
                await auth_service.logout(data, credentials, redis_client, db)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["code"] == expected_code
    db.commit.assert_not_called()

@pytest.mark.asyncio
async def test_logout_success():
    token_record = SimpleNamespace(is_revoked = False)
    db = make_db_with_first_result(token_record)
    data = SimpleNamespace(refresh_token = "valid-refresh-token")
    credentials = SimpleNamespace(credentials= "credentials from fake access token")
    redis_client = AsyncMock()

    payload = {
        "jti":"access-token-jti",
        "exp" : int((datetime.utcnow() + timedelta(minutes=15)).timestamp()), 
    }

    with patch("app.services.auth_service.decode_access_token", return_value= payload):
        with patch("app.services.auth_service.add_to_blacklist", callable = AsyncMock) as mock_blacklist:
            result = await auth_service.logout(data, credentials, redis_client, db)
    
    assert result =={"message": "Logout successfully"}
    assert token_record.is_revoked is True
    db.commit.assert_called_once()
    mock_blacklist.assert_awaited_once()