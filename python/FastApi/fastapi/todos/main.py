from databse import engine
from fastapi import FastAPI
import models
app = FastAPI()
models.Base.metadata.create_all(bind = engine)
