from pydantic import BaseModel
from typing import Optional, List, Any, Dict

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    session_id: Optional[str] = None
    cart_product_ids: Optional[List[int]] = []

class ProductInfo(BaseModel):
    id: int
    name: str
    brand: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    discount_pct: Optional[int] = 0
    quantity_label: Optional[str] = None
    image_url: Optional[str] = None
    aisle_name: Optional[str] = None
    shelf_name: Optional[str] = None
    section_name: Optional[str] = None
    shelf_x: Optional[float] = None
    shelf_y: Optional[float] = None
    is_available: bool = True

class RouteSummary(BaseModel):
    total_distance: Optional[float] = None
    estimated_minutes: Optional[float] = None
    stops_count: int = 0
    product_ids: List[int] = []
    instructions: List[str] = []

class ChatResponse(BaseModel):
    reply: str
    conversation_id: int
    tool_results: Optional[List[Any]] = []
    suggested_products: Optional[List[int]] = []
    products_data: Optional[List[ProductInfo]] = []
    route_generated: bool = False
    route_summary: Optional[RouteSummary] = None
    action: Optional[str] = None
    quick_suggestions: Optional[List[str]] = []
