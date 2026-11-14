from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.store import StoreSection, Aisle, Shelf, WalkableNode, WalkableEdge
from app.schemas.store import StoreMapOut, StoreSectionOut, WalkableNodeOut, WalkableEdgeOut

router = APIRouter()

@router.get("/map", response_model=StoreMapOut)
async def get_store_map(db: AsyncSession = Depends(get_db)):
    sections_result = await db.execute(
        select(StoreSection).options(
            selectinload(StoreSection.aisles).selectinload(Aisle.shelves)
        )
    )
    sections = sections_result.scalars().all()

    nodes_result = await db.execute(select(WalkableNode))
    nodes = nodes_result.scalars().all()

    edges_result = await db.execute(select(WalkableEdge))
    edges = edges_result.scalars().all()

    return StoreMapOut(
        sections=[StoreSectionOut.model_validate(s) for s in sections],
        nodes=[WalkableNodeOut.model_validate(n) for n in nodes],
        edges=[WalkableEdgeOut.model_validate(e) for e in edges],
    )
