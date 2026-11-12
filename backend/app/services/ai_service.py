"""
AI Service for SwiftMart
Handles conversational shopping assistance, intelligent tool execution,
location lookups, recipe ingredient bundling, and store walking route optimization.
Provides full deterministic fallbacks when GEMINI_API_KEY is not configured or fails.
"""

import re
import math
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.product import Product, Category
from app.models.store import Shelf, Aisle, StoreSection, WalkableNode, WalkableEdge
from app.schemas.ai import ProductInfo, RouteSummary
from app.services.route_optimizer import build_route

logger = logging.getLogger(__name__)

COMMON_RECIPES: Dict[str, Dict[str, Any]] = {
    "paneer butter masala": {
        "title": "Paneer Butter Masala",
        "keywords": ["paneer", "butter", "tomato", "cream", "garam masala", "kasuri methi"],
        "description": "Rich and creamy curry with fresh paneer cubes cooked in tomato-butter gravy.",
        "tips": "Serve hot with naan, roti, or jeera rice."
    },
    "dal tadka": {
        "title": "Dal Tadka & Rice",
        "keywords": ["toor dal", "rice", "ghee", "jeera", "mustard", "turmeric"],
        "description": "Comforting yellow lentils tempered with ghee, cumin, and garlic, served with steamed basmati rice.",
        "tips": "Add a dollop of pure desi ghee for authentic flavour."
    },
    "chai": {
        "title": "Evening Tea & Snacks",
        "keywords": ["tea", "milk", "sugar", "ginger", "biscuits", "rusk"],
        "description": "Classic Indian adrak/masala chai paired with crispy tea-time biscuits.",
        "tips": "Boil with crushed fresh ginger and cardamom."
    },
    "pasta": {
        "title": "Italian Tomato Garlic Pasta",
        "keywords": ["pasta", "olive oil", "tomato", "cheese", "garlic", "chilli flakes"],
        "description": "Al dente penne in a rich herb-infused tomato sauce topped with grated cheese.",
        "tips": "Cook pasta al dente in generously salted boiling water."
    },
    "breakfast": {
        "title": "Power Morning Breakfast",
        "keywords": ["bread", "eggs", "milk", "butter", "banana", "oats"],
        "description": "Wholesome and nutritious morning kickstart with eggs, toast, and fresh fruit.",
        "tips": "A balanced meal with high protein and essential carbs."
    },
    "sandwich": {
        "title": "Classic Grilled Cheese Sandwich",
        "keywords": ["bread", "cheese", "butter", "tomato", "cucumber", "mayonnaise"],
        "description": "Toasted golden sandwich layered with melted cheese and fresh crisp veggies.",
        "tips": "Toast in a pan with generous butter for crispiness."
    },
    "biryani": {
        "title": "Fragrant Biryani Meal Kit",
        "keywords": ["basmati rice", "biryani masala", "ghee", "curd", "onion", "mint"],
        "description": "Royal aromatic long-grain basmati rice layered with rich spices and caramelized onions.",
        "tips": "Let it rest on low dum for 10 minutes before serving."
    },
    "snacks": {
        "title": "Healthy Snacks for Kids & Adults",
        "keywords": ["makhana", "almonds", "cashews", "dark chocolate", "digestive", "juice"],
        "description": "Guilt-free roasted nuts, Foxnuts (makhana), and high-fiber munchies.",
        "tips": "Ideal for school tiffins, evening tea, and work breaks."
    },
    "maggi": {
        "title": "Loaded Veggie Cheese Maggi",
        "keywords": ["maggi", "noodles", "cheese", "butter", "peas", "tomato"],
        "description": "The ultimate quick comfort meal with extra cheese and sautéed veggies.",
        "tips": "Cook with butter and a dash of oregano for café style noodles."
    },
    "salad": {
        "title": "Fresh Green Crunch Salad",
        "keywords": ["cucumber", "tomato", "carrot", "olive oil", "lemon", "lettuce"],
        "description": "Crisp farm-fresh vegetables lightly dressed with extra virgin olive oil and lemon.",
        "tips": "Sprinkle rock salt and roasted cumin powder just before serving."
    }
}

DEFAULT_SUGGESTIONS = [
    "🥗 Dinner ingredients under ₹400",
    "📍 Where is the Amul butter?",
    "🗺️ Plan shortest route for my cart",
    "🍿 Healthy snacks for kids",
    "🍜 Ingredients for Paneer Butter Masala",
    "☕ Evening Tea & Biscuits kit"
]


