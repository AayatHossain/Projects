from starlette import status
from starlette.status import HTTP_201_CREATED
from ..models import Todo
from .utils import *

def test_read_all(client):
    response = client.get("/todo")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [
        {"title":"testtodo",
         "id" : 1,
        "description" : "This is a test todo",
        "priority" : 1,
        "completed" : False,
        "owner_id" : 1
         }
    ]


def test_read_one_successful(client):
    response = client.get("/todo/1")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
         "title": "testtodo",
         "id": 1,
         "description": "This is a test todo",
         "priority": 1,
         "completed": False,
         "owner_id": 1
         }

def test_read_one_failed(client):
    response = client.get("/todo/100")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
            "detail":"Todo not found"
         }

def test_create_successful(client,db_session):
    req_body = {
        "title": "newtodo",
        "description": "This is a new todo",
        "priority": 4,
        "completed": True
    }
    response = client.post("/todo/", json = req_body)

    assert response.status_code == HTTP_201_CREATED
    todo = db_session.query(Todo).filter(Todo.id == 2).first()
    assert todo.title==req_body["title"]
    assert todo.description==req_body["description"]
    assert todo.priority==req_body["priority"]
    assert todo.completed==req_body["completed"]

def test_update_successful(client, db_session):
    req_body = {
        "title": "updatedTodo",
        "description": "This is an updated todo",
        "priority": 3,
        "completed": False
    }
    response = client.put("/todo/1", json = req_body)
    todo = db_session.query(Todo).filter(Todo.id==1).first()
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert todo.title == req_body.get("title")
    assert todo.description == req_body.get("description")
    assert todo.priority == req_body.get("priority")
    assert todo.completed == req_body.get("completed")

def test_update_failed(client, db_session):
    req_body = {
        "title": "updatedTodo",
        "description": "This is an updated todo",
        "priority": 3,
        "completed": False
    }
    response = client.put("/todo/100", json = req_body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail" : "No id found"}

def test_delete_successful(client, db_session):
    response = client.delete("/todo/1")
    todo = db_session.query(Todo).filter(Todo.id==1).first()
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert todo is None

def test_delete_failed(client, db_session):
    response = client.delete("/todo/100")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail" : "No id found, can't delete"}
