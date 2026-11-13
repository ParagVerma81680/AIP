# Database Schema Reference: AIP

## Schema Entities Summary

| Table | Description | Key Columns |
|---|---|---|
| `users` | User accounts with hashed passwords | `id`, `email`, `hashed_password`, `is_active`, `is_admin` |
| `user_preferences` | User-specific memory preferences & budget | `id`, `user_id`, `dietary_preferences`, `memory_enabled` |
| `memories` | Long-term semantic memories & extracted facts | `id`, `user_id`, `category`, `fact_text`, `embedding` (vector JSON), `importance` |
| `documents` | User uploaded PDF / DOCX / TXT documents | `id`, `user_id`, `title`, `file_type`, `file_size` |
| `document_chunks` | Chunked excerpts for RAG | `id`, `document_id`, `chunk_index`, `content`, `embedding` |
| `conversations` | Chat session tracking | `id`, `user_id`, `session_id`, `created_at` |
| `messages` | Chat messages & tool records | `id`, `conversation_id`, `role`, `content`, `tool_calls` |
| `api_usage` | Token and latency tracking | `id`, `user_id`, `provider`, `model`, `prompt_tokens`, `completion_tokens`, `latency_ms` |
| `feedback` | User response ratings | `id`, `user_id`, `message_id`, `rating`, `comment` |
| `categories` | Grocery categories | `id`, `name`, `slug`, `icon`, `image_url` |
| `products` | 72 physical store products | `id`, `name`, `brand`, `price`, `shelf_id`, `shelf_x`, `shelf_y` |
| `store_sections` | Store layout zones | `id`, `name`, `color`, `x`, `y`, `width`, `height` |
| `aisles` & `shelves` | Physical shelving infrastructure | `id`, `section_id`, `aisle_id`, `x`, `y` |
| `walkable_nodes` | Walkway intersections for A* graph | `id`, `x`, `y`, `label` |
| `walkable_edges` | Walkable corridor pathways | `id`, `from_node_id`, `to_node_id`, `weight` |
| `carts` & `cart_items` | Shopping baskets | `id`, `user_id`, `product_id`, `quantity` |
| `orders` & `order_items` | Placed customer orders | `id`, `user_id`, `subtotal`, `delivery_charge`, `total`, `status` |
