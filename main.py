import sys
import os
from pathlib import Path

root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

if os.environ.get("VERCEL"):
    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:////tmp/swiftmart.db")

from app.main import app

handler = app
