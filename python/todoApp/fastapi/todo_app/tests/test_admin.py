from .utils import *
from fastapi import status

def test_read_all(admin_client,db_session):
    response = admin_client.get("/admin/")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [{
        "title": "testtodo",
        "id": 1,
        "description": "This is a test todo",
        "priority": 1,
        "completed": False,
        "owner_id": 1
    }]

def test_read_all_not_admin(user_client):
    response = user_client.get("/admin/")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {"detail": "Not an admin"}

def test_delete(admin_client,db_session):
    response = admin_client.delete("/admin/1")
    todo1 = db_session.query(Todo).filter(Todo.id==1).first()

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert todo1 is None

def test_delete_not_found(admin_client,db_session):
    response = admin_client.delete("/admin/123")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail" : "No id found, can't delete"}
