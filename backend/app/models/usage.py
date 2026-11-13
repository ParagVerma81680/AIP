from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, JSON
from app.core.database import Base
from app.models.base import TimestampMixin

class ApiUsage(Base, TimestampMixin):
    __tablename__ = "api_usage"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    provider = Column(String(50), default="groq")
    model = Column(String(100), nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)

class Feedback(Base, TimestampMixin):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    rating = Column(Integer, nullable=False) # 1 to 5
    comment = Column(Text, nullable=True)