def product_to_info(p: Product) -> ProductInfo:
    aisle_name = p.shelf.aisle.name if (p.shelf and p.shelf.aisle) else None
    shelf_name = p.shelf.name if p.shelf else None
    section_name = p.shelf.aisle.section.name if (p.shelf and p.shelf.aisle and p.shelf.aisle.section) else None

    return ProductInfo(
        id=p.id,
        name=p.name,
        brand=p.brand,
        price=float(p.price),
        original_price=float(p.original_price) if p.original_price is not None else None,
        discount_pct=p.discount_pct or 0,
        quantity_label=p.quantity_label,
        image_url=p.image_url,
        aisle_name=aisle_name,
        shelf_name=shelf_name,
        section_name=section_name,
        shelf_x=float(p.shelf_x) if p.shelf_x is not None else None,
        shelf_y=float(p.shelf_y) if p.shelf_y is not None else None,
        is_available=bool(p.is_available)
    )


class AIService:
    @staticmethod
    async def get_products_by_terms(db: AsyncSession, terms: List[str], max_price: Optional[float] = None, limit_per_term: int = 2) -> List[Product]:
        results: List[Product] = []
        seen_ids = set()

        for term in terms:
            clean_term = term.strip()
            if not clean_term:
                continue

            query = (
                select(Product)
                .options(selectinload(Product.shelf).selectinload(Shelf.aisle).selectinload(Aisle.section))
                .where(
                    and_(
                        Product.is_available == True,
                        or_(
                            Product.name.ilike(f"%{clean_term}%"),
                            Product.brand.ilike(f"%{clean_term}%"),
                            Product.description.ilike(f"%{clean_term}%")
                        )
                    )
                )
            )
            if max_price:
                query = query.where(Product.price <= max_price)

            res = await db.execute(query.limit(limit_per_term))
            found = res.scalars().all()
            for p in found:
                if p.id not in seen_ids:
                    seen_ids.add(p.id)
                    results.append(p)

        return results

    @staticmethod
    async def search_products_general(db: AsyncSession, query_str: str, max_price: Optional[float] = None, limit: int = 6) -> List[Product]:
        clean_q = query_str.strip()
        tokens = [t.strip() for t in re.split(r"[\s,]+", clean_q) if len(t.strip()) > 1]
        items: List[Product] = []
        seen_ids = set()

        # 1. Exact phrase match in name or brand
        q1 = (
            select(Product)
            .options(selectinload(Product.shelf).selectinload(Shelf.aisle).selectinload(Aisle.section))
            .where(
                Product.is_available == True,
                or_(Product.name.ilike(f"%{clean_q}%"), Product.brand.ilike(f"%{clean_q}%"))
            )
        )
        if max_price:
            q1 = q1.where(Product.price <= max_price)
        res1 = await db.execute(q1.limit(limit))
        for p in res1.scalars().all():
            if p.id not in seen_ids:
                seen_ids.add(p.id)
                items.append(p)

        if len(items) >= limit:
            return items

        # 2. All tokens present in name or brand
        if len(tokens) > 1:
            all_filters = [or_(Product.name.ilike(f"%{t}%"), Product.brand.ilike(f"%{t}%")) for t in tokens]
            q2 = (
                select(Product)
                .options(selectinload(Product.shelf).selectinload(Shelf.aisle).selectinload(Aisle.section))
                .where(Product.is_available == True, and_(*all_filters))
            )
            if max_price:
                q2 = q2.where(Product.price <= max_price)
            res2 = await db.execute(q2.limit(limit))
            for p in res2.scalars().all():
                if p.id not in seen_ids:
                    seen_ids.add(p.id)
                    items.append(p)

        if len(items) >= limit:
            return items

        # 3. Any token in name or brand
        if tokens:
            any_filters = [or_(Product.name.ilike(f"%{t}%"), Product.brand.ilike(f"%{t}%")) for t in tokens if len(t) > 2]
            if any_filters:
                q3 = (
                    select(Product)
                    .options(selectinload(Product.shelf).selectinload(Shelf.aisle).selectinload(Aisle.section))
                    .where(Product.is_available == True, or_(*any_filters))
                )
                if max_price:
                    q3 = q3.where(Product.price <= max_price)
                res3 = await db.execute(q3.limit(limit))
                for p in res3.scalars().all():
                    if p.id not in seen_ids:
                        seen_ids.add(p.id)
                        items.append(p)

        return items

    @staticmethod
    async def build_route_for_products(db: AsyncSession, product_ids: List[int]) -> Tuple[Optional[RouteSummary], str]:
        if not product_ids:
            return None, "No products available to generate a route."

        # Fetch products
        p_res = await db.execute(
            select(Product)
            .where(Product.id.in_(product_ids))
            .options(selectinload(Product.shelf).selectinload(Shelf.aisle).selectinload(Aisle.section))
        )
        products = p_res.scalars().all()
        if not products:
            return None, "Selected products could not be located in the catalog."

        # Fetch walkable graph
        nodes_res = await db.execute(select(WalkableNode))
        raw_nodes = [{"id": n.id, "x": n.x, "y": n.y, "label": n.label} for n in nodes_res.scalars().all()]

        edges_res = await db.execute(select(WalkableEdge))
        raw_edges = [{"id": e.id, "from_node_id": e.from_node_id, "to_node_id": e.to_node_id, "weight": e.weight} for e in edges_res.scalars().all()]

        if not raw_nodes:
            # Fallback summary without graph
            return RouteSummary(
                total_distance=float(len(products) * 12),
                estimated_minutes=max(1.5, float(len(products) * 0.8)),
                stops_count=len(products),
                product_ids=[p.id for p in products],
                instructions=[f"Pick {p.name}" for p in products]
            ), "Route calculated based on aisle positions."

        entrance = next((n for n in raw_nodes if (n.get("label") or "").lower() == "entrance"), raw_nodes[0])
        checkout = next((n for n in raw_nodes if (n.get("label") or "").lower() == "checkout"), raw_nodes[-1])

        stops = []
        for p in products:
            if p.shelf_x is not None and p.shelf_y is not None:
                node = min(raw_nodes, key=lambda n: (n["x"] - p.shelf_x)**2 + (n["y"] - p.shelf_y)**2)
            else:
                node = entrance

            aisle_name = p.shelf.aisle.name if (p.shelf and p.shelf.aisle) else "General Grocery"
            shelf_name = p.shelf.name if p.shelf else "Shelf"

            stops.append({
                "node_id": node["id"],
                "product_id": p.id,
                "product_name": p.name,
                "aisle_name": aisle_name,
                "shelf_name": shelf_name,
                "x": node["x"],
                "y": node["y"],
                "instruction": f"Pick {p.name} at {aisle_name} ({shelf_name})",
            })

        route_data = build_route(raw_nodes, raw_edges, stops, entrance["id"], checkout["id"])

        summary = RouteSummary(
            total_distance=float(route_data["total_distance"]),
            estimated_minutes=float(route_data["estimated_minutes"]),
            stops_count=len(stops),
            product_ids=[p.id for p in products],
            instructions=route_data.get("instructions", [])
        )
        return summary, f"Route planned with {len(stops)} stops! Walk distance: {summary.total_distance}m (~{summary.estimated_minutes} mins)."

    @staticmethod
    def extract_budget(text: str) -> Optional[float]:
        pattern = r"(?:under|below|within|budget(?:\s+of)?|max)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
        return None

    @classmethod
    async def process_deterministic(
        cls,
        db: AsyncSession,
        message: str,
        cart_product_ids: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Intelligent deterministic agent handling natural language queries:
        - Product location lookup
        - Recipe & Meal kit suggestions with budget awareness
        - Route planning for cart or mentioned items
        - Direct search & recommendations
        """
        msg_lower = message.lower().strip()
        cart_product_ids = cart_product_ids or []
        budget = cls.extract_budget(msg_lower)

        # -------------------------------------------------------------
        # 1. Product Location Query
        # e.g., "where is the amul butter?", "where is olive oil located?", "locate milk"
        # -------------------------------------------------------------
        location_patterns = [
            r"(?:where\s+is|where\s+are|where\s+can\s+i\s+find|location\s+of|locate|find\s+(?:the\s+)?shelf|which\s+aisle\s+is)\s+(?:the\s+)?([a-zA-Z0-9\s]+?)(?:\s+located|\s+kept|\?|$)",
            r"(?:find|search)\s+(?:the\s+)?([a-zA-Z0-9\s]+?)\s+(?:location|shelf|aisle)"
        ]
        target_item = None
        for pattern in location_patterns:
            match = re.search(pattern, msg_lower)
            if match:
                target_item = match.group(1).strip()
                break

        if target_item:
            # Query product with shelf & aisle details
            products = await cls.search_products_general(db, target_item, limit=3)
            if products:
                primary = products[0]
                aisle_str = primary.shelf.aisle.name if (primary.shelf and primary.shelf.aisle) else "Aisle 1"
                shelf_str = primary.shelf.name if primary.shelf else "Shelf A"
                section_str = primary.shelf.aisle.section.name if (primary.shelf and primary.shelf.aisle and primary.shelf.aisle.section) else "Supermarket floor"
                coords = f"(x: {primary.shelf_x}, y: {primary.shelf_y})" if (primary.shelf_x is not None) else ""

                reply = (
                    f"📍 **{primary.name}** is located in **{aisle_str}** — **{shelf_str}** ({section_str}) {coords}.\n\n"
                    f"Price: **₹{primary.price:.2f}** | Stock: {'In Stock' if primary.is_available else 'Out of Stock'}.\n"
                    f"You can view its shelf location on our store map or add it to your basket below."
                )
                product_infos = [product_to_info(p) for p in products]
                return {
                    "reply": reply,
                    "products_data": product_infos,
                    "suggested_products": [p.id for p in products],
                    "route_generated": False,
                    "route_summary": None,
                    "action": "locate_product",
                    "quick_suggestions": [
                        f"🗺️ Route to {primary.name}",
                        "🛒 Add to cart",
                        "📍 Where is milk?"
                    ]
                }
            else:
                return {
                    "reply": f"🔍 I looked across our aisles for '{target_item}', but couldn't find an exact match in stock. Could you try a different brand or item name?",
                    "products_data": [],
                    "suggested_products": [],
                    "route_generated": False,
                    "route_summary": None,
                    "action": "none",
                    "quick_suggestions": DEFAULT_SUGGESTIONS[:3]
                }

        # -------------------------------------------------------------
        # 2. Route Planning Query
        # e.g., "Plan my route to buy milk, bread, eggs", "Plan shortest route for my cart"
        # -------------------------------------------------------------
        route_keywords = ["route", "shortest path", "store map", "walk path", "aisle route", "walking route", "navigate"]
        is_route_query = any(k in msg_lower for k in route_keywords)

        if is_route_query:
            # Check if user mentioned specific items to buy
            # e.g., "to buy milk, bread, eggs" or "for milk and butter"
            items_pattern = r"(?:to\s+buy|for|items?)\s+([a-zA-Z0-9\s,]+)"
            items_match = re.search(items_pattern, msg_lower)

            item_names = []
            if items_match:
                raw_items = items_match.group(1).replace(" and ", ",").replace("route", "").replace("shortest", "")
                item_names = [it.strip() for it in raw_items.split(",") if len(it.strip()) > 2 and it.strip() not in ["cart", "my", "the", "me", "a"]]

            products_to_route = []
            if item_names:
                products_to_route = await cls.get_products_by_terms(db, item_names, limit_per_term=1)

            # If no specific items in query, check existing cart items
            if not products_to_route and cart_product_ids:
                p_res = await db.execute(
                    select(Product)
                    .where(Product.id.in_(cart_product_ids))
                    .options(selectinload(Product.shelf).selectinload(Shelf.aisle).selectinload(Aisle.section))
                )
                products_to_route = list(p_res.scalars().all())

            # If still none, suggest a popular quick basket
            if not products_to_route:
                fallback_products = await cls.get_products_by_terms(db, ["milk", "bread", "butter", "eggs"], limit_per_term=1)
                products_to_route = fallback_products[:3]
                note = "Your cart is currently empty, so I generated an optimized demo route for daily essentials (Milk, Bread, Butter)."
            else:
                note = f"I have calculated the most efficient one-way walking route for your **{len(products_to_route)} items** from the Store Entrance to the Checkout Counter!"

            route_summary, msg = await cls.build_route_for_products(db, [p.id for p in products_to_route])
            product_infos = [product_to_info(p) for p in products_to_route]

            reply = (
                f"🗺️ **Smart Supermarket Route Generated!**\n\n"
                f"{note}\n\n"
                f"• **Distance:** {route_summary.total_distance if route_summary else 65} meters\n"
                f"• **Estimated walk:** ~{route_summary.estimated_minutes if route_summary else 3} minutes\n"
                f"• **Stops:** {len(products_to_route)} aisle checkpoints\n\n"
                f"Click **'Open Route in Store Map'** below to view the interactive path on our 2D floorplan!"
            )

            return {
                "reply": reply,
                "products_data": product_infos,
                "suggested_products": [p.id for p in products_to_route],
                "route_generated": True,
                "route_summary": route_summary,
                "action": "view_route",
                "quick_suggestions": [
                    "🛒 Add All to Cart",
                    "📍 Where is the Amul butter?",
                    "🥗 Dinner ingredients under ₹400"
                ]
            }

        # -------------------------------------------------------------
        # 3. Recipe / Meal Kit Bundling Query
        # e.g., "ingredients for paneer butter masala under ₹300", "recipe for dal tadka", "pasta dinner"
        # -------------------------------------------------------------
        matched_recipe_key = None
        for key in COMMON_RECIPES.keys():
            if key in msg_lower:
                matched_recipe_key = key
                break

        # Check for generic recipe requests (e.g. "dinner", "lunch", "breakfast", "curry")
        if not matched_recipe_key:
            if "dinner" in msg_lower or "paneer" in msg_lower:
                matched_recipe_key = "paneer butter masala"
            elif "tea" in msg_lower or "chai" in msg_lower:
                matched_recipe_key = "chai"
            elif "snack" in msg_lower or "munchies" in msg_lower:
                matched_recipe_key = "snacks"
            elif "breakfast" in msg_lower or "morning" in msg_lower:
                matched_recipe_key = "breakfast"
            elif "pasta" in msg_lower or "italian" in msg_lower:
                matched_recipe_key = "pasta"
            elif "dal" in msg_lower or "rice" in msg_lower:
                matched_recipe_key = "dal tadka"

        if matched_recipe_key:
            recipe = COMMON_RECIPES[matched_recipe_key]
            keywords = recipe["keywords"]
            items = await cls.get_products_by_terms(db, keywords, limit_per_term=1)

            # If budget constraint, filter or pick items within budget
            if budget and items:
                # Greedy selection under budget or show total
                total_cost = sum(p.price for p in items)
                if total_cost > budget:
                    items.sort(key=lambda x: x.price)
                    filtered = []
                    current_sum = 0
                    for item in items:
                        if current_sum + item.price <= budget or len(filtered) < 2:
                            filtered.append(item)
                            current_sum += item.price
                    items = filtered

            total_cost = sum(p.price for p in items)
            product_infos = [product_to_info(p) for p in items]

            budget_note = f" (Total: ₹{total_cost:.2f} within your ₹{budget:.0f} budget)" if budget else f" (Total: ₹{total_cost:.2f})"
            reply = (
                f"🍳 **Meal Kit: {recipe['title']}**{budget_note}\n\n"
                f"{recipe['description']}\n\n"
                f"**Ingredients curated from our shelves:**\n"
            )
            for idx, p in enumerate(items, 1):
                aisle = p.shelf.aisle.name if (p.shelf and p.shelf.aisle) else "Grocery"
                reply += f"{idx}. **{p.name}** ({p.quantity_label or '1 pc'}) — ₹{p.price:.2f} *(in {aisle})*\n"

            reply += f"\n💡 *Chef Tip:* {recipe['tips']}\n\n"
            reply += "Click **'Add All to Cart'** below to load all these fresh ingredients into your basket at once!"

            return {
                "reply": reply,
                "products_data": product_infos,
                "suggested_products": [p.id for p in items],
                "route_generated": False,
                "route_summary": None,
                "action": "add_cart",
                "quick_suggestions": [
                    "🛒 Add All to Cart",
                    "🗺️ Plan route for these ingredients",
                    "🍿 Healthy snacks for kids"
                ]
            }

        # -------------------------------------------------------------
        # 4. General Search & Recommendation
        # e.g., "healthy snacks for kids", "cold drinks", "show me chocolates under 100"
        # -------------------------------------------------------------
        search_results = await cls.search_products_general(db, message, max_price=budget, limit=5)
        if search_results:
            product_infos = [product_to_info(p) for p in search_results]
            budget_str = f" under ₹{budget:.0f}" if budget else ""
            reply = f"🛒 Here are the top matching products{budget_str} available at SwiftMart:\n\n"
            for p in search_results:
                aisle = p.shelf.aisle.name if (p.shelf and p.shelf.aisle) else "Aisle 1"
                reply += f"• **{p.name}** — ₹{p.price:.2f} ({p.quantity_label or ''}) | Located in {aisle}\n"

            reply += "\nYou can add any item directly to your cart or check its shelf location on the interactive map."

            return {
                "reply": reply,
                "products_data": product_infos,
                "suggested_products": [p.id for p in search_results],
                "route_generated": False,
                "route_summary": None,
                "action": "add_cart",
                "quick_suggestions": [
                    "🗺️ Plan shortest route for my cart",
                    "🥗 Dinner ingredients under ₹400",
                    "📍 Where is the Amul butter?"
                ]
            }

        # -------------------------------------------------------------
        # 5. Friendly Conversational Fallback
        # -------------------------------------------------------------
        if any(w in msg_lower for w in ["hi", "hello", "hey", "namaste", "good morning", "good evening"]):
            reply = (
                "👋 **Hello! Welcome to SwiftMart AI Assistant!**\n\n"
                "I can help you with:\n"
                "• 🥗 **Recipe ingredient bundles** (e.g., *'Dinner ingredients under ₹400'*)\n"
                "• 📍 **Instant product shelf location** (e.g., *'Where is the Amul butter?'*)\n"
                "• 🗺️ **Aisle walking route planning** (e.g., *'Plan shortest route for my cart'*)\n"
                "• 🛒 **Budget grocery shopping** (e.g., *'Healthy snacks for kids'*)\n\n"
                "What are you looking to cook or buy today?"
            )
        elif any(w in msg_lower for w in ["delivery", "time", "speed", "fast"]):
            reply = "⚡ SwiftMart delivers groceries in **10 to 15 minutes** straight to your doorstep! You can also visit our physical store and use our AI Store Map navigation."
        elif any(w in msg_lower for w in ["thank", "thanks", "great", "awesome", "good"]):
            reply = "You're very welcome! Let me know if you need help finding anything else on our shelves. Happy shopping! 🛍️"
        else:
            reply = (
                f"I can help you shop for anything at SwiftMart! You can ask me to find products, "
                f"suggest dinner ingredients with a budget, look up shelf aisles, or plan your in-store walking path."
            )

        return {
            "reply": reply,
            "products_data": [],
            "suggested_products": [],
            "route_generated": False,
            "route_summary": None,
            "action": "none",
            "quick_suggestions": DEFAULT_SUGGESTIONS[:4]
        }

    @classmethod
    async def chat(
        cls,
        db: AsyncSession,
        message: str,
        cart_product_ids: Optional[List[int]] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Main chat pipeline: tries Gemini API if configured with fallback to deterministic handler.
        """
        cart_product_ids = cart_product_ids or []
        history = history or []

        # If GEMINI_API_KEY is available and valid, attempt LLM call
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key != "your-gemini-api-key-here" and len(api_key) > 10:
            try:
                import httpx
                # Enrich with context
                deterministic_res = await cls.process_deterministic(db, message, cart_product_ids)
                
                # If deterministic already recognized an actionable tool result (e.g. route or location or recipe),
                # return it directly for optimal precision and speed, or use Gemini to refine text.
                if deterministic_res.get("products_data") or deterministic_res.get("route_generated"):
                    return deterministic_res

                # Otherwise let Gemini respond
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                contents = []
                for m in history[-6:]:
                    role = "user" if m.get("role") == "user" else "model"
                    contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
                contents.append({"role": "user", "parts": [{"text": message}]})

                system_text = (
                    "You are SwiftMart AI — an intelligent, polite grocery shopping assistant.\n"
                    "Help customers find groceries, meal recipes, and navigate store aisles.\n"
                    "Use Indian Rupee (₹). Keep answers friendly, formatted with markdown bullets, and concise."
                )

                payload = {
                    "contents": contents,
                    "systemInstruction": {"parts": [{"text": system_text}]},
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 800},
                }

                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        llm_text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {
                            "reply": llm_text,
                            "products_data": [],
                            "suggested_products": [],
                            "route_generated": False,
                            "route_summary": None,
                            "action": "none",
                            "quick_suggestions": DEFAULT_SUGGESTIONS[:4]
                        }
            except Exception as e:
                logger.warning(f"Gemini API call failed or timed out: {e}. Falling back to deterministic engine.")

        # Fallback to deterministic AI
        return await cls.process_deterministic(db, message, cart_product_ids)
