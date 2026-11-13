from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class UserPreference(Base, TimestampMixin):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    dietary_preferences = Column(String(255), default="")  # e.g. "vegetarian, gluten-free"
    default_budget = Column(Float, default=500.0)
    memory_enabled = Column(Boolean, default=True)

class Memory(Base, TimestampMixin):
    """
    Long-term memory storing selective user facts, preferences, and recurring context.
    Embeddings stored as JSON serialized array of floats (works on both SQLite and PostgreSQL).
    """
    __tablename__ = "memories"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String(50), default="preference") # "preference", "fact", "diet", "habit"
    fact_text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True) # [float, ...]
    importance = Column(Float, default=1.0)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
