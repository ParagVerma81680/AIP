"""
Verification test for SwiftMart Seed Data
Checks:
- Categories count and fields
- Store sections, aisles, shelves
- Walkable graph connectivity (BFS from entrance to all nodes and checkout)
- Product shelf linkage & coordinates
- Route planner execution with sample products
"""

import asyncio
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.models.product import Category, Product
from app.models.store import StoreSection, Aisle, Shelf, WalkableNode, WalkableEdge
from app.services.route_optimizer import build_route, astar, build_adjacency


async def verify():
    async with AsyncSessionLocal() as db:
        # 1. Categories
        cats = (await db.execute(select(Category))).scalars().all()
        print(f"Categories count: {len(cats)}")
        assert len(cats) >= 10, f"Expected >= 10 categories, got {len(cats)}"
        for c in cats:
            assert c.name and c.slug and c.image_url, f"Category invalid: {c.name}"

        # 2. Sections, Aisles, Shelves
        sections = (await db.execute(select(StoreSection).options(
            selectinload(StoreSection.aisles).selectinload(Aisle.shelves)
        ))).scalars().all()
        print(f"Sections count: {len(sections)}")
        assert len(sections) >= 4, f"Expected >= 4 sections, got {len(sections)}"

        shelves = (await db.execute(select(Shelf).options(selectinload(Shelf.aisle)))).scalars().all()
        print(f"Shelves count: {len(shelves)}")
        assert len(shelves) >= 20, f"Expected >= 20 shelves, got {len(shelves)}"

        # 3. Walkable Nodes & Edges
        nodes = (await db.execute(select(WalkableNode))).scalars().all()
        edges = (await db.execute(select(WalkableEdge))).scalars().all()
        print(f"Nodes count: {len(nodes)}, Edges count: {len(edges)}")
        assert len(nodes) >= 40, f"Expected >= 40 nodes, got {len(nodes)}"
        assert len(edges) >= 40, f"Expected >= 40 edges, got {len(edges)}"

        raw_nodes = [{"id": n.id, "x": n.x, "y": n.y, "label": n.label} for n in nodes]
        raw_edges = [{"id": e.id, "from_node_id": e.from_node_id, "to_node_id": e.to_node_id, "weight": e.weight} for e in edges]

        entrance = next((n for n in raw_nodes if n["label"] == "entrance"), None)
        checkout = next((n for n in raw_nodes if n["label"] == "checkout"), None)
        assert entrance is not None, "Entrance node missing"
        assert checkout is not None, "Checkout node missing"
        assert entrance["x"] == 100.0 and entrance["y"] == 550.0, f"Unexpected entrance coords: {entrance}"
        assert checkout["x"] == 650.0 and checkout["y"] == 550.0, f"Unexpected checkout coords: {checkout}"

        # Test graph connectivity: Every node must be reachable from entrance
        adj = build_adjacency(raw_nodes, raw_edges)
        nodes_by_id = {n["id"]: n for n in raw_nodes}

        unreachable = []
        for n in raw_nodes:
            cost, path = astar(nodes_by_id, adj, entrance["id"], n["id"])
            if cost == float("inf"):
                unreachable.append(n)
        assert len(unreachable) == 0, f"Unreachable nodes found: {unreachable}"
        print("✅ Graph is fully connected! All nodes reachable from entrance.")

        # Test path from entrance to checkout
        cost, path = astar(nodes_by_id, adj, entrance["id"], checkout["id"])
        assert cost < float("inf") and len(path) > 2, f"No valid path from entrance to checkout: cost={cost}"
        print(f"✅ Path entrance -> checkout verified: length={len(path)} steps, cost={cost:.1f}")

        # 4. Products
        products = (await db.execute(select(Product).options(
            selectinload(Product.shelf).selectinload(Shelf.aisle)
        ))).scalars().all()
        print(f"Products count: {len(products)}")
        assert len(products) >= 50, f"Expected >= 50 products, got {len(products)}"

        for p in products:
            assert p.shelf_id is not None, f"Product {p.name} missing shelf_id"
            assert p.shelf_x is not None and p.shelf_y is not None, f"Product {p.name} missing coordinates"
            assert p.price > 0, f"Product {p.name} invalid price"
            assert p.image_url, f"Product {p.name} missing image_url"

        # 5. Route Planner execution test with 5 products
        sample_products = products[:5]
        stops = []
        for p in sample_products:
            closest_node = min(raw_nodes, key=lambda n: (n["x"] - p.shelf_x)**2 + (n["y"] - p.shelf_y)**2)
            aisle_name = p.shelf.aisle.name if p.shelf and p.shelf.aisle else "General"
            shelf_name = p.shelf.name if p.shelf else "Shelf"
            stops.append({
                "node_id": closest_node["id"],
                "product_id": p.id,
                "product_name": p.name,
                "aisle_name": aisle_name,
                "shelf_name": shelf_name,
                "x": closest_node["x"],
                "y": closest_node["y"],
                "instruction": f"Pick up {p.name} from {aisle_name} — {shelf_name}",
            })

        route_result = build_route(raw_nodes, raw_edges, stops, entrance["id"], checkout["id"])
        assert len(route_result["stops"]) == 5
        assert len(route_result["path_coords"]) > 0
        assert route_result["total_distance"] > 0
        assert route_result["estimated_minutes"] > 0
        assert len(route_result["instructions"]) == 7  # start + 5 stops + checkout
        print("✅ Route optimizer test passed!")
        print(f"   Sample route: {route_result['total_distance']} units, {route_result['estimated_minutes']} mins")
        for inst in route_result["instructions"]:
            print(f"   {inst}")

    print("\n🎉 ALL SEED DATA VERIFICATION CHECKS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(verify())
