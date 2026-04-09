from sqlalchemy import Column, INTEGER, String, Boolean, ForeignKey
from database import Base

class User(Base):
    __tablename__ = "user"
    id = Column(INTEGER, primary_key=True, index = True)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)
    is_active = Column(String)
    role = Column(String)
    phone_number = Column(String, unique=True)


class Todo(Base):
    __tablename__ = "todo"

    id = Column(INTEGER, primary_key=True, index=True)
    title = Column(String, index = True)
    description = Column(String)
    priority = Column(INTEGER)
    completed = Column(Boolean, default = False)
    owner_id = Column(ForeignKey("user.id"))
