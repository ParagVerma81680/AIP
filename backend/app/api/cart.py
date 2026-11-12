from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartOut, CartItemAdd, CartItemUpdate, CartItemOut
from app.api.deps import get_current_user

router = APIRouter()

DELIVERY_FREE_THRESHOLD = 500
DELIVERY_CHARGE = 40

async def compute_cart(cart: Cart) -> dict:
    subtotal = sum(item.product.price * item.quantity for item in cart.items)
    delivery = 0 if subtotal >= DELIVERY_FREE_THRESHOLD else DELIVERY_CHARGE
    return {"subtotal": round(subtotal, 2), "delivery_charge": delivery, "total": round(subtotal + delivery, 2)}

@router.get("", response_model=CartOut)
async def get_cart(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Cart).where(Cart.user_id == current_user.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    cart = result.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
    totals = await compute_cart(cart)
    return CartOut(id=cart.id, items=cart.items, **totals)

@router.post("/items")
async def add_item(data: CartItemAdd, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cart).where(Cart.user_id == current_user.id))
    cart = result.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        await db.flush()

    result2 = await db.execute(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == data.product_id)
    )
    existing = result2.scalar_one_or_none()
    if existing:
        existing.quantity += data.quantity
    else:
        item = CartItem(cart_id=cart.id, product_id=data.product_id, quantity=data.quantity)
        db.add(item)
    await db.commit()
    return {"status": "ok"}

@router.put("/items/{item_id}")
async def update_item(item_id: int, data: CartItemUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CartItem).join(Cart).where(Cart.user_id == current_user.id, CartItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    if data.quantity <= 0:
        await db.delete(item)
    else:
        item.quantity = data.quantity
    await db.commit()
    return {"status": "ok"}

@router.delete("/items/{item_id}")
async def remove_item(item_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CartItem).join(Cart).where(Cart.user_id == current_user.id, CartItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    await db.delete(item)
    await db.commit()
    return {"status": "ok"}

@router.delete("")
async def clear_cart(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cart).where(Cart.user_id == current_user.id))
    cart = result.scalar_one_or_none()
    if cart:
        await db.execute(CartItem.__table__.delete().where(CartItem.cart_id == cart.id))
        await db.commit()
    return {"status": "ok"}
