from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.connection import get_db
from backend.app.services.intervention_service import InterventionService
from backend.app.schemas.incident import InterventionCreate, InterventionResponse

router = APIRouter()

@router.get("", response_model=List[InterventionResponse])
async def list_interventions(db: AsyncSession = Depends(get_db)):
    """
    Lists historical human review interventions.
    """
    interventions = await InterventionService.list_interventions(db)
    return interventions

@router.post("", response_model=InterventionResponse, status_code=status.HTTP_201_CREATED)
async def create_intervention(
    payload: InterventionCreate,
    incident_id: str, # Passed in as query param or we can accept it inside the body. Let's support accepting inside the body if we extend the schema, or support both.
    db: AsyncSession = Depends(get_db)
):
    """
    Records a reviewer intervention.
    """
    intervention = await InterventionService.create_intervention(
        db=db,
        incident_id=incident_id,
        action=payload.action,
        reason=payload.reason,
        reviewer=payload.reviewer
    )

    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found."
        )

    return intervention
