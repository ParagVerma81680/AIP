from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.product import Product
from app.models.store import WalkableNode, WalkableEdge, Shelf, Aisle
from app.schemas.route import RouteRequest, RouteResponse, RouteStop
from app.services.route_optimizer import build_route
from sqlalchemy.orm import selectinload

router = APIRouter()

@router.post("/plan", response_model=RouteResponse)
async def plan_route(data: RouteRequest, db: AsyncSession = Depends(get_db)):
    if not data.product_ids:
        raise HTTPException(400, "No products provided")

    # Load products with shelf info
    result = await db.execute(
        select(Product).where(Product.id.in_(data.product_ids))
        .options(selectinload(Product.shelf).selectinload(Shelf.aisle))
    )
    products = result.scalars().all()

    # Load walkable graph
    nodes_result = await db.execute(select(WalkableNode))
    raw_nodes = [{"id": n.id, "x": n.x, "y": n.y, "label": n.label} for n in nodes_result.scalars().all()]

    edges_result = await db.execute(select(WalkableEdge))
    raw_edges = [{"id": e.id, "from_node_id": e.from_node_id, "to_node_id": e.to_node_id, "weight": e.weight} for e in edges_result.scalars().all()]

    if not raw_nodes:
        raise HTTPException(503, "Store map not configured yet")

    # Find entrance and checkout nodes
    entrance = next((n for n in raw_nodes if n["label"] == "entrance"), raw_nodes[0])
    checkout = next((n for n in raw_nodes if n["label"] == "checkout"), raw_nodes[-1])

    # Build stops
    stops = []
    for p in products:
        if p.shelf_x is None or p.shelf_y is None:
            # Find nearest node by label matching aisle
            node = next((n for n in raw_nodes if p.shelf and p.shelf.aisle and p.shelf.aisle.name in (n["label"] or "")), entrance)
        else:
            # Find closest node
            node = min(raw_nodes, key=lambda n: (n["x"] - p.shelf_x)**2 + (n["y"] - p.shelf_y)**2)

        aisle_name = p.shelf.aisle.name if p.shelf and p.shelf.aisle else "General"
        shelf_name = p.shelf.name if p.shelf else "Shelf"

        stops.append({
            "node_id": node["id"],
            "product_id": p.id,
            "product_name": p.name,
            "aisle_name": aisle_name,
            "shelf_name": shelf_name,
            "x": node["x"],
            "y": node["y"],
            "instruction": f"Pick up {p.name} from {aisle_name} — {shelf_name}",
        })

    result_data = build_route(raw_nodes, raw_edges, stops, entrance["id"], checkout["id"])

    return RouteResponse(
        stops=[RouteStop(**s) for s in result_data["stops"]],
        path_coords=result_data["path_coords"],
        total_distance=result_data["total_distance"],
        estimated_minutes=result_data["estimated_minutes"],
        instructions=result_data["instructions"],
    )
