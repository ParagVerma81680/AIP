from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.models.cart import Cart
from app.schemas.user import UserCreate, UserLogin, UserOut, Token, AddressCreate, AddressOut
from app.models.address import Address
from typing import List
import app.api.deps as deps

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        phone=data.phone,
    )
    db.add(user)
    await db.flush()
    cart = Cart(user_id=user.id)
    db.add(cart)
    await db.commit()
    await db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(deps.get_current_user)):
    return current_user

@router.get("/addresses", response_model=List[AddressOut])
async def list_addresses(current_user: User = Depends(deps.get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Address).where(Address.user_id == current_user.id))
    return result.scalars().all()

@router.post("/addresses", response_model=AddressOut)
async def add_address(data: AddressCreate, current_user: User = Depends(deps.get_current_user), db: AsyncSession = Depends(get_db)):
    address = Address(user_id=current_user.id, **data.model_dump())
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address
