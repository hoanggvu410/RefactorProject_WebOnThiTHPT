from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
import pytest
from main import app

#test api login
def test_login_api_success(client):
    mock_result = {
        "message": "Login successfully",
        "access_token": "access-token",
        "refresh_token": "refresh-token",
    }
    
    with patch("app.routes.auth_routes.auth_service.login", return_value = mock_result):
        response = client.post("/auth/login", json ={
            "username": "student01",
            "password": "123456",
        })

    assert response.status_code == 200
    assert response.json()["message"]== "Login successfully"
    assert response.json()["access_token"] == "access-token"

def test_login_api_invalid_password_schema(client):
    response = client.post("/auth/login", json={
        "username": "student01",
        "password": "123",
    })

    assert response.status_code == 422

@pytest.mark.parametrize(
    "status_code, error_code",
    [
        (404, "USER_NOT_FOUND"),
        (401, "INCORRECT_PASSWORD"),
    ],
)
def test_login_api_server_error(status_code, error_code, client):
    exception = HTTPException(status_code, {
        "code": error_code,
        "message": "error message",
    })

    with patch("app.routes.auth_routes.auth_service.login", side_effect =  exception):
        response = client.post("/auth/login", json = {
            "username": "student01",
            "password": "123456",
        })
    
    assert response.status_code == status_code
    assert response.json() == {
        "success": False,
        "error": {
            "code": error_code,
            "message": "error message",
        }
    }