import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.database.connection import get_db
from backend.app.models.agent_trace import AgentTrace

router = APIRouter()

@router.get("/{interaction_id}")
async def get_agent_trace(
    interaction_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches the 9-step governance validation traces for a specific interaction.
    """
    stmt = (
        select(AgentTrace)
        .where(AgentTrace.interaction_id == interaction_id)
        .order_by(AgentTrace.step_number)
    )
    result = await db.execute(stmt)
    traces = result.scalars().all()

    if not traces:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Traces for interaction {interaction_id} not found."
        )

    response = []
    for t in traces:
        in_data = {}
        out_data = {}
        if t.input_data:
            try:
                in_data = json.loads(t.input_data)
            except Exception:
                pass
        if t.output_data:
            try:
                out_data = json.loads(t.output_data)
            except Exception:
                pass

        response.append({
            "id": t.id,
            "step_number": t.step_number,
            "component": t.component,
            "action": t.action,
            "input_data": in_data,
            "output_data": out_data,
            "created_at": t.created_at.isoformat()
        })

    return response
