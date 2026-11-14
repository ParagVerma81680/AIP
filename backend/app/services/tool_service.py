import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.product import Product
from app.models.store import Shelf, Aisle, WalkableNode, WalkableEdge
from app.services.route_optimizer import build_route
from app.services.document_service import DocumentService

logger = logging.getLogger(__name__)

# Standard JSON Schema definitions for model function calling
AIP_TOOLS_SCHEMA: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "Perform accurate mathematical or arithmetic calculations (e.g. price totals, discounts, proportions).",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "The arithmetic expression to evaluate, e.g. '25 * 4 + 15' or '(340 * 0.85) + 40'."
                    }
                },
                "required": ["expression"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_datetime",
            "description": "Get the current date, day of the week, and live system time.",
            "parameters": {
                "type": "object",
                "properties": {},
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_grocery_catalog",
            "description": "Search the live supermarket catalog for grocery products, prices, stock, brands, and categories.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Product name, category, or brand to search (e.g. 'milk', 'paneer', 'fortune oil')."
                    },
                    "max_price": {
                        "type": "number",
                        "description": "Optional upper budget limit in ₹ to filter items."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_shelf_location",
            "description": "Retrieve the exact physical supermarket aisle name, shelf number, and 2D floor coordinates for a product.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "Name of the product to locate inside the physical store."
                    }
                },
                "required": ["product_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "plan_store_route",
            "description": "Calculate the mathematically optimal walking route connecting the store entrance, selected product shelves, and checkout counter.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_names": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of product names the shopper wants to collect in-store."
                    }
                },
                "required": ["product_names"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_uploaded_documents",
            "description": "Search the user's private uploaded PDF, DOCX, or TXT knowledge base for relevant facts or citations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to match against uploaded documents."
                    }
                },
                "required": ["query"]
            }
        }
    }
]

