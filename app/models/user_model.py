from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.base.db import Base

class User(Base):
    __tablename__ = "users"
    userID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    role = Column(String, default="user")
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    mail = Column(String)
    grade = Column(Integer, default=10)

    results= relationship("Result", back_populates="user")
    