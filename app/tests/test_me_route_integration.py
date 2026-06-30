from types import SimpleNamespace
from typing import override
from uuid import UUID

from main import app
from app.dependencies.auth_dependency import get_current_user


def tets_get_me_success(client):
    fake_user = SimpleNamespace(
        user_id =1,
        uuid = UUID("11111111-1111-1111-1111-111111111111"),
        username="student01",
        name="Student",
        email="student01@gmail.com",
        role="user",
        grade=12,
        avatar_url=None,
        email_verified=True,
    )
    def override_current_user():
        return fake_user
    
    app.dependency_overrides[get_current_user] = override_current_user

    response = client.get("/v1/me/")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["username"]== "student01"