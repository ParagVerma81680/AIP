from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class Category(Base, TimestampMixin):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    icon = Column(String(10))
    image_url = Column(Text)
    sort_order = Column(Integer, default=0)
    products = relationship("Product", back_populates="category", lazy="select")

class Product(Base, TimestampMixin):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, index=True)
    brand = Column(String(100))
    category_id = Column(Integer, ForeignKey("categories.id"))
    description = Column(Text)
    image_url = Column(Text)
    quantity_label = Column(String(50))
    price = Column(Float, nullable=False)
    original_price = Column(Float)
    discount_pct = Column(Integer, default=0)
    stock = Column(Integer, default=100)
    is_available = Column(Boolean, default=True)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=True)
    shelf_x = Column(Float, nullable=True)
    shelf_y = Column(Float, nullable=True)
    category = relationship("Category", back_populates="products")
    shelf = relationship("Shelf", back_populates="products")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
