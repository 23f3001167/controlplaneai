from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from backend.app.database.connection import get_db
from backend.app.models.policy import Policy
from backend.app.models.ai_system import AISystem
from backend.app.schemas.policy import PolicyCreate, PolicyUpdate, PolicyResponse
from backend.app.services.audit_service import AuditService

router = APIRouter()

@router.get("", response_model=List[PolicyResponse])
async def list_policies(
    ai_system_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Policy).options(joinedload(Policy.ai_system)).order_by(Policy.created_at.desc())
    if ai_system_id:
        stmt = stmt.where(Policy.ai_system_id == ai_system_id)
    
    result = await db.execute(stmt)
    policies = result.scalars().all()
    
    # Map database Policy to Response injecting ai_system_name
    response_list = []
    for p in policies:
        resp = PolicyResponse.model_validate(p)
        if p.ai_system:
            resp.ai_system_name = p.ai_system.name
        response_list.append(resp)

    return response_list

@router.post("", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(policy_in: PolicyCreate, db: AsyncSession = Depends(get_db)):
    # Verify AI System exists
    sys_res = await db.execute(select(AISystem).where(AISystem.id == policy_in.ai_system_id))
    system = sys_res.scalars().first()
    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI System with ID {policy_in.ai_system_id} does not exist."
        )

    policy = Policy(**policy_in.model_dump())
    db.add(policy)
    await db.commit()
    await db.refresh(policy)

    # Log audit
    await AuditService.log_event(
        db=db,
        event_type="POLICY_CREATED",
        actor="ADMIN",
        resource=policy.id,
        action=f"Created Policy '{policy.name}' for AI System '{system.name}'.",
        metadata=policy_in.model_dump()
    )

    resp = PolicyResponse.model_validate(policy)
    resp.ai_system_name = system.name
    return resp

@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Policy).options(joinedload(Policy.ai_system)).where(Policy.id == policy_id)
    result = await db.execute(stmt)
    policy = result.scalars().first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy with ID {policy_id} not found."
        )
    resp = PolicyResponse.model_validate(policy)
    if policy.ai_system:
        resp.ai_system_name = policy.ai_system.name
    return resp

@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: str,
    policy_in: PolicyUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Policy).options(joinedload(Policy.ai_system)).where(Policy.id == policy_id)
    result = await db.execute(stmt)
    policy = result.scalars().first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy with ID {policy_id} not found."
        )

    update_data = policy_in.model_dump(exclude_unset=True)
    if not update_data:
        resp = PolicyResponse.model_validate(policy)
        if policy.ai_system:
            resp.ai_system_name = policy.ai_system.name
        return resp

    # To ensure logical consistency:
    # Validate against updated fields combined with existing fields
    r_t = update_data.get("risk_threshold", policy.risk_threshold)
    h_t = update_data.get("human_review_threshold", policy.human_review_threshold)
    b_t = update_data.get("block_threshold", policy.block_threshold)
    
    if not (r_t <= h_t <= b_t):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Logical inconsistency: risk_threshold ({r_t}) must be <= human_review_threshold ({h_t}) <= block_threshold ({b_t})."
        )

    # Cache system name before commit/refresh expires the loaded relationship
    system_name = policy.ai_system.name if policy.ai_system else "Unknown"

    for key, value in update_data.items():
        setattr(policy, key, value)

    db.add(policy)
    await db.commit()
    await db.refresh(policy)

    # Log audit
    await AuditService.log_event(
        db=db,
        event_type="POLICY_UPDATED",
        actor="ADMIN",
        resource=policy.id,
        action=f"Updated Policy '{policy.name}' for AI System '{system_name}'. Fields updated: {list(update_data.keys())}.",
        metadata=update_data
    )

    resp = PolicyResponse.model_validate(policy)
    resp.ai_system_name = system_name
    return resp


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(policy_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Policy).where(Policy.id == policy_id)
    result = await db.execute(stmt)
    policy = result.scalars().first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy with ID {policy_id} not found."
        )

    name = policy.name
    await db.delete(policy)
    await db.commit()

    # Log audit
    await AuditService.log_event(
        db=db,
        event_type="POLICY_DELETED",
        actor="ADMIN",
        resource=policy_id,
        action=f"Deleted Policy '{name}' permanently.",
        metadata={"deleted_policy_id": policy_id, "name": name}
    )
