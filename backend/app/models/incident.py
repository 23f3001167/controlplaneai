import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.base import Base

class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    interaction_id: Mapped[str] = mapped_column(String(36), ForeignKey("interactions.id", ondelete="CASCADE"), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False) # PRIVACY, SAFETY, BIAS, HALLUCINATION, HIGH_RISK
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="OPEN") # OPEN, IN_REVIEW, RESOLVED, DISMISSED
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    interaction = relationship("Interaction", back_populates="incidents")
    interventions = relationship("Intervention", back_populates="incident", cascade="all, delete-orphan")
