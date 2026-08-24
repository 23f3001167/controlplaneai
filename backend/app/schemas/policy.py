from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator

class PolicyBase(BaseModel):
    ai_system_id: str
    name: str = Field(..., min_length=2, max_length=100)
    risk_threshold: int = Field(40, ge=0, le=100)
    human_review_threshold: int = Field(70, ge=0, le=100)
    block_threshold: int = Field(90, ge=0, le=100)
    privacy_threshold: int = Field(70, ge=0, le=100)
    bias_threshold: int = Field(70, ge=0, le=100)

    @model_validator(mode="after")
    def check_logical_thresholds(self) -> 'PolicyBase':
        r_t = self.risk_threshold
        h_t = self.human_review_threshold
        b_t = self.block_threshold
        if not (r_t <= h_t <= b_t):
            raise ValueError(
                f"Threshold inconsistency: risk_threshold ({r_t}) must be less than or equal to "
                f"human_review_threshold ({h_t}), which must be less than or equal to "
                f"block_threshold ({b_t})."
            )
        return self

class PolicyCreate(PolicyBase):
    pass

class PolicyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    risk_threshold: Optional[int] = Field(None, ge=0, le=100)
    human_review_threshold: Optional[int] = Field(None, ge=0, le=100)
    block_threshold: Optional[int] = Field(None, ge=0, le=100)
    privacy_threshold: Optional[int] = Field(None, ge=0, le=100)
    bias_threshold: Optional[int] = Field(None, ge=0, le=100)

    @model_validator(mode="after")
    def check_logical_thresholds_update(self) -> 'PolicyUpdate':
        # Skip validation if none of these are updated, or if they are partial, we validate against provided values
        # In a real setup, partial update verification is sometimes done in service, but we can do a basic check if all 3 are set.
        if (self.risk_threshold is not None and 
            self.human_review_threshold is not None and 
            self.block_threshold is not None):
            if not (self.risk_threshold <= self.human_review_threshold <= self.block_threshold):
                raise ValueError("Threshold inconsistency: risk_threshold <= human_review_threshold <= block_threshold")
        return self

class PolicyResponse(PolicyBase):
    id: str
    created_at: datetime
    ai_system_name: Optional[str] = None

    class Config:
        from_attributes = True
        # Allow extra so we can inject ai_system_name easily
        extra = "allow"
