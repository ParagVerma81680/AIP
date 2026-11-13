"""
AIP Core Service: Integrates Multi-Provider LLMs, Long-Term Semantic Memory,
RAG Knowledge Retrieval, Safe Tools, and Preserves 100% Frontend Compatibility.
"""

import time
import logging
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.config import settings
from app.models.product import Product
from app.models.usage import ApiUsage
from app.services.ai.factory import AIProviderFactory
from app.services.memory_service import MemoryService
from app.services.document_service import DocumentService
from app.services.tool_service import ToolService
from app.services.route_optimizer import build_route
from app.models.store import WalkableNode, WalkableEdge, Shelf

logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    async def chat(
        db: AsyncSession,
        message: str,
        cart_product_ids: Optional[List[int]] = None,
        history: Optional[List[Dict[str, str]]] = None,
        user_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        start_time = time.time()
        cart_product_ids = cart_product_ids or []
        history = history or []
        user_msg = message.strip()

        # 1. Tool Triggers Check (Math, Date, Location)
        tool_injected_context = []

        # Math evaluation
        if any(w in user_msg.lower() for w in ["calculate", "what is", "sum of", "+", "-", "*", "/"]) and re.search(r'\d+\s*[+\-*/]\s*\d+', user_msg):
            math_expr = re.search(r'[\d\s+\-*/().%^e]+', user_msg)
            if math_expr:
                tool_injected_context.append(ToolService.calculate(math_expr.group(0)))

        # Date / time query
        if any(w in user_msg.lower() for w in ["what time is it", "current date", "what is today's date", "what day is it"]):
            tool_injected_context.append(ToolService.get_date_time())

        # 2. Long-Term Memory Retrieval
        memory_context = []
        if user_id:
            user_mems = await MemoryService.retrieve_relevant_memories(db, user_id, user_msg)
            if user_mems:
                memory_context.append("KNOWN USER PREFERENCES & MEMORIES:\n" + "\n".join(f"- {m}" for m in user_mems))

        # 3. Document Knowledge Retrieval (RAG)
        rag_context = []
        if user_id:
            doc_chunks = await DocumentService.query_knowledge_base(db, user_id, user_msg)
            if doc_chunks:
                rag_context.append("DOCUMENT KNOWLEDGE BASE (RELEVANT EXCERPTS):\n" + "\n\n".join(f"[{i+1}] {ch}" for i, ch in enumerate(doc_chunks)))

        # 4. Product Catalog Context (Grocery Items)
        matched_products: List[Product] = []
        clean_terms = re.findall(r'[a-zA-Z]{3,}', user_msg.lower())
        stopwords = {"what", "where", "show", "have", "with", "this", "that", "give", "please", "some", "need", "want", "like"}
        search_terms = [t for t in clean_terms if t not in stopwords][:4]

        if search_terms:
            conditions = []
            for t in search_terms:
                conditions.append(Product.name.ilike(f"%{t}%"))
                conditions.append(Product.brand.ilike(f"%{t}%"))
            stmt = select(Product).where(or_(*conditions)).limit(6)
            res = await db.execute(stmt)
            matched_products = res.scalars().all()

        product_context = ""
        if matched_products:
            p_lines = [f"- {p.name} (Brand: {p.brand or 'General'}) ₹{p.price} [Shelf ID: {p.shelf_id or 'Aisle'}]" for p in matched_products]
            product_context = "AVAILABLE STORE PRODUCTS:\n" + "\n".join(p_lines)

        # 5. Route Generation Intent Check
        route_generated = False
        route_summary = None
        action = None

        if any(w in user_msg.lower() for w in ["route", "path", "shortest walk", "map", "navigate", "aisle walk"]):
            pids_to_route = list(set(cart_product_ids + [p.id for p in matched_products]))
            if pids_to_route:
                try:
                    # Calculate route
                    nodes_res = await db.execute(select(WalkableNode))
                    edges_res = await db.execute(select(WalkableEdge))
                    raw_nodes = [{"id": n.id, "x": n.x, "y": n.y, "label": n.label} for n in nodes_res.scalars().all()]
                    raw_edges = [{"id": e.id, "from_node_id": e.from_node_id, "to_node_id": e.to_node_id, "weight": e.weight} for e in edges_res.scalars().all()]

                    if raw_nodes:
                        entrance = next((n for n in raw_nodes if n["label"] == "entrance"), raw_nodes[0])
                        checkout = next((n for n in raw_nodes if n["label"] == "checkout"), raw_nodes[-1])
                        stops = []
                        for pid in pids_to_route[:6]:
                            p_obj = await db.get(Product, pid)
                            if p_obj:
                                stops.append({
                                    "node_id": entrance["id"],
                                    "product_id": p_obj.id,
                                    "product_name": p_obj.name,
                                    "aisle_name": "Store Section",
                                    "shelf_name": "Aisle Rack",
                                    "x": p_obj.shelf_x or 200,
                                    "y": p_obj.shelf_y or 300,
                                    "instruction": f"Collect {p_obj.name}",
                                })
                        route_data = build_route(raw_nodes, raw_edges, stops, entrance["id"], checkout["id"])
                        route_generated = True
                        action = "show_route"
                        route_summary = {
                            "total_distance": f"{route_data['total_distance']} m",
                            "estimated_minutes": f"{route_data['estimated_minutes']} mins",
                            "item_count": len(stops),
                            "first_stop": stops[0]["instruction"] if stops else "Entrance",
                            "instructions": route_data["instructions"],
                        }
                except Exception as e:
                    logger.warning(f"Route calculation in chat failed: {e}")

        # 6. Compose AIP System Prompt
        system_sections = [settings.AIP_SYSTEM_IDENTITY]
        if memory_context:
            system_sections.extend(memory_context)
        if rag_context:
            system_sections.extend(rag_context)
        if tool_injected_context:
            system_sections.append("TOOL EXECUTION OUTPUTS:\n" + "\n".join(tool_injected_context))
        if product_context:
            system_sections.append(product_context)

        system_sections.append(
            "Instructions: Be conversational, helpful, and concise. "
            "If user asked for products or ingredients, highlight relevant items with prices in ₹. "
            "If user has diet constraints in memory, respect them strictly. "
            "Never invent products or locations not present in the context."
        )

        full_system_prompt = "\n\n".join(system_sections)

        # 7. Call Unified AI Provider
        provider = AIProviderFactory.get_provider()
        ai_resp = await provider.generate_response(
            messages=history + [{"role": "user", "content": user_msg}],
            system_prompt=full_system_prompt,
            temperature=0.7,
            max_tokens=600,
        )

        reply_content = ai_resp.get("content") or "I'm here to assist you with SwiftMart and AIP!"

        # 8. Record API Usage for Auditing
        latency = (time.time() - start_time) * 1000
        usage = ApiUsage(
            user_id=user_id,
            provider=ai_resp.get("provider", "groq"),
            model=ai_resp.get("model", settings.AI_MODEL),
            prompt_tokens=ai_resp.get("prompt_tokens", 0),
            completion_tokens=ai_resp.get("completion_tokens", 0),
            latency_ms=latency,
        )
        db.add(usage)

        # 9. Selective Long-Term Memory Extraction
        if user_id:
            await MemoryService.extract_and_save_memories(db, user_id, user_msg, reply_content)

        # 10. Format products_data for Frontend Cards
        products_data = []
        for p in matched_products:
            products_data.append({
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
            })

        return {
            "reply": reply_content,
            "suggested_products": [p.id for p in matched_products],
            "products_data": products_data,
            "route_summary": route_summary,
            "route_generated": route_generated,
            "action": action,
            "quick_suggestions": [
                "🥗 Dinner ingredients under ₹400",
                "📍 Where is the Amul butter?",
                "🗺️ Plan shortest route for my cart",
                "🍿 Healthy snacks for kids",
            ],
        }
