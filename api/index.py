import sys
import os
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

try:
    from app.main import app
except Exception as e:
    import traceback
    tb = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI(title="Diagnostic")
    
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def catch_all(path: str):
        return JSONResponse(status_code=200, content={"error": str(e), "traceback": tb})
