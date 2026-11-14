from pydantic import BaseModel
from typing import List, Optional

class RouteRequest(BaseModel):
    product_ids: List[int]

class RouteStop(BaseModel):
    product_id: Optional[int]
    product_name: Optional[str]
    aisle_name: Optional[str]
    shelf_name: Optional[str]
    x: float
    y: float
    node_id: int
    instruction: str

class RoutePath(BaseModel):
    node_ids: List[int]
    coords: List[dict]   # [{"x": float, "y": float}]

class RouteResponse(BaseModel):
    stops: List[RouteStop]
    path_coords: List[dict]
    total_distance: float
    estimated_minutes: float
    instructions: List[str]
