import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from ..main import app
from ..routers.todo import get_db
from ..routers.admin import get_db as get_db_admin
from ..routers.user import get_db as get_db_user
from ..routers.auth import get_db as get_db_auth
from ..routers.auth import get_current_user, bcrypt_context
from ..routers.auth import get_current_user
from ..database import Base
from ..models import Todo,User

SQLALCHEMY_DATABASE_URL  = "sqlite:///./test_db.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL , connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_current_user(role = "user"):
    return {
        "username": "jon",
        "user_id": 1,
        "user_role": role
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

    user = User(
        email="jon@gmail.com",
        username="jon",
        hashed_password=bcrypt_context.hash("testpassword"),
        role="user",
        phone_number="123456789",
        is_active = True
    )

    session.add(todo)
    session.add(user)
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def user_client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_db_user] = override_get_db
    app.dependency_overrides[get_db_auth] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: override_get_current_user("user")

    client1 = TestClient(app)
    try:
        yield client1
    finally:
        app.dependency_overrides = {}

@pytest.fixture
def admin_client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db_admin] = override_get_db
    app.dependency_overrides[get_db_auth] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: override_get_current_user("admin")

    client1 = TestClient(app)
    try:
        yield client1
    finally:
        app.dependency_overrides = {}