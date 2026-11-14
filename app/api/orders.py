from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.order import Order, OrderItem
from app.models.cart import Cart, CartItem
from app.models.user import User
from app.schemas.order import OrderOut, OrderCreate
from app.api.deps import get_current_user
from typing import List

router = APIRouter()

@router.get("", response_model=List[OrderOut])
async def list_orders(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(Order.user_id == current_user.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()

@router.post("", response_model=OrderOut)
async def create_order(data: OrderCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Cart).where(Cart.user_id == current_user.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    cart = result.scalar_one_or_none()
    if not cart or not cart.items:
        raise HTTPException(400, "Cart is empty")

    subtotal = sum(item.product.price * item.quantity for item in cart.items)
    delivery = 0 if subtotal >= 500 else 40
    total = subtotal + delivery

    order = Order(
        user_id=current_user.id,
        subtotal=round(subtotal, 2),
        delivery_charge=delivery,
        total=round(total, 2),
        address_id=data.address_id,
        payment_method=data.payment_method,
        notes=data.notes,
        status="confirmed",
    )
    db.add(order)
    await db.flush()

    for item in cart.items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.product.price,
        ))

    await db.execute(CartItem.__table__.delete().where(CartItem.cart_id == cart.id))
    await db.commit()
    await db.refresh(order)
    return order

@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    return order
