from pydantic import BaseModel
from typing import List
from app.schemas.product import ProductOut

class CartItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductOut
    model_config = {"from_attributes": True}

class CartOut(BaseModel):
    id: int
    items: List[CartItemOut] = []
    subtotal: float = 0
    delivery_charge: float = 0
    total: float = 0
    model_config = {"from_attributes": True}

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int
