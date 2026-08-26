import asyncio
import sys
import os
from sqlalchemy import text

# Dynamic path resolution to support absolute backend imports
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_path not in sys.path:
    sys.path.insert(0, root_path)

from app.database.connection import AsyncSessionLocal

async def reset():
    print("Connecting to database and truncating all tables...")
    # List of tables in reverse dependency order
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
    async with AsyncSessionLocal() as session:
        for table in tables:
            try:
                # CASCADE automatically deletes dependent foreign keys safely
                await session.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
                print(f"Cleared table: {table}")
            except Exception:
                try:
                    await session.execute(text(f"DELETE FROM {table}"))
                    print(f"Cleared rows from table: {table} (fallback)")
                except Exception as ex:
                    print(f"Error clearing table {table}: {ex}")
        await session.commit()
    print("Database reset completed successfully. The application is now at a clean slate!")

if __name__ == "__main__":
    asyncio.run(reset())
