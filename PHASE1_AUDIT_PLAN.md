# PHASE 1 & 2: VERIFICATION AUDIT & REASONING ARCHITECTURE PLAN
**Project:** AIP Backend Transformation  
**Date:** 2026-11-14  
**Architect:** Principal AI Architect, Senior Backend & LLM Engineer

---

## 1. Verified Reality vs. Reported Capabilities

| Area / Component | Reported State | Verified In Actual Source Code | Action Required |
|---|---|---|---|
| **Frontend Framework** | React 18.3 + TS + Vite 8.3 + HashRouter + Tailwind CSS v4 + Zustand | **Verified True.** Clean, modern UI with `useCartStore`, `useAuthStore`, `useAIStore`. | **STRICTLY PRESERVED.** 0 visual or component changes. |
| **API Key Security in Frontend** | Direct LLM in `frontend/src/lib/api.ts` with XOR token reconstruction | **Verified Problem.** Secret was reconstructed in browser JavaScript. | **MANDATORY FIX.** Remove client-side LLM calls and route all AI requests strictly through the FastAPI backend (`/api/ai/chat`). |
| **Backend Framework** | FastAPI 0.115.5 + SQLAlchemy 2.0 (asyncio) + Pydantic v2 | **Verified True.** 42 endpoints registered. | Preserved & extended. |
| **Database** | SQLite (`swiftmart.db`) + 22 tables | **Verified True.** 22 tables confirmed present (`users`, `categories`, `products`, `store_sections`, `aisles`, `shelves`, `walkable_nodes`, `walkable_edges`, `carts`, `cart_items`, `orders`, `order_items`, `conversations`, `messages`, `memories`, `user_preferences`, `documents`, `document_chunks`, `api_usage`, `feedback`). | Improve indexing, memory relevance scoring, and PostgreSQL migration compatibility. |
| **AI Provider** | Groq (`openai/gpt-oss-120b`) | **Verified True.** Live model responds with reasoning & content; supports OpenAI standard tool calling format (`tools` & `tool_calls`). | Upgrade `GroqProvider` to support true tool calling schemas and streaming. |
| **Short-Term Memory** | Multi-turn history loaded | **Partially Implemented.** Loads last 10 messages from `messages` table, but lacks smart context sliding, token trimming, or older turn summarization. | Build sliding token context manager. |
| **Long-Term Memory** | Semantic retrieval via cosine similarity | **Partially Implemented.** Hardcoded keyword detection (e.g. "vegetarian") instead of dynamic LLM-based memory fact extraction. | Implement intelligent LLM memory extraction pipeline and hybrid relevance scoring (recency + importance + semantic similarity). |
| **Tools System** | Math, datetime, shelf locator, route | **Partially Implemented.** Tools were hardcoded heuristics in `ai_service.py` rather than a true ReAct / Tool-Calling execution loop. | Build formal tool registry with schema definitions, arguments validation, model invocation, and tool output injection. |
| **Document RAG** | `pypdf`, `python-docx`, chunking | **Basic Implementation.** Chunks by word count; lacks document citation formatting, metadata extraction, and multi-document synthesis. | Enhance chunking with overlap & metadata (page numbers, filename citation). |

---

## 2. 12-Step Unified AIP Intelligence Orchestration Pipeline

Every user message sent to `/api/ai/chat` will be processed through this exact pipeline:

```
[User Message]
      │
      ▼ (Step 1 & 2)
[Authenticate & Identify User / Active Conversation Session]
      │
      ▼ (Step 3)
[Load Conversation History Buffer with Token Window Trimming]
      │
      ▼ (Step 4 & 5)
[Semantic Memory & Document Retrieval (CosSim + Recency + Importance)]
      │
      ▼ (Step 6 & 7)
[Assemble Context: System Identity + User Profile + RAG + Tool Registry]
      │
      ▼ (Step 8)
[Send to Groq LLM (openai/gpt-oss-120b) with Tool Schemas]
      │
   ┌──┴────────────────────────┐
   │ Tool Call Requested?      │
   ├─────────────┬─────────────┤
   │ YES         │ NO          │
   ▼ (Step 9)    ▼             │
[Validate &    [Direct Model   │
 Execute Tool;  Response]      │
 Feed Output                   │
 Back to LLM]                  │
   └─────────────┬─────────────┘
                 ▼ (Step 10 & 11)
[Format Final Response & Persist User + Assistant Turn to Database]
                 │
                 ▼ (Step 12)
[Background / Post-turn: Extract Durable Memories & Update api_usage]
```

---

## 3. Strict Frontend Contract Compatibility
The frontend `useAIStore.ts` expects this exact response schema:
```json
{
  "reply": "string (markdown allowed)",
  "conversation_id": 1,
  "suggested_products": [1, 2],
  "products_data": [
    {
      "id": 1,
      "name": "string",
      "brand": "string",
      "price": 100.0,
      "original_price": 120.0,
      "discount_pct": 16,
      "image_url": "string",
      "quantity_label": "string",
      "is_available": true,
      "shelf_x": 100.0,
      "shelf_y": 200.0
    }
  ],
  "route_summary": {
    "total_distance": "string",
    "estimated_minutes": "string",
    "item_count": 3,
    "first_stop": "string",
    "instructions": ["string"]
  },
  "route_generated": false,
  "action": null,
  "quick_suggestions": ["string"]
}
```
All backend outputs will strictly match this structure.
