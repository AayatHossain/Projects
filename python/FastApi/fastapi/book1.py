from fastapi import FastAPI
app = FastAPI()

books = [
    {"Title":"A", "Author":"AA","Rating":"3.0"},
    {"Title": "B", "Author": "BB", "Rating": "4.0"},
    {"Title": "C", "Author": "CC", "Rating": "5.0"},

]

@app.get("/books")
async def allbooks():
    return books

@app.get("/books/{dynamic}")
async def single_book(dynamic: str):
    for book in books:
        if book.get("Title").casefold()==dynamic.casefold():
            return book
    return {"No books found"}