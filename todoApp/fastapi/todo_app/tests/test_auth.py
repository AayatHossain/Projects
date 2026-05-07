from .utils import *
from ..routers.auth import SECRET_KEY,ALGORITHM
from jose import jwt

def test_login_for_token_success(user_client, db_session):
    response = user_client.post(
        "/auth/token",
        data={"username": "jon", "password": "testpassword"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_for_token_invalid_credentials(user_client, db_session):
    response = user_client.post(
        "/auth/token",
        data={"username": "jon", "password": "abcbcbcbcb"}
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "invalid credentials"

    response = user_client.post(
        "/auth/token",
        data={"username": "adasdasdasads", "password": "testpassword"}
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "invalid credentials"

def test_token_contents(user_client, db_session):
    response = user_client.post(
        "/auth/token",
        data={"username": "jon", "password": "testpassword"}
    )

    token = response.json()["access_token"]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    assert payload.get("sub") == "jon"
    assert payload.get("id") == 1
    assert payload.get("role") == "user"