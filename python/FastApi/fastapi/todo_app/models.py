from sqlalchemy import Column,INTEGER,String, Boolean
from database import Base

class Todo(Base):
    __tablename__ = "Todo_Table"

    id = Column(INTEGER, primary_key=True, index=True)
    title = Column(String, index = True)
    description = Column(String)
    priority = Column(INTEGER)
    completed = Column(Boolean, default = False)
