import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.ai.factory import AIProviderFactory
from app.services.ai.mock_provider import MockProvider

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "AIP Backend" in data["service"]

@pytest.mark.asyncio
async def test_categories_endpoint(client):
    response = await client.get("/api/categories")
    assert response.status_code == 200
    cats = response.json()
    assert len(cats) >= 10

@pytest.mark.asyncio
async def test_products_endpoint(client):
    response = await client.get("/api/products?limit=5")
    assert response.status_code == 200
    prods = response.json()
    assert len(prods) == 5
    assert "name" in prods[0]
    assert "price" in prods[0]

@pytest.mark.asyncio
async def test_ai_chat_contract_compatibility(client):
    # Temporarily switch to MockProvider for deterministic test
    AIProviderFactory._instance = MockProvider()

    payload = {
        "message": "I need milk and bread under 200",
        "conversation_id": None,
        "cart_product_ids": []
    }
    response = await client.post("/api/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "conversation_id" in data
    assert "suggested_products" in data
    assert "products_data" in data
    assert "quick_suggestions" in data

@pytest.mark.asyncio
async def test_safe_math_tool():
    from app.services.tool_service import ToolService
    res = ToolService.calculate("25 * 4 + 10")
    assert "110" in res

@pytest.mark.asyncio
async def test_vector_embeddings_and_cosine():
    from app.services.ai.embeddings import generate_local_embedding, cosine_similarity
    vec1 = generate_local_embedding("organic milk")
    vec2 = generate_local_embedding("pure fresh milk")
    vec3 = generate_local_embedding("car battery engine")

    sim_similar = cosine_similarity(vec1, vec2)
    sim_unrelated = cosine_similarity(vec1, vec3)
    assert sim_similar > sim_unrelated
