import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.base import Base

class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ai_system_id: Mapped[str] = mapped_column(String(36), ForeignKey("ai_systems.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    risk_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=40)
    human_review_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=70)
    block_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    privacy_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=70)
    bias_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=70)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    ai_system = relationship("AISystem", back_populates="policies")
