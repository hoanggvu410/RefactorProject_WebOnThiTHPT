from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from datetime import datetime

from sqlalchemy.orm import relationship

from app.base.db import Base
from app.models.models import LogSchemaMixin


class RefreshToken(Base, LogSchemaMixin):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    hashed_token = Column(String, unique=True, nullable=False)
    is_revoked = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")