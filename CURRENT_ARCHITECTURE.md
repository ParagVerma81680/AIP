# CURRENT ARCHITECTURE: AIP / SwiftMart

## System Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                       FRONTEND (React 18 + Vite)                                |
|  - HashRouter navigation (HomePage, CatalogPage, RoutePlannerPage, AdminPage)   |
|  - Zustand Stores: useAuthStore, useCartStore, useAIStore                       |
|  - Interactive 2D StoreMap (Canvas/SVG renderer)                                |
|  - AIChatDrawer (Conversational shopping assistant UI)                          |
+---------------------------------------+-----------------------------------------+
                                        | HTTP / JSON REST
                                        v
+---------------------------------------------------------------------------------+
|                       FASTAPI BACKEND (Python 3.13)                             |
|                                                                                 |
|  API Layer (app/api/):                                                          |
|    auth.py        -> /api/auth (JWT signup/login)                               |
|    products.py    -> /api/products, search, categories                          |
|    cart.py        -> /api/cart, cart_items                                      |
|    orders.py      -> /api/orders                                                |
|    store.py       -> /api/store/map (sections, aisles, shelves, nodes)          |
|    route.py       -> /api/route/plan (A* Dijkstra + TSP optimizer)              |
|    ai.py          -> /api/ai/chat (Conversational assistant endpoint)           |
|    admin.py       -> /api/admin (stats, product & order management)             |
|                                                                                 |
|  Services Layer (app/services/):                                                |
|    route_optimizer.py -> Walkable graph Euclidean distance + 2-opt TSP           |
|    ai_service.py      -> Monolithic Gemini API call & regex heuristic fallback  |
|                                                                                 |
|  Data Layer (app/models/ & app/core/):                                          |
|    database.py    -> SQLAlchemy AsyncSession engine                             |
|    security.py    -> bcrypt password hashing & JWT encoding                     |
+---------------------------------------+-----------------------------------------+
                                        | Async I/O
                                        v
+---------------------------------------------------------------------------------+
|                           DATABASE                                              |
|  Current: SQLite (swiftmart.db) via aiosqlite                                   |
|  Data: 14 relational tables (Users, Products, StoreMap, Orders, Messages)       |
|  Limitation: No vector search, single-file lock, no memory recall               |
+---------------------------------------------------------------------------------+
```

## Data Flow for AI Chat & Route Generation
1. Shopper opens `AIChatDrawer` and inputs a query (e.g. *"Show ingredients for paneer butter masala under ₹300"*).
2. Frontend posts to `/api/ai/chat` with `{message, conversation_id, cart_product_ids}`.
3. Backend searches products with SQL ILIKE queries.
4. If `GEMINI_API_KEY` is present, calls Google Gemini; otherwise executes hardcoded regex recipe generator.
5. Returns `ChatResponse` containing `reply`, `products_data`, `suggested_products`, and optional `route_summary`.
6. Frontend updates chat drawer and optionally navigates to `/route-planner`.
