from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.product import ProductOut

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: ProductOut
    model_config = {"from_attributes": True}

class OrderOut(BaseModel):
    id: int
    status: str
    subtotal: float
    delivery_charge: float
    total: float
    payment_method: str
    notes: Optional[str]
    created_at: Optional[datetime]
    items: List[OrderItemOut] = []
    model_config = {"from_attributes": True}

class OrderCreate(BaseModel):
    address_id: Optional[int] = None
    payment_method: str = "cod"
    notes: Optional[str] = None
