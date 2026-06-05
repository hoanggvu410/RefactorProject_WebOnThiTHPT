from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.base.db import Base
from app.models.models import AdminSchemaMixin


class Document(Base, AdminSchemaMixin):
    __tablename__ = 'documents'
    document_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    grade = Column(Integer, default=10)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"))
    link = Column(String(100))
    created_at = Column(DateTime, default=func.now(), nullable=True)

    subject = relationship("Subject", back_populates="documents")

