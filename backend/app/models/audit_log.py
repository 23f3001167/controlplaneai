import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.database.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # AI_SYSTEM_CREATED, etc.
    actor: Mapped[str] = mapped_column(String(100), nullable=False) # SYSTEM, USER, ADMIN
    resource: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # Resource ID or path
    action: Mapped[str] = mapped_column(String(200), nullable=False) # Human description
    metadata_json: Mapped[str] = mapped_column(String(2000), nullable=True) # Serialized context dictionary
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, index=True)
