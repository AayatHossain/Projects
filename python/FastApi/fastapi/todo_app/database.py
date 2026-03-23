from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine

URL = "sqlite:///./todo.db"
engine = create_engine(URL, connect_args = {"check_same_thread" : False})
Base = declarative_base()
Sessionlocal = sessionmaker(autoflush=False, autocommit=False,bind=engine)



