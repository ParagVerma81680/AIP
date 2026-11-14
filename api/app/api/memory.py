from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.core.database import get_db
from app.models.user import User
from app.models.memory import Memory, UserPreference
from app.api.deps import get_current_user
from app.services.memory_service import MemoryService
from pydantic import BaseModel

router = APIRouter()

class MemoryOut(BaseModel):
    id: int
    category: str
    fact_text: str
    importance: float
    model_config = {"from_attributes": True}

class MemoryCreate(BaseModel):
    category: str = "preference"
    fact_text: str
    importance: float = 1.0

class PreferenceUpdate(BaseModel):
    dietary_preferences: Optional[str] = None
    default_budget: Optional[float] = None
    memory_enabled: Optional[bool] = None

@router.get("", response_model=List[MemoryOut])
async def list_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all long-term memories stored for the authenticated user."""
    res = await db.execute(select(Memory).where(Memory.user_id == current_user.id, Memory.is_active == True))
    return res.scalars().all()

@router.post("", response_model=MemoryOut)
async def create_memory(
    data: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually add a memory or fact for the user."""
    from app.services.ai.factory import AIProviderFactory
    provider = AIProviderFactory.get_provider()
    embedding = await provider.generate_embedding(data.fact_text)

    mem = Memory(
        user_id=current_user.id,
        category=data.category,
        fact_text=data.fact_text,
        importance=data.importance,
        embedding=embedding,
    )
    db.add(mem)
    await db.commit()
    await db.refresh(mem)
    return mem

@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a specific memory."""
    res = await db.execute(select(Memory).where(Memory.id == memory_id, Memory.user_id == current_user.id))
    mem = res.scalar_one_or_none()
    if not mem:
        raise HTTPException(404, "Memory not found")
    await db.delete(mem)
    await db.commit()
    return {"status": "deleted"}

@router.delete("")
async def clear_all_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Wipe all memories for current user."""
    await MemoryService.clear_user_memories(db, current_user.id)
    return {"status": "all memories cleared"}
