import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from backend.app.database.connection import get_db
from backend.app.models.interaction import Interaction
from backend.app.models.risk_assessment import RiskAssessment
from backend.app.models.agent_trace import AgentTrace
from backend.app.models.incident import Incident
from backend.app.models.audit_log import AuditLog

router = APIRouter()

@router.get("")
async def list_interactions(
    ai_system_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List interaction histories.
    """
    stmt = (
        select(Interaction)
        .options(
            joinedload(Interaction.ai_system),
            joinedload(Interaction.risk_assessment)
        )
        .order_by(Interaction.created_at.desc())
    )

    if ai_system_id:
        stmt = stmt.where(Interaction.ai_system_id == ai_system_id)

    result = await db.execute(stmt)
    interactions = result.scalars().all()

    response = []
    for inter in interactions:
        ra = inter.risk_assessment
        response.append({
            "id": inter.id,
            "ai_system": inter.ai_system.name if inter.ai_system else "Unknown",
            "ai_system_id": inter.ai_system_id,
            "user_input": inter.user_input,
            "response": inter.response,
            "context": inter.context,
            "risk": ra.overall_risk_score if ra else 0,
            "level": ra.overall_risk_level if ra else "LOW",
            "decision": ra.decision_action if ra else "ALLOW",
            "confidence": ra.confidence_score if ra else 1.0,
            "created_at": inter.created_at.isoformat()
        })

    return response

@router.get("/{interaction_id}")
async def get_interaction_details(
    interaction_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Detailed inspection of a single interaction, including detector scores, agent trace, incidents and audits.
    """
    stmt = (
        select(Interaction)
        .options(
            joinedload(Interaction.ai_system),
            joinedload(Interaction.risk_assessment),
            joinedload(Interaction.agent_traces),
            joinedload(Interaction.incidents)
        )
        .where(Interaction.id == interaction_id)
    )
    result = await db.execute(stmt)
    inter = result.scalars().first()
    if not inter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interaction {interaction_id} not found."
        )

    # Decode detector findings JSON
    ra = inter.risk_assessment
    privacy_findings = {}
    safety_findings = {}
    bias_findings = {}
    hallucination_findings = {}
    
    if ra:
        try:
            privacy_findings = json.loads(ra.privacy_findings) if ra.privacy_findings else {}
            safety_findings = json.loads(ra.safety_findings) if ra.safety_findings else {}
            bias_findings = json.loads(ra.bias_findings) if ra.bias_findings else {}
            hallucination_findings = json.loads(ra.hallucination_findings) if ra.hallucination_findings else {}
        except Exception:
            pass

    # Load Audit events associated with this interaction
    audit_stmt = select(AuditLog).where(AuditLog.resource == interaction_id).order_by(AuditLog.created_at.desc())
    audit_result = await db.execute(audit_stmt)
    audit_events = [
        {
            "id": a.id,
            "event_type": a.event_type,
            "actor": a.actor,
            "action": a.action,
            "timestamp": a.created_at.isoformat()
        } for a in audit_result.scalars().all()
    ]

    # Map agent traces
    traces = [
        {
            "step_number": t.step_number,
            "component": t.component,
            "action": t.action,
            "input_data": json.loads(t.input_data) if t.input_data else {},
            "output_data": json.loads(t.output_data) if t.output_data else {}
        } for t in sorted(inter.agent_traces, key=lambda x: x.step_number)
    ]

    # Map incidents
    incidents = [
        {
            "id": i.id,
            "category": i.category,
            "severity": i.severity,
            "title": i.title,
            "status": i.status,
            "created_at": i.created_at.isoformat()
        } for i in inter.incidents
    ]

    return {
        "id": inter.id,
        "ai_system": inter.ai_system.name if inter.ai_system else "Unknown",
        "ai_system_id": inter.ai_system_id,
        "user_input": inter.user_input,
        "response": inter.response,
        "context": inter.context,
        "created_at": inter.created_at.isoformat(),
        "risk_assessment": {
            "id": ra.id if ra else None,
            "overall_risk_score": ra.overall_risk_score if ra else 0,
            "overall_risk_level": ra.overall_risk_level if ra else "LOW",
            "confidence_score": ra.confidence_score if ra else 1.0,
            "confidence_level": ra.confidence_level if ra else "HIGH",
            "decision_action": ra.decision_action if ra else "ALLOW",
            "decision_reason": ra.decision_reason if ra else "",
            "detectors": {
                "privacy": {
                    "score": ra.privacy_score if ra else 0,
                    "findings": privacy_findings
                },
                "safety": {
                    "score": ra.safety_score if ra else 0,
                    "findings": safety_findings
                },
                "bias": {
                    "score": ra.bias_score if ra else 0,
                    "findings": bias_findings
                },
                "hallucination": {
                    "score": ra.hallucination_score if ra else 0,
                    "findings": hallucination_findings
                }
            }
        },
        "agent_traces": traces,
        "incidents": incidents,
        "audit_logs": audit_events
    }
