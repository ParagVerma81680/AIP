# AIP Architecture & Multi-Provider System

```
                  +--------------------------------+
                  |  Frontend / API Client (React) |
                  +---------------+----------------+
                                  | HTTP /api/ai/chat
                                  v
                  +--------------------------------+
                  |      FastAPI AI Router         |
                  +---------------+----------------+
                                  |
                                  v
+--------------------------------------------------------------------+
|                         AIService                                  |
|                                                                    |
|  1. Tool Engine: Safe Math, Datetime, Shelf Locator               |
|  2. Memory Service: Cosine Vector Search over User Memories        |
|  3. RAG Engine: Document Chunk Retrieval (PDF/DOCX/TXT)            |
|  4. Product Context: Real-time DB lookup (Prices, Inventory)       |
|  5. Route Planner: Walkable Graph A* + TSP optimizer              |
|                                                                    |
+---------------------------------+----------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |    AIProviderFactory           |
                  +---------------+----------------+
                                  |
        +-------------------------+-------------------------+
        |                                                   |
        v                                                   v
+-------------------------------+           +-------------------------------+
|     GroqProvider              |           |     MockProvider              |
|  - High throughput inference  |           |  - Deterministic unit tests   |
|  - Model: openai/gpt-oss-120b |           |  - Zero cost offline testing  |
+-------------------------------+           +-------------------------------+
```

## Supported Providers & Extensibility
The backend uses `BaseAIProvider` with unified signature:
- `generate_response(messages, system_prompt, temperature, max_tokens)`
- `generate_embedding(text)`

Configured dynamically via environment variables:
- `AI_PROVIDER=groq` (Default active provider)
- `AI_PROVIDER=mock` (Zero-cost offline test suite)
- `AI_PROVIDER=openai` (OpenAI compatible)
