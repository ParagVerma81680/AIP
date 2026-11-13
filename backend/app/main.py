from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, products, categories, cart, orders, store, route, ai, admin, memory, documents

app = FastAPI(title="AIP & SwiftMart API", version="2.0.0", docs_url="/api/docs", redoc_url="/api/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(cart.router, prefix="/api/cart", tags=["cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(store.router, prefix="/api/store", tags=["store"])
app.include_router(route.router, prefix="/api/route", tags=["route"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "AIP Backend",
        "version": "2.0.0",
        "ai_provider": settings.AI_PROVIDER,
        "ai_model": settings.AI_MODEL,
    }
