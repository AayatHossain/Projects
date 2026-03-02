from fastapi import FastAPI
app = FastAPI()

@app.get("/book1")
async def msg():
    return {"message":"hello world"}
