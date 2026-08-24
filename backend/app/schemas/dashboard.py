from typing import List, Dict, Any
from pydantic import BaseModel
from backend.app.schemas.evaluation import RiskAssessmentBrief, InteractionBrief
from backend.app.schemas.incident import IncidentResponse

class KeyMetric(BaseModel):
    label: str
    value: Any
    change: Optional[str] = None # placeholder or calculated

class DashboardOverview(BaseModel):
    total_systems: int
    active_systems: int
    total_evaluations: int
    average_risk: float
    high_critical_count: int
    open_incidents: int
    pending_reviews: int
    blocked_count: int

    # Charts datasets
    risk_trend: List[Dict[str, Any]] # e.g. [{"date": "2026-08-20", "avg_risk": 45}]
    evaluations_over_time: List[Dict[str, Any]] # e.g. [{"date": "2026-08-20", "count": 12}]
    decision_distribution: List[Dict[str, Any]] # e.g. [{"name": "ALLOW", "value": 8}]
    risk_category_distribution: List[Dict[str, Any]] # e.g. [{"name": "Privacy", "value": 35}]
    incidents_by_severity: List[Dict[str, Any]] # e.g. [{"name": "CRITICAL", "value": 2}]

    # Tables datasets
    recent_evaluations: List[Dict[str, Any]]
    recent_incidents: List[Dict[str, Any]]
