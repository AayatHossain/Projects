import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from starlette import status
from starlette.status import HTTP_201_CREATED

from ..main import app
from ..routers.todo import get_db
from ..routers.auth import get_current_user
from ..database import Base
from ..models import Todo

SQLALCHEMY_DATABASE_URL  = "sqlite:///./test_db.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL , connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_current_user():
    return {
        "username": "jon",
        "user_id": 1,
        "user_role": "user"
    }

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    todo = Todo(
        title="testtodo",
        description="This is a test todo",
        priority=1,
        completed=False,
        owner_id=1
    )
    session.add(todo)
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    client1 = TestClient(app)
    try:
        yield client1
    finally:
        app.dependency_overrides = {}


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
        "completed": True,
        "owner_id": 5
    }
    response = client.post("/todo/", json = req_body)

    assert response.status_code == HTTP_201_CREATED
    todo = db_session.query(Todo).filter(Todo.title == "newtodo").first()
    assert todo.title==req_body["title"]
    assert todo.description==req_body["description"]
    assert todo.priority==req_body["priority"]
    assert todo.completed==req_body["completed"]

