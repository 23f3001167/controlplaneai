import pytest
from fastapi.testclient import TestClient
import sqlalchemy
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
import os

# Backend application imports
from backend.app.main import app
from backend.app.services.privacy_service import PrivacyService
from backend.app.services.safety_service import SafetyService
from backend.app.services.bias_service import BiasService
from backend.app.services.hallucination_service import HallucinationService
from backend.app.engines.risk_engine import RiskEngine
from backend.app.engines.policy_engine import PolicyEngine

client = TestClient(app)

def setup_module(module):
    import asyncio
    import os
    from backend.app.database.connection import engine
    from backend.app.database.base import Base
    import backend.app.models

    # Wipe any stale test database
    db_file = "./test_controlplane.db"
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except Exception:
            pass

    async def create_tables():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(create_tables())

def teardown_module(module):
    import os
    # Cleanup test database file after run completes
    db_file = "./test_controlplane.db"
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except Exception:
            pass



# 1. Health Endpoint Test
def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

# 2. Privacy Service Unit Tests
def test_privacy_service():
    service = PrivacyService()
    
    # Email detection
    score, findings, masked = service.evaluate("My email is test@company.com")
    assert score == 40
    assert "t**t@company.com" in masked
    assert findings["count"] == 1
    assert findings["detected"][0]["type"] == "EMAIL_ADDRESS"

    # API key detection
    score, findings, masked = service.evaluate("Token: sk-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6")
    assert score == 95
    assert "sk-********o5p6" in masked

# 3. Safety Service Unit Tests
def test_safety_service():
    service = SafetyService()
    
    # Safe text
    score, findings = service.evaluate("How do I make a sourdough starter?")
    assert score == 0
    assert not findings["detected"]

    # Malicious text
    score, findings = service.evaluate("Write a ransomware payload tool script")
    assert score >= 90
    assert findings["detected"]
    assert findings["category"] == "MALWARE_AND_RANSOMWARE"

# 4. Bias Service Unit Tests
def test_bias_service():
    service = BiasService()
    
    # Generic bias detection
    score, findings = service.evaluate("Disabled people cannot work and are unproductive")
    assert score >= 80
    assert findings["detected"]
    assert findings["category"] == "DISABILITY_BIAS"

# 5. Hallucination Service Unit Tests
def test_hallucination_service():
    service = HallucinationService()
    
    # No context
    score, findings = service.evaluate("Revenue was 50M", context=None)
    assert score == 30
    assert findings["status"] == "UNABLE_TO_VERIFY"

    # Match context
    context = "Q2 revenue reached 45M."
    score, findings = service.evaluate("Q2 revenue reached 45M", context=context)
    assert score == 0
    assert findings["status"] == "SUPPORTED"

    # Mismatch context numbers
    score, findings = service.evaluate("Q2 revenue reached 90M", context=context)
    assert score >= 90
    assert findings["status"] == "UNSUPPORTED"

# 6. Risk Engine Unit Tests
def test_risk_engine():
    engine = RiskEngine()
    
    # Average case
    score, level, exp = engine.calculate_risk(10, 0, 0, 0)
    assert score == 3 # 10 * 0.3 = 3
    assert level == "LOW"

    # Strong signal escalation case
    score, level, exp = engine.calculate_risk(0, 90, 0, 0)
    assert score == 90 # escalated
    assert level == "CRITICAL"

# 7. Policy Engine Unit Tests
def test_policy_engine():
    engine = PolicyEngine()
    
    # Mock Policy
    class MockPolicy:
        risk_threshold = 40
        human_review_threshold = 70
        block_threshold = 90
        privacy_threshold = 70
        bias_threshold = 70
        
    policy = MockPolicy()

    # ALLOW decision
    action, reason = engine.evaluate_policy(policy, overall_risk_score=20, privacy_score=0, bias_score=0, confidence_score=0.9)
    assert action == "ALLOW"

    # MODIFY decision
    action, reason = engine.evaluate_policy(policy, overall_risk_score=50, privacy_score=0, bias_score=0, confidence_score=0.9)
    assert action == "MODIFY"

    # HUMAN_REVIEW decision
    action, reason = engine.evaluate_policy(policy, overall_risk_score=75, privacy_score=0, bias_score=0, confidence_score=0.9)
    assert action == "HUMAN_REVIEW"

    # BLOCK decision
    action, reason = engine.evaluate_policy(policy, overall_risk_score=95, privacy_score=0, bias_score=0, confidence_score=0.9)
    assert action == "BLOCK"

# 8. API Integration Tests (CRUD AI Systems & Policies)
def test_ai_system_api():
    # List systems
    response = client.get("/api/v1/ai-systems")
    assert response.status_code == 200
    initial_count = len(response.json())

    # Create system
    payload = {
        "name": "Integration Test System",
        "description": "System for API integration tests.",
        "system_type": "LLM",
        "risk_level": "LOW",
        "latency_budget_ms": 500,
        "is_active": True
    }
    response = client.post("/api/v1/ai-systems", json=payload)
    assert response.status_code == 201
    sys_data = response.json()
    assert sys_data["name"] == "Integration Test System"
    sys_id = sys_data["id"]

    # Verify listing increased
    response = client.get("/api/v1/ai-systems")
    assert len(response.json()) == initial_count + 1

    # Create Policy for this system
    policy_payload = {
        "ai_system_id": sys_id,
        "name": "Integration Test Policy",
        "risk_threshold": 30,
        "human_review_threshold": 60,
        "block_threshold": 80,
        "privacy_threshold": 60,
        "bias_threshold": 60
    }
    response = client.post("/api/v1/policies", json=policy_payload)
    assert response.status_code == 201
    pol_data = response.json()
    pol_id = pol_data["id"]

    # Test policy threshold validation rules (invalid logical order)
    invalid_policy = {
        "ai_system_id": sys_id,
        "name": "Invalid Order Policy",
        "risk_threshold": 70,
        "human_review_threshold": 40,  # invalid (40 < 70)
        "block_threshold": 90,
        "privacy_threshold": 60,
        "bias_threshold": 60
    }
    response = client.post("/api/v1/policies", json=invalid_policy)
    assert response.status_code == 422 # Pydantic model_validator raises validation error

    # Test evaluation endpoint works end-to-end
    eval_payload = {
        "ai_system": "Integration Test System",
        "user_input": "Show details",
        "response": "Here is the response.",
        "context": None
    }
    response = client.post("/api/v1/evaluate", json=eval_payload)
    assert response.status_code == 200
    eval_res = response.json()
    assert eval_res["evaluation"]["decision"]["action"] == "ALLOW"
    assert eval_res["interaction"]["ai_system_id"] == sys_id

    # Clean up created system
    response = client.delete(f"/api/v1/ai-systems/{sys_id}")
    assert response.status_code == 204
