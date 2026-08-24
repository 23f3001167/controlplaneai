from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.database.connection import get_db
from backend.app.models.ai_system import AISystem
from backend.app.schemas.ai_system import AISystemCreate, AISystemUpdate, AISystemResponse
from backend.app.services.audit_service import AuditService

router = APIRouter()

@router.get("", response_model=List[AISystemResponse])
async def list_ai_systems(
    system_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AISystem).order_by(AISystem.name)

    if system_type:
        stmt = stmt.where(AISystem.system_type == system_type)
    if risk_level:
        stmt = stmt.where(AISystem.risk_level == risk_level)
    if is_active is not None:
        stmt = stmt.where(AISystem.is_active == is_active)
    if search:
        stmt = stmt.where(AISystem.name.contains(search) | AISystem.description.contains(search))

    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.post("", response_model=AISystemResponse, status_code=status.HTTP_201_CREATED)
async def create_ai_system(system_in: AISystemCreate, db: AsyncSession = Depends(get_db)):
    # Check uniqueness
    existing_res = await db.execute(select(AISystem).where(AISystem.name == system_in.name))
    if existing_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"AI System with name '{system_in.name}' already exists."
        )

    system = AISystem(**system_in.model_dump())
    db.add(system)
    await db.commit()
    await db.refresh(system)

    # Log audit
    await AuditService.log_event(
        db=db,
        event_type="AI_SYSTEM_CREATED",
        actor="ADMIN",
        resource=system.id,
        action=f"Created new AI System '{system.name}' of type {system.system_type}.",
        metadata=system_in.model_dump()
    )

    return system

@router.get("/{system_id}", response_model=AISystemResponse)
async def get_ai_system(system_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AISystem).where(AISystem.id == system_id))
    system = res.scalars().first()
    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI System with ID {system_id} not found."
        )
    return system

@router.put("/{system_id}", response_model=AISystemResponse)
async def update_ai_system(system_id: str, system_in: AISystemUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AISystem).where(AISystem.id == system_id))
    system = res.scalars().first()
    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI System with ID {system_id} not found."
        )

    update_data = system_in.model_dump(exclude_unset=True)
    if not update_data:
        return system

    for key, value in update_data.items():
        setattr(system, key, value)

    db.add(system)
    await db.commit()
    await db.refresh(system)

    # Log audit
    await AuditService.log_event(
        db=db,
        event_type="AI_SYSTEM_UPDATED",
        actor="ADMIN",
        resource=system.id,
        action=f"Updated AI System '{system.name}'. Updated fields: {list(update_data.keys())}.",
        metadata=update_data
    )

    return system

@router.delete("/{system_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ai_system(system_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AISystem).where(AISystem.id == system_id))
    system = res.scalars().first()
    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI System with ID {system_id} not found."
        )

    name = system.name
    await db.delete(system)
    await db.commit()

    # Log audit
    await AuditService.log_event(
        db=db,
        event_type="AI_SYSTEM_DELETED",
        actor="ADMIN",
        resource=system_id,
        action=f"Deleted AI System '{name}' permanently.",
        metadata={"deleted_system_id": system_id, "name": name}
    )

from pydantic import BaseModel
from backend.app.services.generation_service import GenerationService

class GenerateRequest(BaseModel):
    prompt: str

@router.post("/{system_id}/generate")
async def generate_system_response(
    system_id: str,
    payload: GenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulates dynamic AI model generation based on system prompt configurations.
    """
    res = await db.execute(select(AISystem).where(AISystem.id == system_id))
    system = res.scalars().first()
    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI System with ID {system_id} not found."
        )
    if not system.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI System is inactive."
        )

    response, context = GenerationService.generate_response(payload.prompt)
    return {
        "generated_response": response,
        "context": context
    }

