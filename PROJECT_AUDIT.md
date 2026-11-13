# PROJECT AUDIT: AIP (SwiftMart Quick-Commerce & Smart Route Platform)

**Date:** 2026-11-14  
**Audit Conducted by:** Senior AI Engineer, Backend Architect, Database Engineer & Security Specialist

---

## 1. Executive Summary
The AIP project is a full-stack quick-commerce grocery application (branded **SwiftMart**) featuring an in-store **AI Smart Route Planner**. It consists of a modern React 18 frontend and a FastAPI backend with an SQLite development database (`swiftmart.db`).

The user objective is a **Complete Backend Transformation**:
- Upgrade backend into an enterprise-grade AI engine with persistent memory, multi-user isolation, vector memory (RAG), and configurable AI providers (including Groq `gsk_...` OpenAI-compatible API).
- **CRITICAL CONSTRAINT:** **ZERO changes to the frontend** (no styling, component, layout, or structural changes). The existing contract must be strictly preserved.

---

## 2. Technology Stack & Framework Inventory

### Frontend
- **Framework:** React 18.3 + TypeScript + Vite 8.3
- **CSS / Styling:** Tailwind CSS v4 (`@tailwindcss/vite`), Framer Motion, Lucide icons, `react-hot-toast`
- **Routing:** `HashRouter` (`react-router-dom`)
- **State Management:** Zustand stores:
  - `useAuthStore.ts` (JWT in `localStorage['swiftmart_token']`)
  - `useCartStore.ts` (local cart state synced to `/api/cart`)
  - `useAIStore.ts` (manages chat messages, suggestions, route action triggers)
- **Map / Canvas:** Custom 2D supermarket floorplan (`StoreMap.tsx`) with coordinate-based rendering and A* route polyline overlay.
- **Client Fallback:** `src/lib/api.ts` contains an offline interceptor reading `staticData.json` when the backend is unreachable.

### Backend
- **Framework:** FastAPI 0.115.5 (Python 3.13 / 3.14 compatible)
- **ORM & DB:** SQLAlchemy 2.0.36 (asyncio) + SQLite (`sqlite+aiosqlite:///./swiftmart.db`), Alembic 1.14.0 migrations
- **Authentication:** JWT tokens (`python-jose`) + bcrypt password hashing (`passlib`)
- **HTTP Client:** `httpx` 0.28.1
- **Current AI Integration:** Google Generative AI SDK (`google-generativeai==0.8.3`) + hardcoded regex fallback in `ai_service.py`

---

## 3. Existing API Endpoints & Contracts

| Endpoint | Method | Expected Request / Query | Expected Response Schema |
|---|---|---|---|
| `/api/auth/register` | `POST` | `{email, password, full_name, phone}` | `{access_token, token_type, user: {...}}` |
| `/api/auth/login` | `POST` | `{email, password}` | `{access_token, token_type, user: {...}}` |
| `/api/auth/me` | `GET` | Bearer Token | `UserOut` |
| `/api/auth/addresses` | `GET` / `POST` | Bearer Token, Address payload | List of addresses / single address |
| `/api/products` | `GET` | `?category_id=X&q=Y&limit=40&offset=0` | `List[ProductOut]` |
| `/api/products/featured` | `GET` | None | `List[ProductOut]` |
| `/api/products/search/suggestions` | `GET` | `?q=query` | `{"suggestions": [...]}` |
| `/api/products/{id}` | `GET` | `product_id` | `ProductOut` |
| `/api/categories` | `GET` | None | `List[CategoryOut]` |
| `/api/cart` | `GET` / `DELETE` | Bearer Token | `CartOut` (id, items, subtotal, delivery, total) |
| `/api/cart/items` | `POST` | `{product_id, quantity}` | `{"status": "ok"}` |
| `/api/cart/items/{id}` | `PUT` / `DELETE` | `{quantity}` / None | `{"status": "ok"}` |
| `/api/orders` | `GET` / `POST` | `{address_id, payment_method, notes}` | `OrderOut` / `List[OrderOut]` |
| `/api/store/map` | `GET` | None | `StoreMapOut` (sections, nodes, edges) |
| `/api/route/plan` | `POST` | `{"product_ids": [...]}` | `RouteResponse` (stops, path_coords, total_distance, estimated_minutes, instructions) |
| `/api/ai/chat` | `POST` | `{"message": str, "conversation_id": Optional[int], "cart_product_ids": List[int]}` | `ChatResponse` (`reply`, `conversation_id`, `suggested_products`, `products_data`, `route_summary`, `route_generated`, `action`, `quick_suggestions`) |
| `/api/admin/*` | `GET`/`POST`/`PUT`/`DELETE` | Admin token | Stats, product CRUD, order updates, shelves |
| `/api/health` | `GET` | None | `{"status": "ok", "service": "SwiftMart API"}` |

---

## 4. Existing Database Analysis (`swiftmart.db`)
Current SQLite tables (14 tables):
1. `users` (id, email, hashed_password, full_name, phone, is_active, is_admin, timestamps)
2. `addresses`
3. `categories` (10 seeded categories)
4. `products` (72 seeded grocery products with shelf coordinates `shelf_x`, `shelf_y`)
5. `store_sections` (4 sections)
6. `aisles`
7. `shelves` (22 shelves)
8. `walkable_nodes` (53 navigation nodes)
9. `walkable_edges` (70 path edges)
10. `carts`
11. `cart_items`
12. `orders`
13. `order_items`
14. `conversations` & `messages` (basic session, lacks user memories, embeddings, document knowledge)

---

## 5. Security & Architectural Deficiencies Identified
1. **Database:** SQLite file-based engine lacks connection pooling, multi-tenant concurrency, and pgvector extension support.
2. **AI Provider Lock-in / Fragility:** Tied specifically to Google Gemini; no provider-agnostic abstraction (Groq, OpenAI, Anthropic, Ollama).
3. **No Semantic Long-Term Memory:** AI cannot recall past user preferences, dietary restrictions, or historical context across sessions.
4. **No Document Retrieval (RAG):** No chunking, vector embedding, or document knowledge retrieval for PDFs, DOCX, or TXT.
5. **No Modular Tool Execution Framework:** Tool execution in `ai_service.py` is hardcoded with monolithic regex heuristics rather than a clean decoupled dispatcher.
6. **Token & Rate Limiting Missing:** No API usage tracking, rate limiting, or cost auditing.
7. **Secret Handling:** API keys need robust environment variable management.

---

## 6. Audit Verdict & Feasibility
The existing frontend is clean, robust, and expects exact JSON signatures on `/api/*`. 
By implementing an **Adapter / Bridge pattern**, we can transform the backend into a modular PostgreSQL/pgvector-powered AI architecture with long-term memory, RAG, and multi-provider AI (Groq, OpenAI, etc.), while keeping **100% contract fidelity** so the frontend remains untouched.
