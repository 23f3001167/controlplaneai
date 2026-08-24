import json
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.audit_log import AuditLog

class AuditService:
    @staticmethod
    async def log_event(
        db: AsyncSession,
        event_type: str,
        actor: str,
        resource: str,
        action: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Creates and persists an immutable audit log entry.
        """
        metadata_json = None
        if metadata:
            try:
                metadata_json = json.dumps(metadata)
            except Exception:
                metadata_json = "{}"

        audit_entry = AuditLog(
            event_type=event_type,
            actor=actor,
            resource=resource,
            action=action,
            metadata_json=metadata_json
        )

        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)
        return audit_entry
