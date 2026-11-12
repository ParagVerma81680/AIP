from pydantic import BaseModel
from typing import Optional, List

class ShelfOut(BaseModel):
    id: int
    name: Optional[str]
    x: Optional[float]
    y: Optional[float]
    width: float
    height: float
    model_config = {"from_attributes": True}

class AisleOut(BaseModel):
    id: int
    name: str
    aisle_number: Optional[int]
    shelves: List[ShelfOut] = []
    model_config = {"from_attributes": True}

class StoreSectionOut(BaseModel):
    id: int
    name: str
    color: str
    x: Optional[float]
    y: Optional[float]
    width: Optional[float]
    height: Optional[float]
    aisles: List[AisleOut] = []
    model_config = {"from_attributes": True}

class WalkableNodeOut(BaseModel):
    id: int
    x: float
    y: float
    label: Optional[str]
    model_config = {"from_attributes": True}

class WalkableEdgeOut(BaseModel):
    id: int
    from_node_id: int
    to_node_id: int
    weight: float
    model_config = {"from_attributes": True}

class StoreMapOut(BaseModel):
    sections: List[StoreSectionOut]
    nodes: List[WalkableNodeOut]
    edges: List[WalkableEdgeOut]
