from typing import Optional
from fastapi import FastAPI, Body, Path, Query, HTTPException
from pydantic import BaseModel, Field
from starlette import status

app = FastAPI()

class book_request(BaseModel):
    id: Optional[int] = None
    title: str = Field(min_length=1)
    author: str = Field(min_length =2)
    category: str = Field(min_length=2, max_length=15)
    rating: int = Field(gt = 0, lt = 11)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "Optional int",
                    "title": "String",
                    "author": "String",
                    "category": "String",
                    "rating": "int",

                }
            ]
        }
    }

class book:
    id: int
    title: str
    author:str
    category:str
    rating:int
    def __init__(self,id,title,author,category,rating):
        self.id=id
        self.title=title
        self.author=author
        self.category=category
        self.rating=rating



books = [
    book(1,"a","aayat","science",10),
    book(2,"b","omar","cse",9),
    book(3,"c","tasin","bba",8),
    book(4,"d","kayes","marketing",7),
    book(5,"e","aoyon","architecture",6)
]

@app.get("/allbooks", status_code= status.HTTP_200_OK)
async def get_books():
    return books




#dynamic params, turn 2nd params code to try this
# @app.get("/allbooks/{booktitle}")
# async def get_book(booktitle : str):
#     f = 0
#     for book in books:
#         if book.get('Title').casefold()==booktitle.casefold():
#             f=1
#             return book
#     return "No such book"


#dynamic params plus query for get http req
@app.get("/allbooks/by_author/{bookauthor}", status_code=status.HTTP_200_OK)
async def get_book_2(bookauthor: str, bookcategory: str = Query(max_length=15)):
    f = 0
    found = []
    for book in books:
        if book.author.casefold()==bookauthor.casefold() and \
        book.category.casefold()==bookcategory.casefold():
            f = 1
            found.append(book)
    if f:
        return found
    raise HTTPException(status_code = 404, detail = "No books by this author")



#post request
@app.post("/create_book",status_code = status.HTTP_201_CREATED)
async def create_book(book_create_request: book_request):
    new_book = book(**book_create_request.model_dump())
    get_id(new_book)
    books.append(new_book)

def get_id(book):
    if len(books) > 0:
        book.id=len(books)+1
    else:
        book.id = 1


#put request
@app.put("/update_book",status_code = status.HTTP_204_NO_CONTENT)
async def update_book(updated_book: book_request):
    f = 0
    for book in books:
        if book.title.casefold() == updated_book.title.casefold() and \
        book.author.casefold() ==  updated_book.author.casefold():

            book.category=updated_book.category
            book.rating=updated_book.rating

            f=1

    if f==0:
        raise HTTPException(status_code=404, detail="Can't update, no such books")


#delete request
@app.delete("/delete_book")
async def delete_book(target_book = Body()):
    books.remove(target_book)

@app.get("/allbooks/by_id/{book_id}")
async def find_by_id(book_id:int = Path(lt=10)):
    f=0
    for i in range(len(books)):
        if(books[i].id==book_id):
            f=1
            return books[i]
    if f==0:
        raise HTTPException(status_code=404, detail="No books with such id")