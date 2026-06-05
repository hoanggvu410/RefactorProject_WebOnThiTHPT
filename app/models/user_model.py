import datetime
import uuid

from sqlalchemy import Column, Integer, String, Boolean, DateTime, UUID
from sqlalchemy.orm import relationship

from app.base.db import Base

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    role = Column(String, default="user")
    username = Column(String,unique=True, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    email_verified = Column(Boolean, nullable=False, default=False)
    grade = Column(Integer, default=10)
    uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique = True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.now(), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.now(), onupdate=datetime.datetime.now(), nullable=False)
    

    results= relationship("Result", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")