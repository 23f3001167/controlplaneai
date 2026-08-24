import sys
import os

# Dynamic path resolution to support absolute backend imports from any directory context
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if root_path not in sys.path:
    sys.path.insert(0, root_path)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# Database & Models
from backend.app.database.connection import engine, ensure_database_exists, DATABASE_URL
from backend.app.database.base import Base
import backend.app.models # Force import of all models to load metadata

# API Routers
from backend.app.api import (
    ai_systems,
    evaluation,
    incidents,
    policies,
    dashboard,
    audit_logs,
    interactions,
    interventions,
    agent_traces
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database exists (creates it on PostgreSQL if missing)
    await ensure_database_exists()
    
    # Initialize SQLite database and tables asynchronously if not using migrations
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Cleanup connection pool if required
    await engine.dispose()


app = FastAPI(
    title="ControlPlane.ai Backend API",
    description="Real-Time AI Governance, Risk Assessment & Control Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import HTMLResponse

@app.get("/", response_class=HTMLResponse, tags=["Welcome"])
async def root_welcome():
    return """
    <html>
        <head>
            <title>ControlPlane.ai Backend Engine</title>
            <style>
                body { font-family: sans-serif; background: #0b0f19; color: #e2e8f0; text-align: center; padding: 50px; }
                h1 { color: #3b82f6; }
                a { color: #10b981; text-decoration: none; font-weight: bold; }
                .box { max-width: 600px; margin: auto; background: #151c2c; padding: 30px; border-radius: 12px; border: 1px solid #222f47; }
            </style>
        </head>
        <body>
            <div class="box">
                <h1>ControlPlane.ai Compliance Engine</h1>
                <p>Welcome! The backend service is running successfully.</p>
                <p>Interactive docs: <a href="/docs">/docs (Swagger)</a></p>
                <p>Health check: <a href="/health">/health</a></p>
            </div>
        </body>
    </html>
    """

# Health endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "ControlPlane.ai Engine"}


# Include Routers with exact required prefixing
app.include_router(ai_systems.router, prefix="/api/v1/ai-systems", tags=["AI Systems"])
app.include_router(evaluation.router, prefix="/api/v1/evaluate", tags=["Evaluation Pipeline"])
app.include_router(interactions.router, prefix="/api/v1/interactions", tags=["Interactions"])
app.include_router(policies.router, prefix="/api/v1/policies", tags=["Policies"])
app.include_router(incidents.router, prefix="/api/v1/incidents", tags=["Incidents"])
app.include_router(interventions.router, prefix="/api/v1/interventions", tags=["Interventions"])
app.include_router(audit_logs.router, prefix="/api/v1/audit-logs", tags=["Audit Logs"])
app.include_router(agent_traces.router, prefix="/api/v1/agent-traces", tags=["Agent Traces"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
