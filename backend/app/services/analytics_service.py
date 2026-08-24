from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from sqlalchemy.orm import joinedload
from backend.app.database.connection import DATABASE_URL
from backend.app.models.ai_system import AISystem
from backend.app.models.interaction import Interaction
from backend.app.models.risk_assessment import RiskAssessment
from backend.app.models.incident import Incident
from datetime import datetime, timedelta


class AnalyticsService:
    @staticmethod
    async def get_dashboard_data(db: AsyncSession) -> Dict[str, Any]:
        """
        Executes aggregation queries across systems, interactions, risk profiles, and incidents.
        Returns serialized collections prepared for frontend charting components.
        """
        # 1. Total & Active AI Systems
        total_systems_res = await db.execute(select(func.count(AISystem.id)))
        total_systems = total_systems_res.scalar() or 0

        active_systems_res = await db.execute(select(func.count(AISystem.id)).where(AISystem.is_active == True))
        active_systems = active_systems_res.scalar() or 0

        # 2. Total Evaluations
        total_evals_res = await db.execute(select(func.count(Interaction.id)))
        total_evaluations = total_evals_res.scalar() or 0

        # 3. Average Risk Score
        avg_risk_res = await db.execute(select(func.avg(RiskAssessment.overall_risk_score)))
        avg_risk_val = avg_risk_res.scalar()
        average_risk = round(float(avg_risk_val), 1) if avg_risk_val is not None else 0.0

        # 4. High & Critical risk count (score >= 70)
        high_crit_res = await db.execute(
            select(func.count(RiskAssessment.id)).where(RiskAssessment.overall_risk_score >= 70)
        )
        high_critical_count = high_crit_res.scalar() or 0

        # 5. Open incidents & Pending human reviews
        open_inc_res = await db.execute(select(func.count(Incident.id)).where(Incident.status == "OPEN"))
        open_incidents = open_inc_res.scalar() or 0

        pending_rev_res = await db.execute(
            select(func.count(Incident.id)).where(Incident.status.in_(["OPEN", "IN_REVIEW"]))
        )
        pending_reviews = pending_rev_res.scalar() or 0

        # 6. Blocked count
        blocked_res = await db.execute(
            select(func.count(RiskAssessment.id)).where(RiskAssessment.decision_action == "BLOCK")
        )
        blocked_count = blocked_res.scalar() or 0

        # 7. Risk trend & Evaluations over time (grouped by date, last 14 days)
        # We group by date formatted from created_at
        if "sqlite" in DATABASE_URL:
            date_expr = func.strftime("%Y-%m-%d", Interaction.created_at)
        else:
            date_expr = func.to_char(Interaction.created_at, 'YYYY-MM-DD')

        
        trend_stmt = (
            select(
                date_expr.label("date"),
                func.avg(RiskAssessment.overall_risk_score).label("avg_risk"),
                func.count(Interaction.id).label("count")
            )
            .join(RiskAssessment, Interaction.id == RiskAssessment.interaction_id)
            .group_by("date")
            .order_by("date")
        )
        trend_result = await db.execute(trend_stmt)
        
        risk_trend = []
        evaluations_over_time = []
        for row in trend_result.all():
            risk_trend.append({"date": row.date, "avg_risk": round(float(row.avg_risk), 1)})
            evaluations_over_time.append({"date": row.date, "count": row.count})

        # Fallbacks if trend is empty to avoid blank charts
        if not risk_trend:
            today_str = datetime.utcnow().strftime("%Y-%m-%d")
            risk_trend = [{"date": today_str, "avg_risk": 0}]
            evaluations_over_time = [{"date": today_str, "count": 0}]

        # 8. Decision Distribution
        decision_stmt = (
            select(
                RiskAssessment.decision_action.label("action"),
                func.count(RiskAssessment.id).label("value")
            )
            .group_by(RiskAssessment.decision_action)
        )
        decision_result = await db.execute(decision_stmt)
        decision_distribution = [{"name": r.action, "value": r.value} for r in decision_result.all()]

        # 9. Risk Category Distribution (Average scores per dimension)
        cat_stmt = select(
            func.avg(RiskAssessment.privacy_score).label("privacy"),
            func.avg(RiskAssessment.safety_score).label("safety"),
            func.avg(RiskAssessment.bias_score).label("bias"),
            func.avg(RiskAssessment.hallucination_score).label("hallucination")
        )
        cat_result = await db.execute(cat_stmt)
        cat_row = cat_result.first()
        
        risk_category_distribution = []
        if cat_row:
            risk_category_distribution = [
                {"name": "Privacy", "value": round(float(cat_row.privacy or 0), 1)},
                {"name": "Safety", "value": round(float(cat_row.safety or 0), 1)},
                {"name": "Bias", "value": round(float(cat_row.bias or 0), 1)},
                {"name": "Hallucination", "value": round(float(cat_row.hallucination or 0), 1)},
            ]

        # 10. Incidents by Severity
        severity_stmt = (
            select(
                Incident.severity.label("severity"),
                func.count(Incident.id).label("value")
            )
            .group_by(Incident.severity)
        )
        severity_result = await db.execute(severity_stmt)
        incidents_by_severity = [{"name": r.severity, "value": r.value} for r in severity_result.all()]

        # 11. Recent Evaluations Table
        recent_eval_stmt = (
            select(Interaction)
            .options(
                joinedload(Interaction.ai_system),
                joinedload(Interaction.risk_assessment)
            )
            .order_by(Interaction.created_at.desc())
            .limit(5)
        )
        recent_eval_res = await db.execute(recent_eval_stmt)
        recent_evaluations = []
        for inter in recent_eval_res.scalars().all():
            ra = inter.risk_assessment
            recent_evaluations.append({
                "id": inter.id,
                "ai_system": inter.ai_system.name if inter.ai_system else "Unknown",
                "risk": ra.overall_risk_score if ra else 0,
                "level": ra.overall_risk_level if ra else "LOW",
                "decision": ra.decision_action if ra else "ALLOW",
                "confidence": ra.confidence_score if ra else 1.0,
                "timestamp": inter.created_at.isoformat()
            })

        # 12. Recent Incidents Table
        recent_inc_stmt = (
            select(Incident)
            .options(
                joinedload(Incident.interaction).joinedload(Interaction.ai_system),
                joinedload(Incident.interaction).joinedload(Interaction.risk_assessment)
            )
            .order_by(Incident.created_at.desc())
            .limit(5)
        )
        recent_inc_res = await db.execute(recent_inc_stmt)
        recent_incidents = []
        for inc in recent_inc_res.scalars().all():
            system_name = "Unknown"
            if inc.interaction and inc.interaction.ai_system:
                system_name = inc.interaction.ai_system.name
            recent_incidents.append({
                "id": inc.id,
                "title": inc.title,
                "severity": inc.severity,
                "status": inc.status,
                "ai_system": system_name,
                "timestamp": inc.created_at.isoformat()
            })

        return {
            "total_systems": total_systems,
            "active_systems": active_systems,
            "total_evaluations": total_evaluations,
            "average_risk": average_risk,
            "high_critical_count": high_critical_count,
            "open_incidents": open_incidents,
            "pending_reviews": pending_reviews,
            "blocked_count": blocked_count,
            "risk_trend": risk_trend,
            "evaluations_over_time": evaluations_over_time,
            "decision_distribution": decision_distribution,
            "risk_category_distribution": risk_category_distribution,
            "incidents_by_severity": incidents_by_severity,
            "recent_evaluations": recent_evaluations,
            "recent_incidents": recent_incidents
        }
