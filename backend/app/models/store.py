from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class StoreSection(Base, TimestampMixin):
    __tablename__ = "store_sections"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    color = Column(String(7), default="#E5F7E5")
    x = Column(Float); y = Column(Float)
    width = Column(Float); height = Column(Float)
    aisles = relationship("Aisle", back_populates="section", lazy="select")

class Aisle(Base, TimestampMixin):
    __tablename__ = "aisles"
    id = Column(Integer, primary_key=True)
    section_id = Column(Integer, ForeignKey("store_sections.id"))
    name = Column(String(100), nullable=False)
    aisle_number = Column(Integer)
    section = relationship("StoreSection", back_populates="aisles")
    shelves = relationship("Shelf", back_populates="aisle", lazy="select")

class Shelf(Base, TimestampMixin):
    __tablename__ = "shelves"
    id = Column(Integer, primary_key=True)
    aisle_id = Column(Integer, ForeignKey("aisles.id"))
    name = Column(String(100))
    x = Column(Float); y = Column(Float)
    width = Column(Float, default=60); height = Column(Float, default=20)
    aisle = relationship("Aisle", back_populates="shelves")
    products = relationship("Product", back_populates="shelf")

class WalkableNode(Base):
    __tablename__ = "walkable_nodes"
    id = Column(Integer, primary_key=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    label = Column(String(100))

class WalkableEdge(Base):
    __tablename__ = "walkable_edges"
    id = Column(Integer, primary_key=True)
    from_node_id = Column(Integer, ForeignKey("walkable_nodes.id"))
    to_node_id = Column(Integer, ForeignKey("walkable_nodes.id"))
    weight = Column(Float)
