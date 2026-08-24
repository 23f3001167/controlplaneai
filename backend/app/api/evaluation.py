from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.connection import get_db
from backend.app.schemas.evaluation import EvaluateRequest, EvaluateResponse
from backend.app.services.evaluation_service import EvaluationService

router = APIRouter()
evaluation_service = EvaluationService()

@router.post("", response_model=EvaluateResponse)
async def evaluate(
    payload: EvaluateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Evaluates prompts and responses in real-time, executing the safety, privacy, bias, and correctness detectors.
    Applies active policy thresholds to output a decisive compliance action.
    """
    try:
        interaction, risk_assessment, incident, details = await evaluation_service.evaluate(
            db=db,
            ai_system_identifier=payload.ai_system,
            user_input=payload.user_input,
            response=payload.response,
            context=payload.context
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}"
        )

    # Format output
    incident_brief = None
    if incident:
        incident_brief = {
            "id": incident.id,
            "category": incident.category,
            "severity": incident.severity,
            "title": incident.title,
            "description": incident.description,
            "status": incident.status,
            "created_at": incident.created_at
        }

    return {
        "evaluation": details,
        "interaction": {
            "id": interaction.id,
            "ai_system_id": interaction.ai_system_id,
            "user_input": interaction.user_input,
            "response": interaction.response,
            "context": interaction.context,
            "created_at": interaction.created_at
        },
        "risk_assessment": {
            "id": risk_assessment.id,
            "overall_risk_score": risk_assessment.overall_risk_score,
            "overall_risk_level": risk_assessment.overall_risk_level,
            "confidence_score": risk_assessment.confidence_score,
            "confidence_level": risk_assessment.confidence_level,
            "decision_action": risk_assessment.decision_action,
            "decision_reason": risk_assessment.decision_reason
        },
        "incident": incident_brief
    }
