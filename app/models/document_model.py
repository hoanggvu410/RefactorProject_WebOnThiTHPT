from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.base.db import Base


class Document(Base):
    __tablename__ = 'documents'
    documentID = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    grade = Column(Integer, default=10)
    subjectID = Column(Integer, ForeignKey("subjects.subjectID"))
    link = Column(String(100))

    subject = relationship("Subject", back_populates="documents")