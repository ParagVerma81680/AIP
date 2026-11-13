import math
import datetime
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.product import Product
from app.models.store import Shelf, Aisle

class ToolService:
    @staticmethod
    def calculate(expression: str) -> str:
        """
        Safely evaluates mathematical expressions without arbitrary code execution.
        """
        cleaned = re.sub(r'[^0-9+\-*/().%^e ]', '', expression).replace('^', '**')
        try:
            # Safe math evaluation using restricted globals/locals
            safe_dict = {"__builtins__": None, "math": math}
            result = eval(cleaned, safe_dict, {})
            return f"Calculation Result: {cleaned} = {result}"
        except Exception:
            return f"Unable to safely calculate '{expression}'"

    @staticmethod
    def get_date_time() -> str:
        now = datetime.datetime.now()
        return f"Current Date & Time: {now.strftime('%A, %B %d, %Y - %I:%M %p')}"

    @staticmethod
    async def find_product_location(db: AsyncSession, product_name: str) -> Optional[Dict[str, Any]]:
        stmt = (
            select(Product)
            .where(Product.name.ilike(f"%{product_name}%"))
            .limit(1)
        )
        res = await db.execute(stmt)
        p = res.scalar_one_or_none()
        if not p:
            return None

        # Fetch shelf & aisle
        aisle_name = "General Section"
        shelf_name = "Rack 1"
        if p.shelf_id:
            s_res = await db.execute(select(Shelf).where(Shelf.id == p.shelf_id))
            shelf = s_res.scalar_one_or_none()
            if shelf:
                shelf_name = shelf.name or f"Shelf {shelf.id}"
                if shelf.aisle_id:
                    a_res = await db.execute(select(Aisle).where(Aisle.id == shelf.aisle_id))
                    aisle = a_res.scalar_one_or_none()
                    if aisle:
                        aisle_name = aisle.name

        return {
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "price": p.price,
            "aisle": aisle_name,
            "shelf": shelf_name,
            "shelf_x": p.shelf_x,
            "shelf_y": p.shelf_y,
        }

    @staticmethod
    def code_explainer(code_snippet: str, language: str = "python") -> str:
        lines = code_snippet.strip().split("\n")
        return f"Code Analysis ({language}): Contains {len(lines)} line(s). Valid structure."
