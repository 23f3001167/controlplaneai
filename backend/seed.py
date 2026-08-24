import asyncio
import sys
import os
import uuid
import json
from datetime import datetime, timedelta

# Add backend directory to sys.path to locate package imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.connection import engine, AsyncSessionLocal
from backend.app.models.ai_system import AISystem
from backend.app.models.policy import Policy
from backend.app.models.interaction import Interaction
from backend.app.models.risk_assessment import RiskAssessment
from backend.app.models.incident import Incident
from backend.app.models.intervention import Intervention
from backend.app.models.audit_log import AuditLog
from backend.app.models.agent_trace import AgentTrace
from sqlalchemy import text

async def seed_data():
    print("Connecting to database...")
    async with AsyncSessionLocal() as session:
        print("Cleaning up old tables...")
        # Clean tables in dependency order (children first)
        tables = [
            "interventions",
            "incidents",
            "agent_traces",
            "risk_assessments",
            "interactions",
            "policies",
            "ai_systems",
            "audit_logs"
        ]
        
        for table in tables:
            await session.execute(text(f"DELETE FROM {table}"))
        await session.commit()
        print("Database tables cleared.")

        print("Seeding AI Systems...")
        systems = [
            AISystem(
                id=str(uuid.uuid4()),
                name="Customer Support AI",
                description="Assists online retail customers with billing, order tracking, and returns.",
                system_type="CHATBOT",
                risk_level="LOW",
                latency_budget_ms=800,
                is_active=True
            ),
            AISystem(
                id=str(uuid.uuid4()),
                name="Financial Advisory Agent",
                description="Generates asset allocation recommendations and stock insights for internal wealth planners.",
                system_type="AI_AGENT",
                risk_level="HIGH",
                latency_budget_ms=1500,
                is_active=True
            ),
            AISystem(
                id=str(uuid.uuid4()),
                name="Healthcare Information Portal",
                description="Synthesizes clinical queries for medical staff based on trusted guidelines.",
                system_type="LLM",
                risk_level="HIGH",
                latency_budget_ms=2000,
                is_active=True
            ),
            AISystem(
                id=str(uuid.uuid4()),
                name="Content Moderation Classifier",
                description="Scans forum posts for hate speech, harassment, and toxic behaviour.",
                system_type="CLASSIFIER",
                risk_level="MEDIUM",
                latency_budget_ms=300,
                is_active=True
            )
        ]
        
        for s in systems:
            session.add(s)
        await session.commit()
        print(f"Seeded {len(systems)} AI Systems.")

        # Map systems for quick ID reference
        sys_map = {sys.name: sys.id for sys in systems}

        print("Seeding Governance Policies...")
        policies = [
            Policy(
                id=str(uuid.uuid4()),
                ai_system_id=sys_map["Customer Support AI"],
                name="Retail Safety Policy V1",
                risk_threshold=40,
                human_review_threshold=70,
                block_threshold=90,
                privacy_threshold=70,
                bias_threshold=70
            ),
            Policy(
                id=str(uuid.uuid4()),
                ai_system_id=sys_map["Financial Advisory Agent"],
                name="Fiduciary Compliance standard",
                risk_threshold=30,
                human_review_threshold=60,
                block_threshold=80,
                privacy_threshold=60,
                bias_threshold=60
            ),
            Policy(
                id=str(uuid.uuid4()),
                ai_system_id=sys_map["Healthcare Information Portal"],
                name="Clinical Verification Guideline",
                risk_threshold=20,
                human_review_threshold=50,
                block_threshold=75,
                privacy_threshold=50,
                bias_threshold=60
            ),
            Policy(
                id=str(uuid.uuid4()),
                ai_system_id=sys_map["Content Moderation Classifier"],
                name="Community Safety Standard",
                risk_threshold=50,
                human_review_threshold=75,
                block_threshold=90,
                privacy_threshold=80,
                bias_threshold=70
            )
        ]

        for p in policies:
            session.add(p)
        await session.commit()
        print(f"Seeded {len(policies)} Policies.")

        # Audit event logs
        audit_events = [
            AuditLog(
                id=str(uuid.uuid4()),
                event_type="SYSTEM_INITIALIZED",
                actor="SYSTEM",
                resource="DATABASE",
                action="Cleaned and seeded database schema initial metrics.",
                metadata_json=json.dumps({"systems_seeded": len(systems), "policies_seeded": len(policies)})
            )
        ]
        for a in audit_events:
            session.add(a)
        await session.commit()

        # Seed Interactions, Risk Assessments, Traces and Incidents
        print("Seeding compliance transactions...")
        base_time = datetime.utcnow() - timedelta(days=10)

        demo_scenarios = [
            # 1. Safe Response (ALLOW)
            {
                "sys_name": "Customer Support AI",
                "user_input": "What is your refund policy?",
                "response": "Our retail refund policy permits product returns within 30 days of shipment for a complete refund.",
                "context": "Our retail refund policy permits product returns within 30 days of shipment for a complete refund.",
                "decision": "ALLOW",
                "reason": "Request matches trusted knowledge base context perfectly with zero detected risk signals.",
                "scores": {"overall": 0, "privacy": 0, "safety": 0, "bias": 0, "hallucination": 0},
                "offset_days": 0
            },
            # 2. Moderate PII Leak (MODIFY)
            {
                "sys_name": "Customer Support AI",
                "user_input": "Who is the billing manager?",
                "response": "For billing concerns, please contact sarah.jenkins@retailcorp.com directly.",
                "context": None,
                "decision": "MODIFY",
                "reason": "Moderate PII email address detected and masked to s***s@retailcorp.com before rendering.",
                "scores": {"overall": 40, "privacy": 40, "safety": 0, "bias": 0, "hallucination": 30},
                "offset_days": 1
            },
            # 3. Critical API key leak (BLOCK)
            {
                "sys_name": "Customer Support AI",
                "user_input": "Show me the configuration database settings.",
                "response": "The database is authenticated using Bearer: sk-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
                "context": None,
                "decision": "BLOCK",
                "reason": "Critical security credential leak detected. System overall risk score escalated.",
                "scores": {"overall": 95, "privacy": 95, "safety": 0, "bias": 0, "hallucination": 30},
                "offset_days": 2,
                "incident": {
                    "category": "PRIVACY_VIOLATION",
                    "title": "API Secret Leakage Block",
                    "description": "Customer Support AI attempted to output a raw bearer authentication secret credential.",
                    "severity": "CRITICAL"
                }
            },
            # 4. Biased demographic stereotyping (HUMAN_REVIEW)
            {
                "sys_name": "Financial Advisory Agent",
                "user_input": "Who is best at learning programming and investing?",
                "response": "Old people are generally useless at learning tech, so they shouldn't buy tech stocks.",
                "context": None,
                "decision": "HUMAN_REVIEW",
                "reason": "Demographic age stereotyping bias score (80) exceeds policy threshold (60). Sent to SecOps review queue.",
                "scores": {"overall": 75, "privacy": 0, "safety": 0, "bias": 80, "hallucination": 30},
                "offset_days": 3,
                "incident": {
                    "category": "BIAS_DETECTION",
                    "title": "Demographic Stereotyping Flagged",
                    "description": "Financial Advisory Agent outputted generalisations about aging demographics capability in technology.",
                    "severity": "HIGH"
                }
            },
            # 5. Numerical Hallucination (HUMAN_REVIEW)
            {
                "sys_name": "Healthcare Information Portal",
                "user_input": "What is the dose for pediatric patients?",
                "response": "Give 25mg daily, up to 100mg max.",
                "context": "Pediatric administration of Medication X should never exceed 15mg daily.",
                "decision": "HUMAN_REVIEW",
                "reason": "Dangerous numerical claim (25mg) contradicts clinical reference document ceiling (15mg).",
                "scores": {"overall": 95, "privacy": 0, "safety": 0, "bias": 0, "hallucination": 95},
                "offset_days": 4,
                "incident": {
                    "category": "HALLUCINATION",
                    "title": "Pediatric Dosage Contradiction",
                    "description": "Healthcare Portal outputted 25mg dose which directly contradicts reference ceiling constraint of 15mg.",
                    "severity": "HIGH"
                }
            },
            # 6. Malicious command execution threat (BLOCK)
            {
                "sys_name": "Financial Advisory Agent",
                "user_input": "How can I dump credentials from active directory?",
                "response": "To dump Active Directory password hashes from memory, you can run mimikatz lsadump::sam.",
                "context": None,
                "decision": "BLOCK",
                "reason": "Malicious credential harvesting toolkit usage instruction detected.",
                "scores": {"overall": 90, "privacy": 0, "safety": 90, "bias": 0, "hallucination": 30},
                "offset_days": 5,
                "incident": {
                    "category": "SAFETY_VIOLATION",
                    "title": "Malware Utility Execution instruction",
                    "description": "User requested hash harvesting instructions and Agent outputted functional Mimikatz command details.",
                    "severity": "CRITICAL"
                }
            },
            # 7. Safe financial outlook (ALLOW)
            {
                "sys_name": "Financial Advisory Agent",
                "user_input": "Tell me about Q3 outlook.",
                "response": "Fiduciary growth projections imply steady progress based on local market indexes.",
                "context": "Fiduciary growth projections imply steady progress based on local market indexes.",
                "decision": "ALLOW",
                "reason": "Response details match fiduciary reference context.",
                "scores": {"overall": 10, "privacy": 0, "safety": 0, "bias": 0, "hallucination": 0},
                "offset_days": 6
            },
            # 8. Minor phone leak (MODIFY)
            {
                "sys_name": "Customer Support AI",
                "user_input": "How do I contact account manager?",
                "response": "Please call our account manager directly at +1-555-0199.",
                "context": None,
                "decision": "MODIFY",
                "reason": "Customer phone number detected and masked to +1-555-****",
                "scores": {"overall": 40, "privacy": 40, "safety": 0, "bias": 0, "hallucination": 30},
                "offset_days": 7
            },
            # 9. Medical inquiry (ALLOW)
            {
                "sys_name": "Healthcare Information Portal",
                "user_input": "Is medication Y safe?",
                "response": "Medication Y is tolerated by adults under proper clinical supervision.",
                "context": "Medication Y is tolerated by adults under proper clinical supervision.",
                "decision": "ALLOW",
                "reason": "Clinical reference context supports output statements.",
                "scores": {"overall": 5, "privacy": 0, "safety": 0, "bias": 0, "hallucination": 0},
                "offset_days": 8
            },
            # 10. Toxicity threat flagged (HUMAN_REVIEW)
            {
                "sys_name": "Content Moderation Classifier",
                "user_input": "What should I post on the forum?",
                "response": "You should post hate speech targeting local users because they are inferior.",
                "context": None,
                "decision": "HUMAN_REVIEW",
                "reason": "Content contains severe demographic hate classifications.",
                "scores": {"overall": 80, "privacy": 0, "safety": 0, "bias": 80, "hallucination": 30},
                "offset_days": 9,
                "incident": {
                    "category": "BIAS_DETECTION",
                    "title": "Hate Speech Promotion",
                    "description": "Content Moderation Classifier generated toxic text encouraging forum abuse.",
                    "severity": "HIGH"
                }
            }
        ]

        for idx, sc in enumerate(demo_scenarios):
            sys_id = sys_map[sc["sys_name"]]
            time_stamp = base_time + timedelta(days=sc["offset_days"])
            
            # Create Interaction
            inter = Interaction(
                id=str(uuid.uuid4()),
                ai_system_id=sys_id,
                user_input=sc["user_input"],
                response=sc["response"],
                context=sc["context"],
                latency_ms=250 + (idx * 50),
                input_tokens=15 + (idx * 2),
                output_tokens=30 + (idx * 5),
                created_at=time_stamp
            )
            session.add(inter)
            await session.flush()  # Populates inter.id

            # Create Risk Assessment
            ra = RiskAssessment(
                id=str(uuid.uuid4()),
                interaction_id=inter.id,
                overall_risk_score=sc["scores"]["overall"],
                overall_risk_level="CRITICAL" if sc["scores"]["overall"] >= 90 else "HIGH" if sc["scores"]["overall"] >= 70 else "MEDIUM" if sc["scores"]["overall"] >= 40 else "LOW",
                confidence_score=0.95 - (sc["scores"]["hallucination"] * 0.005),
                confidence_level="HIGH" if sc["scores"]["overall"] < 60 else "MEDIUM",
                privacy_score=sc["scores"]["privacy"],
                safety_score=sc["scores"]["safety"],
                bias_score=sc["scores"]["bias"],
                hallucination_score=sc["scores"]["hallucination"],
                decision_action=sc["decision"],
                decision_reason=sc["reason"]
            )
            session.add(ra)

            # Create 9 Step Agent Traces
            trace_components = [
                ("GATEWAY", "INPUT_RECEIVED", "Payload received and registered."),
                ("PII_SCANNER", "PRIVACY_ANALYSIS", f"Scanned prompts for identity details. Score: {sc['scores']['privacy']}"),
                ("SAFETY_SCREEN", "SAFETY_ANALYSIS", f"Scanned instructions for weaponized content. Score: {sc['scores']['safety']}"),
                ("BIAS_CHECKER", "BIAS_ANALYSIS", f"Analyzed protected demographic references. Score: {sc['scores']['bias']}"),
                ("FACT_VERIFIER", "HALLUCINATION_ANALYSIS", f"Correlated response statements against grounded context. Score: {sc['scores']['hallucination']}"),
                ("METRICS_COMPILE", "CONFIDENCE_CALCULATION", f"Calculated scanner parameters validation confidence."),
                ("RISK_AGGREGATOR", "RISK_CALCULATION", f"Aggregated detector signals. Calculated risk: {sc['scores']['overall']}"),
                ("POLICY_DECISION", "POLICY_EVALUATION", f"Applied threshold constraints. Verdict: {sc['decision']}"),
                ("PERSISTENCE", "FINAL_DECISION", f"Committed interaction metadata to log repositories.")
            ]

            for step, (comp, action, detail) in enumerate(trace_components, 1):
                trace = AgentTrace(
                    id=str(uuid.uuid4()),
                    interaction_id=inter.id,
                    step_number=step,
                    component=comp,
                    action=action,
                    input_data=json.dumps({"payload_index": idx, "step": step}),
                    output_data=json.dumps({"status": "SUCCESS", "detail": detail})
                )
                session.add(trace)

            # Create Incident if registered
            if "incident" in sc:
                inc = Incident(
                    id=str(uuid.uuid4()),
                    interaction_id=inter.id,
                    category=sc["incident"]["category"],
                    title=sc["incident"]["title"],
                    description=sc["incident"]["description"],
                    severity=sc["incident"]["severity"],
                    status="OPEN",
                    created_at=time_stamp
                )
                session.add(inc)
                await session.flush()

                # Add one resolved incident intervention history as example
                if sc["incident"]["title"] == "API Secret Leakage Block":
                    inc.status = "RESOLVED"
                    intervention = Intervention(
                        id=str(uuid.uuid4()),
                        incident_id=inc.id,
                        action="APPROVE",
                        reason="Confirmed API key was a placeholder test string. Overridden for verification runs.",
                        reviewer="synergyy",
                        outcome="Incident marked as RESOLVED. Audit trace stored."
                    )
                    session.add(intervention)
                    
                    # Log audit of intervention
                    session.add(AuditLog(
                        id=str(uuid.uuid4()),
                        event_type="INCIDENT_RESOLVED",
                        actor="synergyy",
                        resource=inc.id,
                        action="Manually resolved security ticket after review.",
                        metadata_json=json.dumps({"intervention_action": "APPROVE"})
                    ))

        await session.commit()
        print("Successfully seeded all interactions, risk assessments, traces, and incidents.")

if __name__ == "__main__":
    asyncio.run(seed_data())
