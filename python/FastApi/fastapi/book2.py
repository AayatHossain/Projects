from typing import Optional

from fastapi import  FastAPI, Path, Query, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

class Book:
    id : int
    title : str
    author : str
    category : str
    rating : int

    def __init__(self,id,title,author,category,rating):
        self.id =id
        self.title = title
        self.author = author
        self.category = category
        self.rating = rating


class Bookrequest(BaseModel):
    id: Optional[int] = Field(default=None, description="ID is optional")
    title: str = Field(min_length=3)
    author: str = Field(min_length=3)
    category: str
    rating: int = Field(gt=-1, lt=11)

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 4,
                "title": "A",
                "author": "Aayat",
                "category": "Chemistry",
                "rating": 10
            }
        }
    }


Books = [
    Book(1,"A","Aayat","Chemistry",5),
    Book(2,"B","Omar","Biology",4),
    Book(3,"C","Tasin","Physics",2),
    Book(4,"D","Kayes","Math",2),
    Book(5,"E","Aoyon","Bangla",2)
]

@app.get("/books", status_code = 200)
async def get_all_books():
    return Books

@app.post("/books",status_code=201)
async def create_book(bookrequest: Bookrequest):
    newbook = Book(**bookrequest.model_dump())
    new_id = len(Books)+1
    newbook.id = new_id
    Books.append(newbook)

@app.get("/books/{book_id}", status_code=200)
async def get_book_by_id(book_id: int = Path(gt = 0)):
    for single_book in Books:
        if single_book.id==book_id:
            return single_book
    raise HTTPException(status_code=404, detail="id not found")

@app.get("/books/book_by_rating/{rating}",status_code=200)
async def get_book_by_rating(rating : int = Path(gt=0, lt=6)):
    res = []
    for single_book in Books:
        if single_book.rating == rating :
            res.append(single_book)
    return res

@app.put("/books",status_code=204)
async def update_book(bookrequest: Bookrequest):
    updated_book = Book(**bookrequest.model_dump())
    flag = 0
    for i in range(len(Books)):
        if updated_book.id == Books[i].id:
            Books[i] = updated_book
            flag = 1
    if not flag:
        raise HTTPException(status_code=404, detail="Couldnt update, id not found")

@app.delete("/books", status_code=204)
async def delete_book(book_id: int = Query(gt = 0)):
    flag = 0
    for i in range(len(Books)):
        if book_id == Books[i].id:
            Books.pop(i)
            flag = 1
            break
    if not flag:
        raise HTTPException(status_code=404, detail="Coudnt delete, id not found")