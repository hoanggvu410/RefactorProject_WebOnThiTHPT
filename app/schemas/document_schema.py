from pydantic import BaseModel


class CreateDocument(BaseModel):
    title: str
    link: str
    grade: int
    subjectID: int

