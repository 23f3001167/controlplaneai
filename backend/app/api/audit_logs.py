import json
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.database.connection import get_db
from backend.app.models.audit_log import AuditLog

router = APIRouter()

@router.get("")
async def list_audit_logs(
    event_type: Optional[str] = None,
    resource: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List audit trail logs.
    """
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())

    if event_type:
        stmt = stmt.where(AuditLog.event_type == event_type)
    if resource:
        stmt = stmt.where(AuditLog.resource == resource)

    result = await db.execute(stmt)
    logs = result.scalars().all()

    response = []
    for log in logs:
        meta = {}
        if log.metadata_json:
            try:
                meta = json.loads(log.metadata_json)
            except Exception:
                pass
        response.append({
            "id": log.id,
            "event_type": log.event_type,
            "actor": log.actor,
            "resource": log.resource,
            "action": log.action,
            "metadata": meta,
            "created_at": log.created_at.isoformat()
        })

    return response
