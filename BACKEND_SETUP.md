# Backend Setup & Configuration Guide: AIP

## 1. Environment Requirements
- Python 3.13 or 3.14
- Node.js 18+ (for frontend)

## 2. Environment Variables (.env)
Copy `.env.example` to `.env`:
```env
# Database connection:
# SQLite (Local Dev):
DATABASE_URL=sqlite+aiosqlite:///./swiftmart.db

# PostgreSQL (Production / Supabase):
# DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

SECRET_KEY=swiftmart-aip-super-secure-production-key-2026-xyz
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=["http://localhost:5173","https://paragverma81680.github.io"]

# AI Model Configuration
AI_PROVIDER=groq
AI_API_KEY=gsk_...
AI_MODEL=openai/gpt-oss-120b
AI_BASE_URL=https://api.groq.com/openai/v1
```

## 3. Running Backend Locally
```powershell
cd backend
py -3.13 -m uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger Documentation: http://localhost:8000/api/docs
- Health Status: http://localhost:8000/api/health

## 4. Running Automated Tests
```powershell
cd backend
py -3.13 -m pytest tests/ -v
```
