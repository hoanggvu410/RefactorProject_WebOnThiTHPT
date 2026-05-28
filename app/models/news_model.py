from sqlalchemy import Column, Integer, String, Text, DateTime
from app.base.db import Base


class News(Base):
    __tablename__ = "news"
    newsID = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String)
    content = Column(Text)
    date = Column(String)
    link = Column(String)