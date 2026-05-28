from pydantic import BaseModel

class CreateNews(BaseModel):
    title: str
    content: str
    link: str
    date: str
