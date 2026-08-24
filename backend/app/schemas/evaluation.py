from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class EvaluateRequest(BaseModel):
    ai_system: str = Field(..., description="Name or UUID of the registered AI System")
    user_input: str = Field(..., min_length=1, max_length=4000)
    response: str = Field(..., min_length=1, max_length=4000)
    context: Optional[str] = Field(None, max_length=4000)

class RiskInfo(BaseModel):
    overall: int
    level: str

class ConfidenceInfo(BaseModel):
    confidence: float
    level: str

class DetectorResult(BaseModel):
    score: int
    findings: Optional[Dict[str, Any]] = None
    explanation: Optional[str] = None
    masked_response: Optional[str] = None

class DetectorsInfo(BaseModel):
    privacy: DetectorResult
    safety: DetectorResult
    bias: DetectorResult
    hallucination: DetectorResult

class PolicyInfo(BaseModel):
    id: str
    name: str

class DecisionInfo(BaseModel):
    action: str
    reason: str

class EvaluationDetail(BaseModel):
    risk: RiskInfo
    confidence: ConfidenceInfo
    detectors: DetectorsInfo
    policy: Optional[PolicyInfo] = None
    decision: DecisionInfo

class InteractionBrief(BaseModel):
    id: str
    ai_system_id: str
    user_input: str
    response: str
    context: Optional[str] = None
    created_at: datetime

class RiskAssessmentBrief(BaseModel):
    id: str
    overall_risk_score: int
    overall_risk_level: str
    confidence_score: float
    confidence_level: str
    decision_action: str
    decision_reason: str

class IncidentBrief(BaseModel):
    id: str
    category: str
    severity: str
    title: str
    description: str
    status: str
    created_at: datetime

class EvaluateResponse(BaseModel):
    evaluation: EvaluationDetail
    interaction: InteractionBrief
    risk_assessment: RiskAssessmentBrief
    incident: Optional[IncidentBrief] = None
