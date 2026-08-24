from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.database.connection import get_db
from backend.app.services.incident_service import IncidentService
from backend.app.schemas.incident import IncidentResponse, IncidentUpdate

router = APIRouter()

@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    ai_system_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Lists governance incidents with query parameters.
    """
    incidents = await IncidentService.list_incidents(
        db=db,
        status=status,
        severity=severity,
        ai_system_id=ai_system_id
    )

    response = []
    for inc in incidents:
        resp = IncidentResponse.model_validate(inc)
        
        # Inject additional context from joined relationships
        if inc.interaction:
            if inc.interaction.ai_system:
                resp.ai_system_name = inc.interaction.ai_system.name
            if inc.interaction.risk_assessment:
                resp.overall_risk_score = inc.interaction.risk_assessment.overall_risk_score
                resp.decision_action = inc.interaction.risk_assessment.decision_action
        
        response.append(resp)

    return response

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """
    Fetch details of a single incident.
    """
    inc = await IncidentService.get_incident_by_id(db, incident_id)
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found."
        )

    resp = IncidentResponse.model_validate(inc)
    if inc.interaction:
        if inc.interaction.ai_system:
            resp.ai_system_name = inc.interaction.ai_system.name
        if inc.interaction.risk_assessment:
            resp.overall_risk_score = inc.interaction.risk_assessment.overall_risk_score
            resp.decision_action = inc.interaction.risk_assessment.decision_action

    return resp

@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    payload: IncidentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Updates incident status.
    """
    inc = await IncidentService.update_status(
        db=db,
        incident_id=incident_id,
        status=payload.status,
        actor="ADMIN"
    )
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found."
        )

    resp = IncidentResponse.model_validate(inc)
    if inc.interaction:
        if inc.interaction.ai_system:
            resp.ai_system_name = inc.interaction.ai_system.name
        if inc.interaction.risk_assessment:
            resp.overall_risk_score = inc.interaction.risk_assessment.overall_risk_score
            resp.decision_action = inc.interaction.risk_assessment.decision_action

    return resp

@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """
    Deletes an incident and records an audit log.
    """
    inc = await IncidentService.get_incident_by_id(db, incident_id)
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found."
        )

    from backend.app.services.audit_service import AuditService
    title = inc.title

    await db.delete(inc)
    await db.commit()

    await AuditService.log_event(
        db=db,
        event_type="INCIDENT_DELETED",
        actor="ADMIN",
        resource=incident_id,
        action=f"Incident '{title}' was manually deleted by admin.",
        metadata={"incident_id": incident_id, "title": title}
    )
