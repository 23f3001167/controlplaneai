from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.app.database.connection import get_db

router = APIRouter()

@router.post("/reset-db")
async def reset_database(secret: str, db: AsyncSession = Depends(get_db)):
    """
    Administrative endpoint to truncate all database tables and achieve a clean slate.
    """
    if secret != "synergyy":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrative secret key."
        )
    
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
        try:
            # PostgreSQL CASCADE deletes foreign key constraints automatically
            await db.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
        except Exception:
            try:
                await db.execute(text(f"DELETE FROM {table}"))
            except Exception as ex:
                print(f"Error clearing table {table}: {ex}")
                
    await db.commit()
    return {"detail": "Database reset completed successfully."}
