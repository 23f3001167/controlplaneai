import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.base import Base

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    interaction_id: Mapped[str] = mapped_column(String(36), ForeignKey("interactions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    overall_risk_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    overall_risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="LOW")
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    confidence_level: Mapped[str] = mapped_column(String(20), nullable=False, default="HIGH")
    
    # Detector specific details
    privacy_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    privacy_findings: Mapped[str] = mapped_column(String(2000), nullable=True) # JSON details stored as string
    safety_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    safety_findings: Mapped[str] = mapped_column(String(2000), nullable=True)
    bias_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    bias_findings: Mapped[str] = mapped_column(String(2000), nullable=True)
    hallucination_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    hallucination_findings: Mapped[str] = mapped_column(String(2000), nullable=True)

    # Decisions
    decision_action: Mapped[str] = mapped_column(String(30), nullable=False, default="ALLOW") # ALLOW, MODIFY, HUMAN_REVIEW, BLOCK
    decision_reason: Mapped[str] = mapped_column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    interaction = relationship("Interaction", back_populates="risk_assessment")
