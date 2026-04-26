from fastapi import status
from .utils import *
from ..routers.auth import bcrypt_context

def test_get_user(user_client, db_session):
    response = user_client.get("/user/")
    assert response.status_code == status.HTTP_200_OK
    info = response.json()
    assert info["email"] == "jon@gmail.com"
    assert info["username"] == "jon"
    assert info["role"] == "user"
    assert info["phone_number"] == "123456789"
    assert info["id"] == 1

def test_change_pass(user_client, db_session):
    response = user_client.put("/user/", params = {"new_password" : "test12345"})
    user1 = db_session.query(User).filter(User.id==1).first()
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert bcrypt_context.verify("test12345", user1.hashed_password)

def test_change_phone(user_client, db_session):
    response = user_client.put("/user/change_phone_number",
                               params = {"phone": "01010101"})
    user1 = db_session.query(User).filter(User.id==1).first()
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert user1.phone_number == "01010101"