class ToolService:
    @staticmethod
    def calculate(expression: str) -> str:
        """Safely evaluates arithmetic expressions without arbitrary code execution."""
        import math, re
        cleaned = re.sub(r'[^0-9+\-*/().%^e ]', '', expression).replace('^', '**')
        try:
            safe_dict = {"__builtins__": None, "math": math}
            result = eval(cleaned, safe_dict, {})
            return f"Result: {cleaned} = {result}"
        except Exception:
            return f"Error: Unable to safely calculate '{expression}'"

    @staticmethod
    def get_date_time() -> str:
        import datetime
        now = datetime.datetime.now()
        return f"Current Date & Time: {now.strftime('%A, %B %d, %Y - %I:%M %p')}"

    @staticmethod
    async def search_catalog(db: AsyncSession, query: str, max_price: Optional[float] = None) -> List[Dict[str, Any]]:
        terms = query.strip().split()
        conditions = []
        for t in terms:
            conditions.append(Product.name.ilike(f"%{t}%"))
            conditions.append(Product.brand.ilike(f"%{t}%"))

        stmt = select(Product).where(or_(*conditions))
        if max_price:
            stmt = stmt.where(Product.price <= max_price)

        res = await db.execute(stmt.limit(6))
        products = res.scalars().all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "price": p.price,
                "original_price": p.original_price or p.price,
                "discount_pct": p.discount_pct,
                "stock": p.stock,
                "shelf_id": p.shelf_id,
                "shelf_x": p.shelf_x,
                "shelf_y": p.shelf_y,
                "quantity_label": p.quantity_label,
            }
            for p in products
        ]

    @staticmethod
    async def find_product_location(db: AsyncSession, product_name: str) -> Optional[Dict[str, Any]]:
        words = product_name.strip().split()
        conditions = [Product.name.ilike(f"%{w}%") for w in words if len(w) > 2]
        if not conditions:
            conditions = [Product.name.ilike(f"%{product_name}%")]

        from sqlalchemy import and_
        # Try full conjunction first (e.g. 'Amul' AND 'butter')
        stmt = select(Product).where(and_(*conditions)).limit(1)
        res = await db.execute(stmt)
        p = res.scalar_one_or_none()

        # If not found, try disjunction (e.g. 'butter' OR 'Amul')
        if not p:
            stmt = select(Product).where(or_(*conditions)).limit(1)
            res = await db.execute(stmt)
            p = res.scalar_one_or_none()

        if not p:
            return None

        aisle_name = "General Grocery Aisle"
        shelf_name = f"Shelf {p.shelf_id or 'General'}"
        if p.shelf_id:
            s_res = await db.execute(select(Shelf).where(Shelf.id == p.shelf_id))
            shelf = s_res.scalar_one_or_none()
            if shelf:
                shelf_name = shelf.name or shelf_name
                if shelf.aisle_id:
                    a_res = await db.execute(select(Aisle).where(Aisle.id == shelf.aisle_id))
                    aisle = a_res.scalar_one_or_none()
                    if aisle:
                        aisle_name = aisle.name

        return {
            "product_id": p.id,
            "product_name": p.name,
            "brand": p.brand,
            "price": p.price,
            "aisle": aisle_name,
            "shelf": shelf_name,
            "shelf_x": p.shelf_x,
            "shelf_y": p.shelf_y,
        }

    @staticmethod
    async def plan_store_route_tool(db: AsyncSession, product_names: List[str]) -> Dict[str, Any]:
        matched_products: List[Product] = []
        for name in product_names:
            stmt = select(Product).where(Product.name.ilike(f"%{name}%")).limit(1)
            p = (await db.execute(stmt)).scalar_one_or_none()
            if p:
                matched_products.append(p)

        if not matched_products:
            return {"error": "None of the requested products were found in the catalog."}

        nodes_res = await db.execute(select(WalkableNode))
        edges_res = await db.execute(select(WalkableEdge))
        raw_nodes = [{"id": n.id, "x": n.x, "y": n.y, "label": n.label} for n in nodes_res.scalars().all()]
        raw_edges = [{"id": e.id, "from_node_id": e.from_node_id, "to_node_id": e.to_node_id, "weight": e.weight} for e in edges_res.scalars().all()]

        if not raw_nodes:
            return {"error": "Store map not configured"}

        entrance = next((n for n in raw_nodes if n["label"] == "entrance"), raw_nodes[0])
        checkout = next((n for n in raw_nodes if n["label"] == "checkout"), raw_nodes[-1])

        stops = []
        for p in matched_products:
            stops.append({
                "node_id": entrance["id"],
                "product_id": p.id,
                "product_name": p.name,
                "aisle_name": "Store Section",
                "shelf_name": f"Rack {p.shelf_id or 'General'}",
                "x": p.shelf_x or 200,
                "y": p.shelf_y or 300,
                "instruction": f"Collect {p.name}",
            })

        route_data = build_route(raw_nodes, raw_edges, stops, entrance["id"], checkout["id"])
        return {
            "total_distance": f"{route_data['total_distance']} m",
            "estimated_minutes": f"{route_data['estimated_minutes']} mins",
            "item_count": len(stops),
            "stops": [s["instruction"] for s in stops],
            "instructions": route_data["instructions"],
            "products_data": [
                {
                    "id": p.id,
                    "name": p.name,
                    "brand": p.brand or "SwiftMart",
                    "price": p.price,
                    "original_price": p.original_price or p.price,
                    "discount_pct": p.discount_pct or 0,
                    "image_url": p.image_url,
                    "quantity_label": p.quantity_label or "1 unit",
                    "is_available": p.is_available,
                    "shelf_x": p.shelf_x,
                    "shelf_y": p.shelf_y,
                }
                for p in matched_products
            ]
        }

    @staticmethod
    async def execute_tool_call(
        db: AsyncSession,
        name: str,
        arguments_json: str,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Validates arguments, executes registered tools safely, and returns JSON-serializable output."""
        try:
            args = json.loads(arguments_json) if isinstance(arguments_json, str) else arguments_json
        except Exception:
            args = {}

        logger.info(f"Executing tool '{name}' with args: {args}")

        if name == "calculate":
            expr = args.get("expression", "")
            return {"result": ToolService.calculate(expr)}

        elif name == "get_current_datetime":
            return {"result": ToolService.get_date_time()}

        elif name == "search_grocery_catalog":
            q = args.get("query", "")
            max_p = args.get("max_price")
            items = await ToolService.search_catalog(db, q, max_p)
            return {"products": items, "count": len(items)}

        elif name == "get_shelf_location":
            p_name = args.get("product_name", "")
            loc = await ToolService.find_product_location(db, p_name)
            return {"location": loc}

        elif name == "plan_store_route":
            p_names = args.get("product_names", [])
            route_res = await ToolService.plan_store_route_tool(db, p_names)
            return {"route": route_res}

        elif name == "query_uploaded_documents":
            if not user_id:
                return {"result": "No authenticated user session. Document retrieval requires user login."}
            q = args.get("query", "")
            chunks = await DocumentService.query_knowledge_base(db, user_id, q, top_k=3)
            return {"excerpts": chunks, "count": len(chunks)}

        else:
            return {"error": f"Unknown tool '{name}'"}
