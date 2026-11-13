from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class Document(Base, TimestampMixin):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # "pdf", "docx", "txt"
    file_size = Column(Integer, default=0)
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan", lazy="select")

class DocumentChunk(Base, TimestampMixin):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True) # [float, ...]
    document = relationship("Document", back_populates="chunks")
