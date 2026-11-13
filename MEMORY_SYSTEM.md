# AIP Memory System: Short-Term & Long-Term Memory

## 1. Short-Term Memory
- Session-based conversation sliding context window.
- Retains recent turns within `conversations` and `messages` tables.
- Token-managed to prevent context blowup.

## 2. Long-Term Semantic Memory
- Stored in the `memories` database table.
- Each memory item has:
  - `user_id`: Strict tenant isolation.
  - `category`: `preference`, `fact`, `diet`, `allergy`, `budget`.
  - `fact_text`: Concise factual statement (e.g. *"User follows a vegetarian diet"*).
  - `embedding`: 384-dimensional vector representation.
  - `importance`: Weight multiplier (e.g. 1.5x for allergies and dietary restrictions).

## 3. Privacy & User Control
- **Endpoints:**
  - `GET /api/memory`: View all stored memories for the authenticated user.
  - `POST /api/memory`: Manually create a preference or fact.
  - `DELETE /api/memory/{id}`: Delete an individual memory.
  - `DELETE /api/memory`: Wipe all stored memories.
- Users can disable memory tracking at any time via `user_preferences.memory_enabled`.
