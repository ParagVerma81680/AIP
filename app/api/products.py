from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.product import Product, Category
from app.schemas.product import ProductOut, CategoryOut
from typing import List, Optional

router = APIRouter()

@router.get("", response_model=List[ProductOut])
async def list_products(
    category_id: Optional[int] = None,
    q: Optional[str] = None,
    limit: int = Query(40, le=100),
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).options(selectinload(Product.category)).where(Product.is_available == True)
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if q:
        stmt = stmt.where(
            or_(
                Product.name.ilike(f"%{q}%"),
                Product.brand.ilike(f"%{q}%"),
                Product.description.ilike(f"%{q}%"),
            )
        )
    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/featured", response_model=List[ProductOut])
async def featured_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).options(selectinload(Product.category)).where(Product.is_available == True).order_by(Product.discount_pct.desc()).limit(12)
    )
    return result.scalars().all()

@router.get("/search/suggestions")
async def search_suggestions(q: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product.name, Product.brand).where(
            or_(Product.name.ilike(f"%{q}%"), Product.brand.ilike(f"%{q}%"))
        ).limit(8)
    )
    rows = result.all()
    suggestions = list({r[0] for r in rows} | {r[1] for r in rows if r[1]})
    return {"suggestions": suggestions[:8]}

@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).options(selectinload(Product.category)).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")
    return product
