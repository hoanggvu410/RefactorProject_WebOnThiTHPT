import uuid
from sqlalchemy import Column, UUID, DateTime, func, Boolean, ForeignKey


class LogSchemaMixin:
    uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique = True, nullable=False)
    created_at = Column(DateTime(timezone = True), server_default = func.now())

class AdminSchemaMixin(LogSchemaMixin):
    updated_at = Column(
        DateTime(timezone = True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    is_deleted = Column(Boolean, default = False, nullable = False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.uuid", ondelete= "SET NULL"), nullable = True)