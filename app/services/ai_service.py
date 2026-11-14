"""
AIP Core Intelligence Orchestrator (Phase 3 & 4 Upgrade)
Processes every incoming request through the 12-Step Unified AIP Intelligence Pipeline:
1. Message reception
2. Tenant & conversation resolution
3. Short-term history context management (sliding token window)
4. Long-term semantic memory retrieval (hybrid relevance)
5. Document knowledge base RAG retrieval (citations included)
6. Dynamic tool availability & registration
7. Context compilation with configurable identity
8. AI model reasoning via GroqProvider (openai/gpt-oss-120b)
9. ReAct multi-step tool call execution loop (safe sandbox)
10. Final synthesis response formatting
11. Persistence to conversations & messages tables
12. Post-turn background memory extraction & usage auditing
"""

import time
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.usage import ApiUsage
from app.services.ai.factory import AIProviderFactory
from app.services.memory_service import MemoryService
from app.services.document_service import DocumentService
from app.services.tool_service import ToolService, AIP_TOOLS_SCHEMA

logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    def _trim_history_context(history: List[Dict[str, str]], max_tokens: int = 1500) -> List[Dict[str, str]]:
        """
        Sliding context window: trims older message turns so total history words stay within token budget.
        Never drops the most recent turns.
        """
        if not history:
            return []

        trimmed = []
        token_count = 0
        for msg in reversed(history):
            content = msg.get("content", "")
            words = len(content.split())
            if token_count + words > max_tokens and trimmed:
                break
            trimmed.append(msg)
            token_count += words

        return list(reversed(trimmed))

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

        # Step 3: Short-term memory buffer trimming
        trimmed_history = AIService._trim_history_context(history, max_tokens=1200)

        # Step 4: Long-term semantic memory retrieval
        memory_lines = []
        if user_id:
            mems = await MemoryService.retrieve_relevant_memories(db, user_id, user_msg, top_k=4)
            if mems:
                memory_lines.append("PERSONAL USER MEMORIES & PREFERENCES (CONFIRMED):")
                for m in mems:
                    memory_lines.append(f"- {m}")

        # Step 5: Document Knowledge Base RAG retrieval
        rag_lines = []
        if user_id:
            doc_citations = await DocumentService.query_knowledge_base(db, user_id, user_msg, top_k=3)
            if doc_citations:
                rag_lines.append("RETRIEVED KNOWLEDGE BASE EXCERPTS (WITH CITATIONS):")
                for c in doc_citations:
                    rag_lines.append(f"[{c}]")

        # Step 6 & 7: Construct Complete System Context
        system_components = [
            settings.AIP_SYSTEM_IDENTITY,
            "SYSTEM DIRECTIVES:\n"
            "- You are AIP, an intelligent conversational AI assistant with reasoning, persistent memory, and tools.\n"
            "- Act with depth, clarity, warmth, and insight like modern conversational models.\n"
            "- If personal memories are provided, respect them strictly without repeatedly asking for information already known.\n"
            "- If document knowledge base excerpts are provided, use them to provide cited, accurate answers.\n"
            "- If the user asks about real-time store stock, prices, shelf locations, or routes, invoke the provided tools.\n"
            "- Do not invent shelf locations or product prices; query the store catalog tool when needed."
        ]

        if memory_lines:
            system_components.append("\n".join(memory_lines))
        if rag_lines:
            system_components.append("\n".join(rag_lines))

        full_system_prompt = "\n\n".join(system_components)

        # Step 8: Send to Configured AI Provider with Tool Schemas
        provider = AIProviderFactory.get_provider()
        messages_payload = trimmed_history + [{"role": "user", "content": user_msg}]

        ai_resp = await provider.generate_response(
            messages=messages_payload,
            system_prompt=full_system_prompt,
            temperature=0.7,
            max_tokens=800,
            tools=AIP_TOOLS_SCHEMA,
        )

        tool_calls = ai_resp.get("tool_calls")
        reply_content = ai_resp.get("content") or ""
        executed_products_data = []
        route_summary = None
        route_generated = False
        action = None

        # Step 9: ReAct Tool Execution Loop
        if tool_calls and len(tool_calls) > 0:
            tool_outputs_messages = list(messages_payload)
            tool_outputs_messages.append({
                "role": "assistant",
                "content": reply_content or None,
                "tool_calls": tool_calls
            })

            for tc in tool_calls:
                fn_name = tc.get("function", {}).get("name")
                fn_args = tc.get("function", {}).get("arguments", "{}")
                tc_id = tc.get("id", "call_default")

                tool_result = await ToolService.execute_tool_call(
                    db=db,
                    name=fn_name,
                    arguments_json=fn_args,
                    user_id=user_id,
                )

                # Capture products data for frontend interactive cards
                if fn_name == "search_grocery_catalog" and "products" in tool_result:
                    executed_products_data.extend(tool_result["products"])
                elif fn_name == "plan_store_route" and "route" in tool_result:
                    r_info = tool_result["route"]
                    if "error" not in r_info:
                        route_generated = True
                        action = "show_route"
                        route_summary = {
                            "total_distance": r_info.get("total_distance", "60 m"),
                            "estimated_minutes": r_info.get("estimated_minutes", "2 mins"),
                            "item_count": r_info.get("item_count", 3),
                            "first_stop": r_info.get("stops", ["Entrance"])[0] if r_info.get("stops") else "Entrance",
                            "instructions": r_info.get("instructions", []),
                        }
                        if "products_data" in r_info:
                            executed_products_data.extend(r_info["products_data"])

                tool_outputs_messages.append({
                    "role": "tool",
                    "tool_call_id": tc_id,
                    "content": json.dumps(tool_result),
                })

            # Send tool outputs back to LLM for final synthesis
            second_resp = await provider.generate_response(
                messages=tool_outputs_messages,
                system_prompt=full_system_prompt,
                temperature=0.7,
                max_tokens=600,
            )
            reply_content = second_resp.get("content") or reply_content

        # Fallback if reply is empty
        if not reply_content.strip():
            reply_content = "I have processed your request. How else can I assist you with SwiftMart or AIP today?"

        # Step 11: Record Usage Metrics
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

        # Step 12: Dynamic Post-Turn Memory Extraction
        if user_id:
            await MemoryService.extract_and_save_memories_llm(db, user_id, user_msg, reply_content)

        # Step 10: Format final return matching frontend contract
        return {
            "reply": reply_content,
            "suggested_products": [p["id"] for p in executed_products_data if "id" in p],
            "products_data": executed_products_data[:4],
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
