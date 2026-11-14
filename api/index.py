from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AIP & SwiftMart API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/api")
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "AIP Backend",
        "version": "2.0.0",
        "message": "SwiftMart AIP Backend is LIVE on Vercel!"
    }
