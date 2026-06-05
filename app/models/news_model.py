from sqlalchemy import Column, Integer, String, Text, DateTime
from app.base.db import Base
from app.models.models import AdminSchemaMixin


class News(Base, AdminSchemaMixin):
    __tablename__ = "news"
    news_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String)
    content = Column(Text)
    date = Column(String)
    link = Column(String)
    published_at = Column(DateTime, nullable=True)