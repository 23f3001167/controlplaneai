from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

SystemType = Literal["AI_AGENT", "LLM", "CHATBOT", "RECOMMENDER", "CLASSIFIER", "GENAI_APPLICATION", "OTHER"]

class AISystemBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    system_type: SystemType = "LLM"
    risk_level: str = Field("LOW", max_length=20)
    latency_budget_ms: int = Field(1000, ge=1, le=60000)
    is_active: bool = True

class AISystemCreate(AISystemBase):
    pass

class AISystemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    system_type: Optional[SystemType] = None
    risk_level: Optional[str] = Field(None, max_length=20)
    latency_budget_ms: Optional[int] = Field(None, ge=1, le=60000)
    is_active: Optional[bool] = None

class AISystemResponse(AISystemBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
