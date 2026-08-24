from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class IncidentUpdate(BaseModel):
    status: str = Field(..., description="Target status: OPEN, IN_REVIEW, RESOLVED, DISMISSED")

class InterventionCreate(BaseModel):
    action: str = Field(..., description="Action: APPROVE, REJECT, OVERRIDE")
    reason: str = Field(..., min_length=2, max_length=1000)
    reviewer: str = Field(..., min_length=2, max_length=100)

class InterventionResponse(BaseModel):
    id: str
    incident_id: str
    action: str
    reason: str
    reviewer: str
    outcome: str
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentResponse(BaseModel):
    id: str
    interaction_id: str
    category: str
    severity: str
    title: str
    description: str
    status: str
    created_at: datetime
    ai_system_name: Optional[str] = None
    overall_risk_score: Optional[int] = None
    decision_action: Optional[str] = None
    interventions: List[InterventionResponse] = []

    class Config:
        from_attributes = True
        extra = "allow"
