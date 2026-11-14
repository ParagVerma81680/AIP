from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str]
    image_url: Optional[str]
    sort_order: int
    model_config = {"from_attributes": True}

class ProductOut(BaseModel):
    id: int
    name: str
    brand: Optional[str]
    category_id: Optional[int]
    category: Optional[CategoryOut]
    description: Optional[str]
    image_url: Optional[str]
    quantity_label: Optional[str]
    price: float
    original_price: Optional[float]
    discount_pct: int
    stock: int
    is_available: bool
    shelf_id: Optional[int]
    shelf_x: Optional[float]
    shelf_y: Optional[float]
    model_config = {"from_attributes": True}

class ProductCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    quantity_label: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    discount_pct: int = 0
    stock: int = 100
    is_available: bool = True
    shelf_id: Optional[int] = None
    shelf_x: Optional[float] = None
    shelf_y: Optional[float] = None

class ProductUpdate(ProductCreate):
    pass
