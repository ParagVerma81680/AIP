import sys
import os
from pathlib import Path

api_dir = Path(__file__).resolve().parent
backend_dir = api_dir.parent / "backend"

for d in [str(api_dir), str(backend_dir), str(api_dir.parent)]:
    if d not in sys.path:
        sys.path.insert(0, d)

# Set database for Vercel
if os.environ.get("VERCEL"):
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:////tmp/swiftmart.db"

try:
    from app.main import app
except Exception as e:
    import traceback
    from fastapi import FastAPI
    err_str = str(e)
    tb_str = traceback.format_exc()
    app = FastAPI(title="AIP Error Diagnostic")
    
    @app.get("/{full_path:path}")
    def error_handler(full_path: str):
        return {
            "status": "error",
            "message": "Failed to initialize backend on Vercel",
            "error": err_str,
            "traceback": tb_str.splitlines()
        }

handler = app
