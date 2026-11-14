import sys
import os
from pathlib import Path

# Add backend directory to sys.path so 'app' imports work seamlessly
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Configure Vercel runtime environment
if os.environ.get("VERCEL"):
    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:////tmp/swiftmart.db")

from app.main import app

# Vercel looks for the ASGI/WSGI app instance
handler = app
