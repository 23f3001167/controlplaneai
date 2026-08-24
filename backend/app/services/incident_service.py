import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from backend.app.models.incident import Incident
from backend.app.models.interaction import Interaction
from backend.app.models.ai_system import AISystem
from backend.app.models.risk_assessment import RiskAssessment
from backend.app.services.audit_service import AuditService

class IncidentService:
    @staticmethod
    async def create_incident(
        db: AsyncSession,
        interaction_id: str,
        category: str,
        severity: str,
        title: str,
        description: str
    ) -> Incident:
        """
        Creates and persists an incident ticket.
        """
        incident = Incident(
            id=str(uuid.uuid4()),
            interaction_id=interaction_id,
            category=category,
            severity=severity,
            title=title,
            description=description,
            status="OPEN"
        )
        db.add(incident)
        await db.commit()
        await db.refresh(incident)

        # Log audit trail
        await AuditService.log_event(
            db=db,
            event_type="INCIDENT_CREATED",
            actor="SYSTEM",
            resource=incident.id,
            action=f"Incident '{title}' was automatically generated for evaluation violations.",
            metadata={"interaction_id": interaction_id, "severity": severity, "category": category}
        )

        return incident

    @staticmethod
    async def get_incident_by_id(db: AsyncSession, incident_id: str) -> Optional[Incident]:
        """
        Fetches an incident with loaded related relationships.
        """
        stmt = (
            select(Incident)
            .options(
                joinedload(Incident.interventions),
                joinedload(Incident.interaction).joinedload(Interaction.ai_system),
                joinedload(Incident.interaction).joinedload(Interaction.risk_assessment)
            )
            .where(Incident.id == incident_id)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def list_incidents(
        db: AsyncSession,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        ai_system_id: Optional[str] = None
    ) -> List[Incident]:
        """
        Lists and filters incident tickets.
        """
        stmt = (
            select(Incident)
            .join(Incident.interaction)
            .options(
                joinedload(Incident.interaction).joinedload(Interaction.ai_system),
                joinedload(Incident.interaction).joinedload(Interaction.risk_assessment)
            )
            .order_by(Incident.created_at.desc())
        )

        if status:
            stmt = stmt.where(Incident.status == status)
        if severity:
            stmt = stmt.where(Incident.severity == severity)
        if ai_system_id:
            stmt = stmt.where(Interaction.ai_system_id == ai_system_id)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def update_status(
        db: AsyncSession,
        incident_id: str,
        status: str,
        actor: str = "ADMIN"
    ) -> Optional[Incident]:
        """
        Modifies status of an incident and logs an audit trail.
        """
        incident = await IncidentService.get_incident_by_id(db, incident_id)
        if not incident:
            return None

        old_status = incident.status
        incident.status = status
        db.add(incident)
        await db.commit()
        await db.refresh(incident)

        await AuditService.log_event(
            db=db,
            event_type="INCIDENT_UPDATED",
            actor=actor,
            resource=incident.id,
            action=f"Incident status updated from {old_status} to {status}.",
            metadata={"incident_id": incident.id, "old_status": old_status, "new_status": status}
        )

        return incident
