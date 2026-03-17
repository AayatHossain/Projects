from fastapi import FastAPI, Body
app = FastAPI()

books = [
    {"Title":"A", "Author":"AA","Rating":"3.0", "Category" : "X"},
    {"Title": "B", "Author": "AA", "Rating": "3.0", "Category": "Y"},

    {"Title": "C", "Author": "BB", "Rating": "4.0", "Category" : "Y"},
    {"Title": "D", "Author": "BB", "Rating": "4.0", "Category": "Z"},

    {"Title": "E", "Author": "CC", "Rating": "5.0", "Category" : "Z"},
    {"Title": "F", "Author": "CC", "Rating": "5.0", "Category": "X"},

]

@app.get("/books")
async def allbooks():
    return books

@app.get("/books/title/{dynamic}")
async def single_book(dynamic: str):
    for book in books:
        if book.get("Title").casefold()==dynamic.casefold():
            return book
    return {"No books found"}

@app.get("/books/author/{author}")
async def books_by_author_category(author: str, category: str):
    req_books = []
    for book in books:
        if book.get("Author").casefold() == author.casefold() and \
        book.get("Category").casefold() == category.casefold():
            req_books.append(book)
    return req_books

@app.get("/books/category/")
async def books_by_category(ctg: str):
    req_books = []
    for book in books:
         if book.get("Category").casefold() == ctg.casefold():
                req_books.append(book)
    return req_books


@app.post("/books/create_book")
async def create_book(new_book = Body()):
    books.append(new_book)
    return

@app.put("/books/update_book")
async def update_book(updated_book = Body()):
    for i in range(len(books)):
        if books[i].get("Title") == updated_book.get("Title"):
            books[i] = updated_book
    return

@app.delete("/books/delete_book/{book_title}")
async def delete_book(book_title: str):
    for i in range(len(books)):
        if books[i].get("Title") == book_title:
            books.pop(i)
            break
    return