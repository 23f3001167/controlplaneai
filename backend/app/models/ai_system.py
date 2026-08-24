import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.base import Base

class AISystem(Base):
    __tablename__ = "ai_systems"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    system_type: Mapped[str] = mapped_column(String(50), nullable=False, default="LLM")  # AI_AGENT, LLM, CHATBOT, etc.
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="LOW")
    latency_budget_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    policies = relationship("Policy", back_populates="ai_system", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="ai_system", cascade="all, delete-orphan")
