import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.base import Base

class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ai_system_id: Mapped[str] = mapped_column(String(36), ForeignKey("ai_systems.id", ondelete="CASCADE"), nullable=False, index=True)
    user_input: Mapped[str] = mapped_column(String(4000), nullable=False)
    response: Mapped[str] = mapped_column(String(4000), nullable=False)
    context: Mapped[str] = mapped_column(String(4000), nullable=True)
    
    # Newly added execution telemetry
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    model_name: Mapped[str] = mapped_column(String(100), nullable=True, default="GPT-4o")

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    ai_system = relationship("AISystem", back_populates="interactions")
    risk_assessment = relationship("RiskAssessment", back_populates="interaction", uselist=False, cascade="all, delete-orphan")
    agent_traces = relationship("AgentTrace", back_populates="interaction", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="interaction", cascade="all, delete-orphan")
