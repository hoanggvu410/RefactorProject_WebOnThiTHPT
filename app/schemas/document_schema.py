from fastapi import Query
from pydantic import BaseModel


class CreateDocument(BaseModel):
    title: str
    link: str
    grade: int
    subject_id: int

