import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.ai.factory import AIProviderFactory
from app.services.ai.mock_provider import MockProvider
from app.services.tool_service import ToolService

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

# 1. Health check
@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "AIP Backend" in data["service"]

# 2. Grocery catalog endpoints preserved
@pytest.mark.asyncio
async def test_categories_endpoint(client):
    response = await client.get("/api/categories")
    assert response.status_code == 200
    assert len(response.json()) >= 10

@pytest.mark.asyncio
async def test_products_endpoint(client):
    response = await client.get("/api/products?limit=5")
    assert response.status_code == 200
    prods = response.json()
    assert len(prods) == 5
    assert "shelf_x" in prods[0]

# 3. Store Map & Route Optimizer preserved
@pytest.mark.asyncio
async def test_store_map_endpoint(client):
    response = await client.get("/api/store/map")
    assert response.status_code == 200
    data = response.json()
    assert len(data["sections"]) >= 4
    assert len(data["nodes"]) >= 40

@pytest.mark.asyncio
async def test_route_planner_endpoint(client):
    response = await client.post("/api/route/plan", json={"product_ids": [18, 21]})
    assert response.status_code == 200
    data = response.json()
    assert len(data["stops"]) == 2
    assert data["total_distance"] > 0
    assert len(data["instructions"]) >= 3

# 4. AI Chat contract compatibility
@pytest.mark.asyncio
async def test_ai_chat_contract_compatibility(client):
    AIProviderFactory._instance = MockProvider()

    payload = {
        "message": "Hello AIP, what can you do for me?",
        "conversation_id": None,
        "cart_product_ids": [18]
    }
    response = await client.post("/api/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "conversation_id" in data
    assert "suggested_products" in data
    assert "products_data" in data
    assert "quick_suggestions" in data

# 5. Safe Math Tool
@pytest.mark.asyncio
async def test_safe_math_tool():
    res = ToolService.calculate("340 * 0.85 + 40")
    assert "329" in res

# 6. DateTime Tool
@pytest.mark.asyncio
async def test_datetime_tool():
    dt = ToolService.get_date_time()
    assert "Current Date & Time:" in dt

# 7. Semantic vector embeddings
@pytest.mark.asyncio
async def test_vector_embeddings_and_cosine():
    from app.services.ai.embeddings import generate_local_embedding, cosine_similarity
    v1 = generate_local_embedding("organic cow milk butter")
    v2 = generate_local_embedding("amul dairy pasteurized butter")
    v3 = generate_local_embedding("python programming operating system")

    assert cosine_similarity(v1, v2) > cosine_similarity(v1, v3)

# 8. Memory Management APIs & Privacy
@pytest.mark.asyncio
async def test_memory_crud_endpoints(client):
    # Register test user
    test_email = f"test_{int(pytest.importorskip('time').time())}@example.com"
    reg_resp = await client.post("/api/auth/register", json={
        "email": test_email,
        "password": "Password123!",
        "full_name": "Test User",
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add a memory
    mem_resp = await client.post("/api/memory", headers=headers, json={
        "category": "diet",
        "fact_text": "User is vegetarian and prefers oat milk",
        "importance": 1.5
    })
    assert mem_resp.status_code == 200
    mem_id = mem_resp.json()["id"]

    # List memories
    list_resp = await client.get("/api/memory", headers=headers)
    assert list_resp.status_code == 200
    assert any(m["id"] == mem_id for m in list_resp.json())

    # Delete memory
    del_resp = await client.delete(f"/api/memory/{mem_id}", headers=headers)
    assert del_resp.status_code == 200
