from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    is_admin: bool
    created_at: Optional[datetime]
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class AddressCreate(BaseModel):
    label: str = "Home"
    line1: str
    line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    pincode: Optional[str] = None
    is_default: bool = False

class AddressOut(BaseModel):
    id: int
    label: str
    line1: str
    line2: Optional[str]
    city: str
    state: Optional[str]
    pincode: Optional[str]
    is_default: bool
    model_config = {"from_attributes": True}
