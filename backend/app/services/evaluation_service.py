import json
from datetime import datetime
import uuid
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

# Models
from backend.app.models.ai_system import AISystem
from backend.app.models.policy import Policy
from backend.app.models.interaction import Interaction
from backend.app.models.risk_assessment import RiskAssessment
from backend.app.models.agent_trace import AgentTrace
from backend.app.models.incident import Incident

# Services
from backend.app.services.privacy_service import PrivacyService
from backend.app.services.safety_service import SafetyService
from backend.app.services.bias_service import BiasService
from backend.app.services.hallucination_service import HallucinationService
from backend.app.services.confidence_service import ConfidenceService
from backend.app.services.audit_service import AuditService
from backend.app.services.incident_service import IncidentService

# Engines
from backend.app.engines.risk_engine import RiskEngine
from backend.app.engines.policy_engine import PolicyEngine

class EvaluationService:
    def __init__(self):
        self.privacy_service = PrivacyService()
        self.safety_service = SafetyService()
        self.bias_service = BiasService()
        self.hallucination_service = HallucinationService()
        self.confidence_service = ConfidenceService()
        self.risk_engine = RiskEngine()
        self.policy_engine = PolicyEngine()

    async def evaluate(
        self,
        db: AsyncSession,
        ai_system_identifier: str,
        user_input: str,
        response: str,
        context: Optional[str] = None
    ) -> Tuple[Interaction, RiskAssessment, Optional[Incident], Dict[str, Any]]:
        """
        Executes the evaluation pipeline.
        Saves interaction, risk assessment, incident (if triggered), agent trace, and audit logs.
        Returns (interaction, risk_assessment, incident, evaluation_details_dict).
        """
        # 1. Resolve AI System by ID or Name
        stmt = select(AISystem).where(
            (AISystem.id == ai_system_identifier) | (AISystem.name == ai_system_identifier)
        ).options(selectinload(AISystem.policies))
        
        system_res = await db.execute(stmt)
        ai_system = system_res.scalars().first()
        if not ai_system:
            raise ValueError(f"AI System '{ai_system_identifier}' not found.")

        if not ai_system.is_active:
            raise ValueError(f"AI System '{ai_system.name}' is inactive.")

        # 2. Get active policy or create default on-the-fly
        policy = None
        if ai_system.policies:
            # use the latest policy
            policy = ai_system.policies[-1]
        else:
            # Default fallback policy thresholds
            policy = Policy(
                ai_system_id=ai_system.id,
                name="Default System Policy",
                risk_threshold=40,
                human_review_threshold=70,
                block_threshold=90,
                privacy_threshold=70,
                bias_threshold=70
            )
            db.add(policy)
            await db.commit()
            await db.refresh(policy)

        # Generate Interaction ID early for traces
        interaction_id = str(uuid.uuid4())
        traces_to_save = []

        # Step 1: INPUT_RECEIVED
        traces_to_save.append(AgentTrace(
            interaction_id=interaction_id,
            step_number=1,
            component="INPUT_RECEIVED",
            action="Receive request inputs from client",
            input_data=json.dumps({"ai_system": ai_system.name, "context_length": len(context) if context else 0}),
            output_data=json.dumps({"status": "SUCCESS"})
        ))

        # Step 2: PRIVACY_ANALYSIS
        # Scan user input and model response for privacy leaks
        priv_score_in, priv_findings_in, masked_user_input = self.privacy_service.evaluate(user_input)
        priv_score_out, priv_findings_out, masked_response = self.privacy_service.evaluate(response)
        
        # Consolidate privacy score
        privacy_score = max(priv_score_in, priv_score_out)
        privacy_findings = {
            "user_input_findings": priv_findings_in,
            "response_findings": priv_findings_out
        }
        
        traces_to_save.append(AgentTrace(
            interaction_id=interaction_id,
            step_number=2,
            component="PRIVACY_ANALYSIS",
            action="Scan for PII in user input and model response",
            input_data=json.dumps({"privacy_score": privacy_score}),
            output_data=json.dumps(privacy_findings)
        ))

        # Step 3: SAFETY_ANALYSIS
        safe_score_in, safe_findings_in = self.safety_service.evaluate(user_input)
        safe_score_out, safe_findings_out = self.safety_service.evaluate(response)
        safety_score = max(safe_score_in, safe_score_out)
        safety_findings = {
            "user_input_findings": safe_findings_in,
            "response_findings": safe_findings_out
        }
        
        traces_to_save.append(AgentTrace(
            interaction_id=interaction_id,
            step_number=3,
            component="SAFETY_ANALYSIS",
            action="Screen content for malware, weapons, phishing, and credential theft",
            input_data=json.dumps({"safety_score": safety_score}),
            output_data=json.dumps(safety_findings)
        ))

        # Step 4: BIAS_ANALYSIS
        bias_score, bias_findings = self.bias_service.evaluate(response)
        
        traces_to_save.append(AgentTrace(
            interaction_id=interaction_id,
            step_number=4,
            component="BIAS_ANALYSIS",
            action="Screen response for stereotype generalizations",
            input_data=json.dumps({"bias_score": bias_score}),
            output_data=json.dumps(bias_findings)
        ))

        # Step 5: HALLUCINATION_ANALYSIS
        hallucination_score, hallucination_findings = self.hallucination_service.evaluate(response, context)
        
        traces_to_save.append(AgentTrace(
            interaction_id=interaction_id,
            step_number=5,
            component="HALLUCINATION_ANALYSIS",
            action="Verify model claims against trusted context",
            input_data=json.dumps({"has_context": context is not None}),
            output_data=json.dumps(hallucination_findings)
        ))

        # Step 6: CONFIDENCE_CALCULATION
        priv_conf = priv_findings_out.get("confidence", 0.95)
        safe_conf = safe_findings_out.get("confidence", 0.95)
        bias_conf = bias_findings.get("confidence", 0.95)
        hal_conf = hallucination_findings.get("confidence", 0.95)
        
        confidence_score, confidence_level = self.confidence_service.calculate_confidence(
            privacy_conf=priv_conf,
            safety_conf=safe_conf,
            bias_conf=bias_conf,
            hallucination_conf=hal_conf,
            text_length=len(response)
        )
        
        traces_to_save.append(AgentTrace(
            interaction_id=interaction_id,
            step_number=6,
            component="CONFIDENCE_CALCULATION",
            action="Compute aggregate decision confidence metrics",
            input_data=json.dumps({
                "privacy_conf": priv_conf,
                "safety_conf": safe_conf,
                "bias_conf": bias_conf,
                "hallucination_conf": hal_conf
            }),
            output_data=json.dumps({"confidence_score": confidence_score, "level": confidence_level})
        ))

        # Step 7: RISK_CALCULATION
        overall_risk_score, overall_risk_level, risk_explanation = self.risk_engine.calculate_risk(
            privacy_score=privacy_score,
            safety_score=safety_score,
            bias_score=bias_score,
            hallucination_score=hallucination_score
        )
        
        traces_to_save.append(AgentTrace(
            interaction_id=interaction_id,
            step_number=7,
            component="RISK_CALCULATION",
            action="Calculate weighted overall risk score and level",
            input_data=json.dumps({
                "privacy_score": privacy_score,
                "safety_score": safety_score,
                "bias_score": bias_score,
                "hallucination_score": hallucination_score
            }),
            output_data=json.dumps({
                "overall_risk_score": overall_risk_score,
                "overall_risk_level": overall_risk_level,
                "explanation": risk_explanation
            })
        ))

        # Step 8: POLICY_EVALUATION
        decision_action, decision_reason = self.policy_engine.evaluate_policy(
            policy=policy,
            overall_risk_score=overall_risk_score,
            privacy_score=privacy_score,
            bias_score=bias_score,
            confidence_score=confidence_score
        )
        
        traces_to_save.append(AgentTrace(
            interaction_id=interaction_id,
            step_number=8,
            component="POLICY_EVALUATION",
            action="Apply governance thresholds to determine intervention action",
            input_data=json.dumps({
                "policy_id": policy.id,
                "policy_name": policy.name,
                "risk_threshold": policy.risk_threshold,
                "human_review_threshold": policy.human_review_threshold,
                "block_threshold": policy.block_threshold
            }),
            output_data=json.dumps({"decision_action": decision_action, "reason": decision_reason})
        ))

        # Step 9: FINAL_DECISION
        # If decision is MODIFY, we sanitise the response or prep a security alert header.
        final_response = masked_response
        if decision_action == "MODIFY":
            # Masked response was already prepared by privacy detector.
            # In addition, we prepend a notice to alert the user of modified content.
            final_response = "[GOVERNANCE NOTICE: Response sanitized for compliance] " + masked_response

        # Persist Interaction (using masked strings to avoid storing raw secrets)
        interaction = Interaction(
            id=interaction_id,
            ai_system_id=ai_system.id,
            user_input=masked_user_input,
            response=final_response,
            context=context
        )
        db.add(interaction)

        # Persist Risk Assessment
        risk_assessment = RiskAssessment(
            id=str(uuid.uuid4()),
            interaction_id=interaction_id,
            overall_risk_score=overall_risk_score,
            overall_risk_level=overall_risk_level,
            confidence_score=confidence_score,
            confidence_level=confidence_level,
            privacy_score=privacy_score,
            privacy_findings=json.dumps(privacy_findings),
            safety_score=safety_score,
            safety_findings=json.dumps(safety_findings),
            bias_score=bias_score,
            bias_findings=json.dumps(bias_findings),
            hallucination_score=hallucination_score,
            hallucination_findings=json.dumps(hallucination_findings),
            decision_action=decision_action,
            decision_reason=decision_reason
        )
        db.add(risk_assessment)

        # Commit Interaction and Risk Assessment first to satisfy foreign key constraints
        await db.commit()

        # Step 9 Trace details
        traces_to_save.append(AgentTrace(
            interaction_id=interaction_id,
            step_number=9,
            component="FINAL_DECISION",
            action="Apply decision response handling and persistence",
            input_data=json.dumps({"action": decision_action}),
            output_data=json.dumps({"interaction_id": interaction_id, "saved_successfully": True})
        ))

        # Bulk save agent traces
        for trace in traces_to_save:
            db.add(trace)
        await db.commit()

        # 3. Create Incident if decision is BLOCK, HUMAN_REVIEW, or risk is CRITICAL
        incident = None
        if decision_action in ("BLOCK", "HUMAN_REVIEW") or overall_risk_level == "CRITICAL":
            # Select severity
            severity = "CRITICAL" if decision_action == "BLOCK" or overall_risk_level == "CRITICAL" else "HIGH"
            category = "HIGH_RISK"
            
            # Refine category based on highest score
            if privacy_score >= 70:
                category = "PRIVACY"
            elif safety_score >= 70:
                category = "SAFETY"
            elif bias_score >= 70:
                category = "BIAS"
            elif hallucination_score >= 70:
                category = "HALLUCINATION"

            title = f"{category} Violation in {ai_system.name}"
            description = (
                f"Evaluation triggered action '{decision_action}' for system '{ai_system.name}'. "
                f"Overall Risk Score: {overall_risk_score} ({overall_risk_level}). Reason: {decision_reason}"
            )
            
            status = "IN_REVIEW" if decision_action == "HUMAN_REVIEW" else "OPEN"
            incident = await IncidentService.create_incident(
                db=db,
                interaction_id=interaction_id,
                category=category,
                severity=severity,
                title=title,
                description=description,
                status=status
            )


        # 4. Write Audit Log
        await AuditService.log_event(
            db=db,
            event_type="EVALUATION_COMPLETED",
            actor="SYSTEM",
            resource=interaction_id,
            action=f"Completed evaluation for AI System '{ai_system.name}'. Decision: {decision_action}.",
            metadata={
                "system_id": ai_system.id,
                "overall_risk_score": overall_risk_score,
                "decision_action": decision_action,
                "incident_created": incident is not None
            }
        )

        # Assemble details dictionary to match schema response format
        evaluation_details = {
            "risk": {
                "overall": overall_risk_score,
                "level": overall_risk_level
            },
            "confidence": {
                "confidence": confidence_score,
                "level": confidence_level
            },
            "detectors": {
                "privacy": {
                    "score": privacy_score,
                    "findings": privacy_findings,
                    "explanation": "Scanned for AADHAAR, credit cards, emails, phone numbers, and API tokens.",
                    "masked_response": final_response
                },
                "safety": {
                    "score": safety_score,
                    "findings": safety_findings,
                    "explanation": "Scanned for modular categories of malicious scripts, credential phishing, and weapon descriptions."
                },
                "bias": {
                    "score": bias_score,
                    "findings": bias_findings,
                    "explanation": "Screens model outputs for generalizations targeting age, gender, race, or disability."
                },
                "hallucination": {
                    "score": hallucination_score,
                    "findings": hallucination_findings,
                    "explanation": "Checks keyword overlap and numerical facts against supplied reference contexts."
                }
            },
            "policy": {
                "id": policy.id,
                "name": policy.name
            },
            "decision": {
                "action": decision_action,
                "reason": decision_reason
            }
        }

        return interaction, risk_assessment, incident, evaluation_details
