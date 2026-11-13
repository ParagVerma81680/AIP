# IMPLEMENTATION PLAN: Complete Backend Transformation

## Target Architecture: AIP Core
Transform AIP backend into a modular, production-ready AI platform with **PostgreSQL + pgvector**, **Long-Term Memory**, **RAG Document Engine**, and **Multi-Provider AI** (Groq, OpenAI, Gemini, Anthropic, Ollama), while preserving **100% of existing frontend functionality and visual styling**.

---

## Phase Breakdown

### Phase 1: Database Modernization & Multi-DB Support (PostgreSQL / SQLite Dual Engine)
- Target: Supabase / PostgreSQL with `pgvector` extension for semantic search and vector embeddings.
- Maintain seamless SQLite development mode fallback so the local app remains instantly testable without external service dependency.
- New Entities:
  1. `users` (extended with multi-user preferences, status, role)
  2. `conversations` (multi-session context, title, metadata)
  3. `messages` (role, content, token count, tool calls)
  4. `memories` (user_id, memory_type, content, embedding vector, importance score, last_accessed)
  5. `user_preferences` (dietary preferences, budget thresholds, favorite brands)
  6. `documents` (user_id, filename, file_type, file_size, storage_path, processed_status)
  7. `document_chunks` (document_id, chunk_index, content, embedding vector)
  8. `feedback` (message_id, rating, comments)
  9. `api_usage` (user_id, model, tokens_prompt, tokens_completion, estimated_cost)
  10. Retain all existing grocery & store entities (`categories`, `products`, `store_sections`, `aisles`, `shelves`, `walkable_nodes`, `walkable_edges`, `carts`, `orders`).

### Phase 2: Provider-Agnostic AI Engine (`AIProvider` Interface)
- Implement abstract `BaseAIProvider`:
  - `generate_response(messages, system_prompt, tools, stream=False)`
  - `generate_embeddings(text_list)`
- Implement Concrete Providers:
  - **Groq Provider** (`https://api.groq.com/openai/v1`) using user key `gsk_...` with ultra-fast models (`llama-3.3-70b-versatile`, `mixtral-8x7b-32768`).
  - **OpenAI / Gemini Provider** (standard OpenAI-compatible protocol).
  - **Deterministic Local Mock Provider** for offline/zero-cost automated unit testing.
- Configurable environment settings:
  ```env
  AI_PROVIDER=groq
  AI_API_KEY=your_groq_api_key_here
  AI_MODEL=openai/gpt-oss-120b
  AI_BASE_URL=https://api.groq.com/openai/v1
  EMBEDDING_PROVIDER=local_or_api
  ```

### Phase 3: Short-Term & Long-Term Memory System
- **Short-Term Memory:** Sliding window context buffer with token count limits and multi-session isolation.
- **Long-Term Memory:**
  - Automated memory extractor: analyzes conversation turns to extract durable user facts (e.g. *"User is vegetarian"*, *"Prefers organic products"*, *"Budget limit ₹500"*).
  - Vector similarity search (Cosine similarity over embeddings).
  - Explicit user memory CRUD endpoints (`GET/POST/DELETE /api/memory`).
  - Memory toggle: allows user to disable or wipe persistent memory.

### Phase 4: Knowledge Base & RAG Engine
- Endpoints:
  - `POST /api/documents/upload` (PDF, TXT, DOCX validation and storage)
  - `GET /api/documents` (list user documents)
  - `DELETE /api/documents/{id}` (remove document & chunks)
- Processing pipeline: text extraction -> chunking (sliding window overlap) -> vector embedding -> storage -> semantic hybrid retrieval.

### Phase 5: Modular AI Tool System
- Decoupled tool executor:
  1. `calculate(expression)`: Safe math evaluator (no arbitrary code execution).
  2. `date_time()`: Current date, time, and timezone utilities.
  3. `grocery_search(query, max_budget)`: Live database catalogue search.
  4. `shelf_locator(product_name)`: Physical store aisle/shelf lookup.
  5. `route_planner(product_ids)`: A* + TSP algorithm execution.
  6. `code_explainer(snippet, language)`: Programming analysis.
  7. `summarize_document(doc_id)`: Document summarization tool.

### Phase 6: Frontend Contract Adapter & Compatibility Bridge
- Preserve `/api/ai/chat` endpoint signature identically:
  - Input: `{message, conversation_id, cart_product_ids}`
  - Output: `{reply, conversation_id, suggested_products, products_data, route_summary, route_generated, action, quick_suggestions}`
- Provide backward compatibility so the existing `AIChatDrawer.tsx`, `HomePage.tsx`, `CatalogPage.tsx`, and `RoutePlannerPage.tsx` continue functioning without any code modifications.

### Phase 7: Security & Comprehensive Test Suite
- Rate limiting on chat and upload endpoints.
- Multi-user data isolation (User A cannot access User B's conversations, memories, or documents).
- Mock AI automated tests verifying health, auth, chat context, memory storage, tool calling, and RAG.
