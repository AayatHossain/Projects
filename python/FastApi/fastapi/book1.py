from fastapi import FastAPI
app = FastAPI()

books = [
    {"Title":"A", "Author":"AA","Rating":"4.9"},
    {"Title": "B", "Author": "BB", "Rating": "3.9"},
    {"Title": "C", "Author": "CC", "Rating": "2.9"},

]

@app.get("/books")
async def allbooks():
    return books
