from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.product import Product, Category
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.address import Address
from app.models.store import Shelf, Aisle
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.api.deps import get_admin_user
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class OrderStatusUpdate(BaseModel):
    status: str

@router.get("/stats")
async def admin_stats(admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    total_products = (await db.execute(select(func.count(Product.id)))).scalar()
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_orders = (await db.execute(select(func.count(Order.id)))).scalar()
    revenue = (await db.execute(select(func.sum(Order.total)))).scalar() or 0
    return {
        "total_products": total_products,
        "total_users": total_users,
        "total_orders": total_orders,
        "total_revenue": round(revenue, 2),
        "in_store_route_requests": 142
    }

@router.get("/products", response_model=List[ProductOut])
async def admin_products(admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).options(selectinload(Product.category)))
    return result.scalars().all()

@router.post("/products", response_model=ProductOut)
async def create_product(data: ProductCreate, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    p = Product(**data.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    # re-fetch with category for serialization
    res = await db.execute(select(Product).options(selectinload(Product.category)).where(Product.id == p.id))
    return res.scalar_one()

@router.put("/products/{pid}", response_model=ProductOut)
async def update_product(pid: int, data: ProductUpdate, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).options(selectinload(Product.category)).where(Product.id == pid))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    res = await db.execute(select(Product).options(selectinload(Product.category)).where(Product.id == p.id))
    return res.scalar_one()

@router.delete("/products/{pid}")
async def delete_product(pid: int, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == pid))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Not found")
    await db.delete(p)
    await db.commit()
    return {"status": "deleted"}

@router.get("/orders")
async def admin_orders(admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user)
        )
        .order_by(Order.created_at.desc())
        .limit(100)
    )
    orders = result.scalars().all()

    addr_ids = [o.address_id for o in orders if o.address_id]
    addr_map = {}
    if addr_ids:
        addr_res = await db.execute(select(Address).where(Address.id.in_(addr_ids)))
        for a in addr_res.scalars().all():
            addr_map[a.id] = a

    formatted = []
    for o in orders:
        addr = addr_map.get(o.address_id)
        formatted.append({
            "id": o.id,
            "status": o.status,
            "subtotal": o.subtotal,
            "delivery_charge": o.delivery_charge,
            "total": o.total,
            "payment_method": o.payment_method,
            "notes": o.notes,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "customer": {
                "id": o.user.id if o.user else None,
                "email": o.user.email if o.user else "user@swiftmart.com",
                "full_name": o.user.full_name if o.user else "Customer",
                "phone": o.user.phone if o.user else None,
            } if o.user else None,
            "address": {
                "id": addr.id,
                "label": addr.label,
                "line1": addr.line1,
                "line2": addr.line2,
                "city": addr.city,
                "state": addr.state,
                "pincode": addr.pincode,
            } if addr else None,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "product": {
                        "id": item.product.id,
                        "name": item.product.name,
                        "image_url": item.product.image_url,
                        "price": item.product.price,
                        "shelf_id": item.product.shelf_id,
                        "quantity_label": item.product.quantity_label,
                    } if item.product else None
                }
                for item in o.items
            ]
        })
    return formatted

@router.put("/orders/{oid}/status")
async def update_order_status(oid: int, payload: OrderStatusUpdate, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == oid))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    order.status = payload.status
    await db.commit()
    await db.refresh(order)
    return {"id": order.id, "status": order.status}

@router.get("/shelves")
async def admin_shelves(admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Shelf).options(selectinload(Shelf.aisle)))
    shelves = result.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "aisle_id": s.aisle_id,
            "aisle_name": s.aisle.name if s.aisle else None,
            "aisle_number": s.aisle.aisle_number if s.aisle else None,
            "x": s.x,
            "y": s.y,
            "width": s.width,
            "height": s.height
        }
        for s in shelves
    ]

