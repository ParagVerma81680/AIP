import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.main import app
print("SwiftMart API imports OK")
print(f"Routes: {[r.path for r in app.routes]}")
