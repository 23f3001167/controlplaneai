import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from backend.app.models.intervention import Intervention
from backend.app.models.incident import Incident
from backend.app.services.incident_service import IncidentService
from backend.app.services.audit_service import AuditService

class InterventionService:
    @staticmethod
    async def create_intervention(
        db: AsyncSession,
        incident_id: str,
        action: str, # APPROVE, REJECT, OVERRIDE
        reason: str,
        reviewer: str
    ) -> Optional[Intervention]:
        """
        Performs human review intervention on an incident.
        Resolves the incident, creates the intervention log, and updates audit files.
        """
        # Fetch incident
        incident = await IncidentService.get_incident_by_id(db, incident_id)
        if not incident:
            return None

        # Build outcome message
        outcome = f"Human review complete. Action: {action}. Reviewer justification: '{reason}'"

        intervention = Intervention(
            id=str(uuid.uuid4()),
            incident_id=incident_id,
            action=action,
            reason=reason,
            reviewer=reviewer,
            outcome=outcome
        )

        db.add(intervention)
        
        # Update incident status to RESOLVED or DISMISSED based on the action
        if action == "REJECT":
            incident.status = "DISMISSED"
        else:
            incident.status = "RESOLVED"
            
        db.add(incident)
        await db.commit()
        await db.refresh(intervention)

        # Log audit trail
        await AuditService.log_event(
            db=db,
            event_type="HUMAN_REVIEW_COMPLETED",
            actor=reviewer,
            resource=incident_id,
            action=f"Human intervention completed on incident. Result action: {action}.",
            metadata={
                "incident_id": incident_id,
                "action": action,
                "reviewer": reviewer,
                "reason": reason
            }
        )

        return intervention

    @staticmethod
    async def list_interventions(db: AsyncSession) -> List[Intervention]:
        """
        Retrieves all human review interventions.
        """
        stmt = (
            select(Intervention)
            .options(joinedload(Intervention.incident))
            .order_by(Intervention.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
