from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.connection import get_db
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/overview")
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    """
    Returns metrics and charts data for the dashboard landing page.
    """
    data = await AnalyticsService.get_dashboard_data(db)
    return data
