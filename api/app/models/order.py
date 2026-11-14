from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin
import enum

class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    packed = "packed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"

class Order(Base, TimestampMixin):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default=OrderStatus.pending)
    subtotal = Column(Float, nullable=False)
    delivery_charge = Column(Float, default=0)
    total = Column(Float, nullable=False)
    address_id = Column(Integer, ForeignKey("addresses.id"))
    payment_method = Column(String(50), default="cod")
    notes = Column(Text)
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", lazy="select")

class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
